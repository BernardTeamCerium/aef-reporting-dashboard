import {
  FileText,
  Globe,
  Mail,
  Megaphone,
  Palette,
  Printer,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
} from 'lucide-react'
import type { AdvisorActivity, ActivityCategory } from '../../state/Advisors'
import type { BadgeTone } from '../ui/Badge'
import { Badge } from '../ui/Badge'
import { formatDate, cx } from '../../lib/format'

const meta: Record<ActivityCategory, { tone: BadgeTone; icon: React.ReactNode }> = {
  Content: { tone: 'blue', icon: <FileText size={14} /> },
  Print: { tone: 'purple', icon: <Printer size={14} /> },
  Website: { tone: 'teal', icon: <Globe size={14} /> },
  SEO: { tone: 'amber', icon: <TrendingUp size={14} /> },
  Ads: { tone: 'red', icon: <Megaphone size={14} /> },
  Design: { tone: 'purple', icon: <Palette size={14} /> },
  Email: { tone: 'blue', icon: <Mail size={14} /> },
  Strategy: { tone: 'gray', icon: <Target size={14} /> },
  Other: { tone: 'gray', icon: <Sparkles size={14} /> },
}

interface ActivityTimelineProps {
  items: AdvisorActivity[]
  /** When provided, shows a delete button per item (admin view). */
  onRemove?: (id: string) => void
  emptyText?: string
}

export function ActivityTimeline({ items, onRemove, emptyText }: ActivityTimelineProps) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date))

  if (sorted.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-slate-400">
        {emptyText ?? 'No activity logged yet.'}
      </p>
    )
  }

  return (
    <ol className="relative space-y-4 pl-6">
      {/* vertical line */}
      <span className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" aria-hidden />
      {sorted.map((a) => {
        const m = meta[a.category]
        return (
          <li key={a.id} className="relative">
            <span
              className={cx(
                'absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white',
                'bg-brand-50 text-brand-600',
              )}
            >
              {m.icon}
            </span>
            <div className="group flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={m.tone}>{a.category}</Badge>
                  <span className="text-xs text-slate-400">{formatDate(a.date)}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">{a.title}</p>
                {a.description && <p className="mt-0.5 text-sm text-slate-500">{a.description}</p>}
                {a.impact && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <TrendingUp size={12} /> {a.impact}
                  </p>
                )}
              </div>
              {onRemove && (
                <button
                  onClick={() => onRemove(a.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                  aria-label="Remove entry"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
