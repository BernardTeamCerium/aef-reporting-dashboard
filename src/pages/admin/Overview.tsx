import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  LifeBuoy,
  Package,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAdvisors } from '../../state/Advisors'
import { useAuth } from '../../state/Auth'
import { formatCurrency, formatDate } from '../../lib/format'
import { initialsOf } from '../../lib/reviewsUtil'

export function AdminOverview() {
  const { advisors } = useAdvisors()
  const { user } = useAuth()
  const navigate = useNavigate()

  const totals = {
    advisors: advisors.length,
    active: advisors.filter((a) => a.status === 'active').length,
    clients: advisors.reduce((s, a) => s + a.clients.length, 0),
    leads: advisors.reduce((s, a) => s + a.metrics.leads, 0),
  }

  const pendingContent = advisors.flatMap((a) =>
    a.content.filter((c) => c.status === 'pending').map((c) => ({ a, c })),
  )
  const recentOrders = advisors
    .flatMap((a) => a.orders.map((o) => ({ a, o })))
    .sort((x, y) => y.o.submittedOn.localeCompare(x.o.submittedOn))
    .slice(0, 5)
  const openSupport = advisors
    .flatMap((a) => a.support.filter((s) => s.status !== 'resolved').map((s) => ({ a, s })))
    .sort((x, y) => y.s.createdOn.localeCompare(x.s.createdOn))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Welcome back, {user?.fullName?.split(' ')[0] ?? 'team'} 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Everything OneStop is managing across {totals.advisors} advisor
          {totals.advisors === 1 ? '' : 's'} — content to push, orders, and support in one place.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Briefcase size={18} />} value={totals.active} label="Active advisors" />
        <Kpi icon={<Users size={18} />} value={totals.clients} label="Total clients" />
        <Kpi icon={<TrendingUp size={18} />} value={totals.leads.toLocaleString()} label="Leads (30d)" />
        <Kpi icon={<CalendarCheck size={18} />} value={pendingContent.length} label="Content pending approval" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Content awaiting approval */}
        <Card className="flex flex-col">
          <CardHeader
            title="Content awaiting advisor approval"
            subtitle="Posts you've pushed that advisors still need to approve"
            icon={<CalendarCheck size={18} />}
            action={pendingContent.length ? <Badge tone="amber">{pendingContent.length}</Badge> : <Badge tone="green">Clear</Badge>}
          />
          <div className="flex-1 divide-y divide-slate-100">
            {pendingContent.slice(0, 5).map(({ a, c }) => (
              <button
                key={c.id}
                onClick={() => navigate(`/admin/advisors/${a.id}`)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-500">{a.firm} · {c.channel}</p>
                </div>
                <Badge tone="blue">{c.channel}</Badge>
              </button>
            ))}
            {pendingContent.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-slate-400">Nothing awaiting approval.</p>
            )}
          </div>
        </Card>

        {/* Recent orders */}
        <Card className="flex flex-col">
          <CardHeader
            title="Recent orders"
            subtitle="Print & service orders across all advisors"
            icon={<Package size={18} />}
          />
          <div className="flex-1 divide-y divide-slate-100">
            {recentOrders.map(({ a, o }) => (
              <button
                key={o.id}
                onClick={() => navigate(`/admin/advisors/${a.id}`)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{o.item}</p>
                  <p className="text-xs text-slate-500">{a.firm} · {formatDate(o.submittedOn)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">{formatCurrency(o.cost)}</span>
                  <Badge tone="purple">{o.status.replace('_', ' ')}</Badge>
                </div>
              </button>
            ))}
            {recentOrders.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No orders yet.</p>
            )}
          </div>
        </Card>

        {/* Open support */}
        <Card className="flex flex-col">
          <CardHeader
            title="Open support requests"
            subtitle="Across all advisors"
            icon={<LifeBuoy size={18} />}
            action={openSupport.length ? <Badge tone="amber">{openSupport.length}</Badge> : <Badge tone="green">Clear</Badge>}
          />
          <div className="flex-1 divide-y divide-slate-100">
            {openSupport.slice(0, 5).map(({ a, s }) => (
              <button
                key={s.id}
                onClick={() => navigate(`/admin/advisors/${a.id}`)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{s.subject}</p>
                  <p className="text-xs text-slate-500">{a.firm} · {s.type}</p>
                </div>
                <Badge tone={s.priority === 'high' || s.priority === 'urgent' ? 'red' : 'gray'}>{s.priority}</Badge>
              </button>
            ))}
            {openSupport.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No open requests.</p>
            )}
          </div>
        </Card>

        {/* Advisors quick list */}
        <Card className="flex flex-col">
          <CardHeader
            title="Advisors"
            subtitle="Jump into any account"
            icon={<Briefcase size={18} />}
            action={
              <Link to="/admin/advisors" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="flex-1 divide-y divide-slate-100">
            {advisors.slice(0, 5).map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/admin/advisors/${a.id}`)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {initialsOf(a.firm)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{a.firm}</p>
                    <p className="text-xs text-slate-500">{a.clients.length} clients</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                  <Star size={13} className="fill-amber-400 text-amber-400" /> {a.metrics.avgRating || '—'}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <Card className="p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>
      <p className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  )
}
