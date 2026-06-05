import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Gauge,
  LifeBuoy,
  Printer,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Badge } from '../components/ui/Badge'
import {
  currentAdvisor,
  headlineMetrics,
  performanceSeries,
  seoSnapshot,
  trafficSources,
} from '../data/mockData'
import { useAppState } from '../state/AppState'
import { formatDate, relativeDay } from '../lib/format'
import { orderStatusMeta, postStatusMeta } from '../lib/status'

const metricIcons = [
  <Users size={20} key="u" />,
  <CalendarCheck size={20} key="c" />,
  <UserPlus size={20} key="l" />,
  <Clock size={20} key="t" />,
]

const sourceColors = ['#1f48f0', '#3366ff', '#598dff', '#8eb6ff', '#bcd3ff']

export function Dashboard() {
  const { posts, orders, tickets } = useAppState()

  const pendingPosts = posts.filter((p) => p.status === 'pending')
  const openTickets = tickets.filter((t) => t.status !== 'resolved')
  const activeOrders = orders.filter((o) => o.status !== 'delivered')
  const lastAudit = formatDate(seoSnapshot.lastAuditDate)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Welcome back, {currentAdvisor.name.split(' ')[0]} 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's how {currentAdvisor.firm}'s marketing is performing this month, managed
          by {currentAdvisor.accountManager} and the OneStop team.
        </p>
      </div>

      {/* Feature 1: headline metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {headlineMetrics.map((m, i) => (
          <StatCard key={m.label} metric={m} icon={metricIcons[i]} invertTrend={i === 3} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Performance over time"
            subtitle="Visitors, appointments & leads — last 6 months"
            icon={<TrendingUp size={18} />}
          />
          <div className="px-2 py-4">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={performanceSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1f48f0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1f48f0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" width={44} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="#1f48f0"
                  strokeWidth={2}
                  fill="url(#gVisitors)"
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  name="Appointments"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-4 pb-1 pt-2 text-xs text-slate-500">
              <Legend color="#1f48f0" label="Visitors" />
              <Legend color="#10b981" label="Leads" />
              <Legend color="#f59e0b" label="Appointments" />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Where visitors come from"
            subtitle="This month by channel"
            icon={<Users size={18} />}
          />
          <div className="px-2 py-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={trafficSources}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="source"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={92}
                  stroke="#64748b"
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="visitors" name="Visitors" radius={[0, 6, 6, 0]}>
                  {trafficSources.map((_, i) => (
                    <Cell key={i} fill={sourceColors[i % sourceColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* At-a-glance widgets linking to other features */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Posts to approve */}
        <Card className="flex flex-col">
          <CardHeader
            title="Posts awaiting your approval"
            icon={<CalendarCheck size={18} />}
            action={
              pendingPosts.length > 0 ? (
                <Badge tone="amber">{pendingPosts.length} pending</Badge>
              ) : (
                <Badge tone="green">All clear</Badge>
              )
            }
          />
          <div className="flex-1 divide-y divide-slate-100">
            {pendingPosts.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{p.title}</p>
                  <p className="text-xs text-slate-500">
                    {p.channel} · {relativeDay(p.scheduledFor)}
                  </p>
                </div>
                <Badge tone={postStatusMeta[p.status].tone}>{p.channel}</Badge>
              </div>
            ))}
            {pendingPosts.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                Nothing to review right now.
              </p>
            )}
          </div>
          <FooterLink to="/content" label="Review all content" />
        </Card>

        {/* Active orders */}
        <Card className="flex flex-col">
          <CardHeader
            title="Print orders in progress"
            icon={<Printer size={18} />}
            action={<Badge tone="blue">{activeOrders.length} active</Badge>}
          />
          <div className="flex-1 divide-y divide-slate-100">
            {activeOrders.slice(0, 3).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{o.productName}</p>
                  <p className="text-xs text-slate-500">
                    {o.quantity.toLocaleString()} units · {o.id}
                  </p>
                </div>
                <Badge tone={orderStatusMeta[o.status].tone}>
                  {orderStatusMeta[o.status].label}
                </Badge>
              </div>
            ))}
            {activeOrders.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-slate-400">
                No active orders.
              </p>
            )}
          </div>
          <FooterLink to="/print" label="Order print material" />
        </Card>

        {/* SEO + Support stacked */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="SEO health" icon={<Gauge size={18} />} />
            <div className="flex items-center gap-4 px-5 py-4">
              <ScoreRing score={seoSnapshot.overallScore} />
              <div className="text-sm">
                <p className="font-medium text-slate-800">
                  Up {seoSnapshot.overallScore - seoSnapshot.previousScore} pts this month
                </p>
                <p className="text-xs text-slate-500">Last audit {lastAudit}</p>
                <Link
                  to="/seo"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View SEO report <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Open support requests"
              icon={<LifeBuoy size={18} />}
              action={<Badge tone={openTickets.length ? 'amber' : 'green'}>{openTickets.length}</Badge>}
            />
            <div className="px-5 py-4">
              {openTickets.length > 0 ? (
                <p className="text-sm text-slate-600">
                  {openTickets.length} request{openTickets.length > 1 ? 's' : ''} with your team.
                </p>
              ) : (
                <p className="text-sm text-slate-400">No open requests.</p>
              )}
              <FooterLink to="/support" label="Manage requests" inline />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function FooterLink({ to, label, inline }: { to: string; label: string; inline?: boolean }) {
  return (
    <Link
      to={to}
      className={
        'inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 ' +
        (inline ? 'mt-2' : 'border-t border-slate-100 px-5 py-3')
      }
    >
      {label}
      <ArrowRight size={15} />
    </Link>
  )
}

function ScoreRing({ score }: { score: number }) {
  const radius = 26
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900">
        {score}
      </div>
    </div>
  )
}
