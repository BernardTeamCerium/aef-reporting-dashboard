import type { VercelRequest, VercelResponse } from '@vercel/node'
import { errorMessage, getServiceClient, HttpError, sendViaZapier } from '../_lib.js'

// Runs daily (Vercel Cron). Finds clients whose birthday is today, and — on a
// holiday — every client opted into holiday greetings, then sends each a
// message through the Zapier webhook. Protected by CRON_SECRET.

const HOLIDAYS: { name: string; md: string }[] = [
  { name: "New Year's Day", md: '01-01' },
  { name: "Valentine's Day", md: '02-14' },
  { name: 'Independence Day', md: '07-04' },
  { name: 'Thanksgiving', md: '11-27' },
  { name: 'Christmas', md: '12-25' },
]

interface WsClient {
  name: string
  email?: string
  phone?: string
  birthday?: string
  greetings?: { birthday?: boolean; holidays?: boolean }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret) throw new HttpError(500, 'CRON_SECRET is not configured.')
    if (req.headers.authorization !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const svc = getServiceClient()
    const { data: rows, error } = await svc.from('advisor_workspace').select('data')
    if (error) throw error

    const now = new Date()
    const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const holidayToday = HOLIDAYS.find((h) => h.md === md)

    let sent = 0
    let skipped = 0
    const first = (n: string) => n.trim().split(/\s+/)[0] || 'there'

    for (const row of rows ?? []) {
      const data = (row.data ?? {}) as { clients?: WsClient[]; settings?: { firmName?: string } }
      const firm = data.settings?.firmName ?? 'your advisor'
      const clients = data.clients ?? []

      for (const c of clients) {
        const to = c.email || c.phone
        if (!to) continue
        const channel: 'email' | 'sms' = c.email ? 'email' : 'sms'

        // Birthday
        if (c.greetings?.birthday && c.birthday && c.birthday.slice(5) === md) {
          const r = await sendViaZapier({
            purpose: 'birthday', channel, to, name: c.name, firm,
            subject: `Happy Birthday from ${firm}!`,
            body: `Happy birthday, ${first(c.name)}! Wishing you a wonderful day — from all of us at ${firm}.`,
          })
          r.sent ? sent++ : skipped++
        }

        // Holiday
        if (holidayToday && c.greetings?.holidays) {
          const r = await sendViaZapier({
            purpose: 'holiday', channel, to, name: c.name, firm,
            subject: `${holidayToday.name} from ${firm}`,
            body: `Wishing you a happy ${holidayToday.name} from all of us at ${firm}!`,
          })
          r.sent ? sent++ : skipped++
        }
      }
    }

    res.status(200).json({ ok: true, date: md, holiday: holidayToday?.name ?? null, sent, skipped })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
