import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Clock, LifeBuoy, PlayCircle } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAdvisors, type SupportReqStatus } from '../../state/Advisors'
import { formatDate } from '../../lib/format'

const statusMeta: Record<SupportReqStatus, { label: string; tone: BadgeTone }> = {
  open: { label: 'Open', tone: 'blue' },
  in_progress: { label: 'In progress', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'green' },
}
const prTone: Record<string, BadgeTone> = { low: 'gray', normal: 'blue', high: 'amber', urgent: 'red' }

type Filter = 'active' | 'open' | 'in_progress' | 'resolved' | 'all'

export function AdminSupport() {
  const { advisors, setSupportStatus } = useAdvisors()
  const notify = useToast()
  const [filter, setFilter] = useState<Filter>('active')

  const rows = useMemo(
    () =>
      advisors
        .flatMap((a) => a.support.map((s) => ({ a, s })))
        .sort((x, y) => y.s.createdOn.localeCompare(x.s.createdOn)),
    [advisors],
  )

  const visible = rows.filter(({ s }) =>
    filter === 'all' ? true : filter === 'active' ? s.status !== 'resolved' : s.status === filter,
  )
  const counts = {
    active: rows.filter((r) => r.s.status !== 'resolved').length,
    open: rows.filter((r) => r.s.status === 'open').length,
    in_progress: rows.filter((r) => r.s.status === 'in_progress').length,
    resolved: rows.filter((r) => r.s.status === 'resolved').length,
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'open', label: `Open (${counts.open})` },
    { key: 'in_progress', label: `In progress (${counts.in_progress})` },
    { key: 'resolved', label: `Resolved (${counts.resolved})` },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Every support request from every advisor, in one queue. Move each through open → in
        progress → resolved.
      </p>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ' +
              (filter === f.key
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50')
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title="Support queue" subtitle={`${visible.length} shown`} icon={<LifeBuoy size={18} />} />
        <div className="divide-y divide-slate-100">
          {visible.map(({ a, s }) => (
            <div key={s.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{s.subject}</p>
                  <Badge tone="gray">{s.type}</Badge>
                  <Badge tone={prTone[s.priority] ?? 'gray'}>{s.priority}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  <Link to={`/admin/advisors/${a.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                    {a.firm}
                  </Link>{' '}
                  · Opened {formatDate(s.createdOn)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={statusMeta[s.status].tone}>{statusMeta[s.status].label}</Badge>
                {s.status === 'open' && (
                  <Button size="sm" variant="secondary" onClick={() => { setSupportStatus(a.id, s.id, 'in_progress'); notify('Marked in progress.') }}>
                    <PlayCircle size={14} /> Start
                  </Button>
                )}
                {s.status === 'in_progress' && (
                  <Button size="sm" variant="success" onClick={() => { setSupportStatus(a.id, s.id, 'resolved'); notify('Marked resolved.') }}>
                    <Check size={14} /> Resolve
                  </Button>
                )}
                {s.status === 'resolved' && (
                  <Button size="sm" variant="ghost" onClick={() => { setSupportStatus(a.id, s.id, 'open'); notify('Reopened.') }}>
                    <Clock size={14} /> Reopen
                  </Button>
                )}
                <Link to={`/admin/advisors/${a.id}`} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600" aria-label="Open advisor">
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-slate-400">Nothing here — queue is clear. 🎉</p>
          )}
        </div>
      </Card>
    </div>
  )
}
