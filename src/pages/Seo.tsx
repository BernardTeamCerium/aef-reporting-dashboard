import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Gauge,
  Link2,
  Minus,
  ScrollText,
  Search,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { BadgeTone } from '../components/ui/Badge'
import { seoSnapshot, currentAdvisor } from '../data/mockData'
import { formatDate } from '../lib/format'
import { cx } from '../lib/format'
import type { Keyword } from '../types'

const severityTone: Record<'low' | 'medium' | 'high', BadgeTone> = {
  low: 'gray',
  medium: 'amber',
  high: 'red',
}

export function Seo() {
  const s = seoSnapshot
  const scoreDelta = s.overallScore - s.previousScore
  const onPageOne = s.keywords.filter((k) => k.onPageOne).length

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Search visibility for{' '}
        <span className="font-medium text-slate-700">{currentAdvisor.website}</span>. Last
        audited {formatDate(s.lastAuditDate)} by the OneStop SEO team.
      </p>

      {/* Score + summary tiles */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5 lg:col-span-1">
          <ScoreDial score={s.overallScore} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              SEO Score
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
              <ArrowUp size={14} /> {scoreDelta} pts vs last month
            </p>
          </div>
        </Card>

        <SummaryTile
          icon={<ScrollText size={18} />}
          label="Indexed pages"
          value={s.indexedPages.toLocaleString()}
        />
        <SummaryTile
          icon={<Link2 size={18} />}
          label="Backlinks"
          value={s.backlinks.toLocaleString()}
        />
        <SummaryTile
          icon={<Gauge size={18} />}
          label="Domain authority"
          value={`${s.domainAuthority}/100`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Rank trend */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Average keyword rank"
            subtitle="Lower is better — your tracked keywords are climbing"
            icon={<TrendingUp size={18} />}
          />
          <div className="px-2 py-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={s.rankTrend} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                <YAxis
                  reversed
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#94a3b8"
                  width={36}
                  domain={[1, 'dataMax + 4']}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`#${v}`, 'Avg rank']}
                />
                <Line
                  type="monotone"
                  dataKey="avgRank"
                  stroke="#1f48f0"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#1f48f0' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Health + issues */}
        <Card>
          <CardHeader title="Site health" icon={<CheckCircle2 size={18} />} />
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 text-sm">
              <span className="font-medium text-emerald-800">Core Web Vitals</span>
              <Badge tone={s.coreWebVitalsPassing ? 'green' : 'red'}>
                {s.coreWebVitalsPassing ? 'Passing' : 'Needs work'}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5 text-sm">
              <span className="font-medium text-brand-800">Keywords on page 1</span>
              <span className="font-semibold text-brand-700">
                {onPageOne} of {s.keywords.length}
              </span>
            </div>
            <p className="pt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Open issues
            </p>
            {s.issues.map((issue) => (
              <div key={issue.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{issue.label}</span>
                <Badge tone={severityTone[issue.severity]}>{issue.count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Keyword table */}
      <Card>
        <CardHeader
          title="Keyword progression"
          subtitle="How your target search terms are ranking"
          icon={<Search size={18} />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Keyword</th>
                <th className="px-5 py-3 font-medium">Volume / mo</th>
                <th className="px-5 py-3 font-medium">Rank</th>
                <th className="px-5 py-3 font-medium">Change</th>
                <th className="px-5 py-3 font-medium">Page 1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.keywords.map((kw) => (
                <KeywordRow key={kw.id} kw={kw} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function KeywordRow({ kw }: { kw: Keyword }) {
  const change = kw.previousRank - kw.currentRank // positive = improved
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-3 font-medium text-slate-800">{kw.term}</td>
      <td className="px-5 py-3 text-slate-500">{kw.searchVolume.toLocaleString()}</td>
      <td className="px-5 py-3">
        <span className="font-semibold text-slate-900">#{kw.currentRank}</span>
      </td>
      <td className="px-5 py-3">
        <span
          className={cx(
            'inline-flex items-center gap-0.5 text-xs font-semibold',
            change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-400',
          )}
        >
          {change > 0 ? (
            <ArrowUp size={13} />
          ) : change < 0 ? (
            <ArrowDown size={13} />
          ) : (
            <Minus size={13} />
          )}
          {change !== 0 ? Math.abs(change) : '—'}
        </span>
      </td>
      <td className="px-5 py-3">
        {kw.onPageOne ? (
          <Badge tone="green">Yes</Badge>
        ) : (
          <Badge tone="gray">No</Badge>
        )}
      </td>
    </tr>
  )
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Card className="p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </Card>
  )
}

function ScoreDial({ score }: { score: number }) {
  const radius = 30
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-[10px] uppercase text-slate-400">/ 100</span>
      </div>
    </div>
  )
}
