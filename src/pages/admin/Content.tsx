import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CheckCircle2, CircleDashed, RefreshCcw } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { useAdvisors, type ContentStatus, type AdvisorAccount, type AdvisorContent } from '../../state/Advisors'
import { formatDate, cx } from '../../lib/format'

const columns: { status: ContentStatus; label: string; icon: React.ReactNode; accent: string }[] = [
  { status: 'pending', label: 'Awaiting approval', icon: <CircleDashed size={16} />, accent: 'text-amber-600' },
  { status: 'approved', label: 'Approved & scheduled', icon: <CheckCircle2 size={16} />, accent: 'text-emerald-600' },
  { status: 'changes_requested', label: 'Changes requested', icon: <RefreshCcw size={16} />, accent: 'text-rose-600' },
]

export function AdminContent() {
  const { advisors } = useAdvisors()

  const all = useMemo(
    () => advisors.flatMap((a) => a.content.map((c) => ({ a, c }))),
    [advisors],
  )

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        The content pipeline across every advisor — what's waiting on approval, what's approved and
        scheduled to publish, and what's been sent back for changes.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {columns.map((col) => {
          const items = all
            .filter(({ c }) => c.status === col.status)
            .sort((x, y) => x.c.scheduledFor.localeCompare(y.c.scheduledFor))
          return (
            <div key={col.status} className="rounded-2xl bg-slate-100/70 p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className={cx('flex items-center gap-1.5 text-sm font-semibold', col.accent)}>
                  {col.icon} {col.label}
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.map(({ a, c }) => (
                  <ContentCard key={c.id} advisor={a} item={c} />
                ))}
                {items.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-slate-400">Nothing here.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ContentCard({ advisor, item }: { advisor: AdvisorAccount; item: AdvisorContent }) {
  return (
    <Link
      to={`/admin/advisors/${advisor.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{item.title}</p>
        <Badge tone="blue">{item.channel}</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-500">{advisor.firm}</p>
      <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-400">
        <CalendarCheck size={12} /> {formatDate(item.scheduledFor)}
      </p>
    </Link>
  )
}
