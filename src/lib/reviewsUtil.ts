import type { Client, NewClientInput, ReviewSettings } from '../state/Clients'

// --- Public review link ---------------------------------------------------
export function publicReviewUrl(settings: ReviewSettings): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/r/${settings.slug}`
}

// --- Message templating ---------------------------------------------------
export function buildMessage(template: string, vars: { name: string; firm: string; link: string }): string {
  return template
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{firm\}\}/g, vars.firm)
    .replace(/\{\{link\}\}/g, vars.link)
}

/** A tel: number stripped to digits (+ allowed) for sms: links. */
export function telHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned
}

export function smsHref(phone: string, body: string): string {
  // Both `?` and `&` separators exist across platforms; `?` is the most common.
  return `sms:${telHref(phone)}?&body=${encodeURIComponent(body)}`
}

export function mailtoHref(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// --- CSV import -----------------------------------------------------------
// Accepts headers name/email/phone/birthday in any order; falls back to
// positional order (name, email, phone, birthday) when no header row.
export function parseClientsCsv(text: string): NewClientInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const splitRow = (row: string) =>
    row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))

  const first = splitRow(lines[0]).map((c) => c.toLowerCase())
  const hasHeader = first.some((c) => ['name', 'email', 'phone', 'birthday'].includes(c))

  const idx = {
    name: hasHeader ? first.indexOf('name') : 0,
    email: hasHeader ? first.indexOf('email') : 1,
    phone: hasHeader ? first.indexOf('phone') : 2,
    birthday: hasHeader ? first.findIndex((c) => c.includes('birth')) : 3,
  }

  const rows = hasHeader ? lines.slice(1) : lines
  const out: NewClientInput[] = []
  for (const row of rows) {
    const cells = splitRow(row)
    const name = idx.name >= 0 ? cells[idx.name] : ''
    if (!name) continue
    out.push({
      name,
      email: idx.email >= 0 ? cells[idx.email] ?? '' : '',
      phone: idx.phone >= 0 ? cells[idx.phone] ?? '' : '',
      birthday: idx.birthday >= 0 ? normalizeBirthday(cells[idx.birthday]) : undefined,
    })
  }
  return out
}

/** Best-effort parse of a birthday cell into YYYY-MM-DD. */
function normalizeBirthday(raw?: string): string | undefined {
  if (!raw) return undefined
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // MM/DD/YYYY or M/D/YYYY
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (m) {
    const [, mm, dd, yy] = m
    const year = yy.length === 2 ? `19${yy}` : yy
    return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
  }
  return undefined
}

// --- Occasions (birthdays + holidays) -------------------------------------
export interface Holiday {
  name: string
  /** MM-DD */
  monthDay: string
}

// A curated set of common US holidays used to preview automated greetings.
export const HOLIDAYS: Holiday[] = [
  { name: "New Year's Day", monthDay: '01-01' },
  { name: "Valentine's Day", monthDay: '02-14' },
  { name: 'Independence Day', monthDay: '07-04' },
  { name: 'Thanksgiving', monthDay: '11-27' },
  { name: 'Christmas', monthDay: '12-25' },
]

export interface Occasion {
  kind: 'birthday' | 'holiday'
  label: string
  /** The client this applies to (birthdays only). */
  client?: Client
  date: Date
  daysAway: number
}

function monthDayOf(iso: string): { m: number; d: number } | null {
  const m = iso.match(/^\d{4}-(\d{2})-(\d{2})$/)
  if (!m) return null
  return { m: Number(m[1]), d: Number(m[2]) }
}

/** The next occurrence (today or later) of a month/day, from `from`. */
export function nextOccurrence(month: number, day: number, from: Date): Date {
  const year = from.getFullYear()
  let date = new Date(year, month - 1, day)
  const startOfDay = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  if (date < startOfDay) date = new Date(year + 1, month - 1, day)
  return date
}

export function daysBetween(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

/** Upcoming birthdays + holidays within `windowDays`, soonest first. */
export function upcomingOccasions(clients: Client[], windowDays = 45): Occasion[] {
  const now = new Date()
  const out: Occasion[] = []

  for (const c of clients) {
    if (!c.greetings.birthday || !c.birthday) continue
    const md = monthDayOf(c.birthday)
    if (!md) continue
    const date = nextOccurrence(md.m, md.d, now)
    const daysAway = daysBetween(now, date)
    if (daysAway <= windowDays) {
      out.push({ kind: 'birthday', label: `${c.name}'s birthday`, client: c, date, daysAway })
    }
  }

  const anyHolidayOptIn = clients.some((c) => c.greetings.holidays)
  if (anyHolidayOptIn) {
    for (const h of HOLIDAYS) {
      const [mm, dd] = h.monthDay.split('-').map(Number)
      const date = nextOccurrence(mm, dd, now)
      const daysAway = daysBetween(now, date)
      if (daysAway <= windowDays) {
        out.push({ kind: 'holiday', label: h.name, date, daysAway })
      }
    }
  }

  return out.sort((a, b) => a.daysAway - b.daysAway)
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}
