import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Gauge,
  Minus,
  Pencil,
  Plus,
  Plug,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  Trash2,
  Users,
} from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import {
  useAdvisors,
  type AdvisorAccount,
  type AdvisorKeyword,
  type AnalyticsSource,
} from '../../state/Advisors'
import { useAuth } from '../../state/Auth'
import { cx, formatDate } from '../../lib/format'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function AdvisorAnalytics({ advisor }: { advisor: AdvisorAccount }) {
  const { updateAdvisor } = useAdvisors()
  const notify = useToast()
  const [metricsOpen, setMetricsOpen] = useState(false)
  const [trafficOpen, setTrafficOpen] = useState(false)

  const isGA = advisor.integration.source === 'google_analytics'

  return (
    <div className="space-y-4">
      {/* Source banner */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2 text-slate-600">
          <Plug size={16} className="text-brand-600" />
          Data source:{' '}
          <Badge tone={isGA ? 'green' : 'gray'}>{isGA ? 'Google Analytics' : 'Manual entry'}</Badge>
          {advisor.integration.lastSyncedAt && (
            <span className="text-xs text-slate-400">· synced {formatDate(advisor.integration.lastSyncedAt)}</span>
          )}
        </span>
        <span className="text-xs text-slate-400">
          You can override any number manually at any time.
        </span>
      </div>

      {/* Traffic metrics */}
      <Card>
        <CardHeader
          title="Traffic & performance"
          subtitle="Site visitors, leads, appointments & scores"
          icon={<TrendingUp size={18} />}
          action={<Button size="sm" variant="secondary" onClick={() => setMetricsOpen(true)}><Pencil size={13} /> Edit</Button>}
        />
        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCell label="Visitors" value={advisor.metrics.visitors.toLocaleString()} icon={<Users size={15} />} />
          <MetricCell label="Leads" value={advisor.metrics.leads.toLocaleString()} icon={<TrendingUp size={15} />} />
          <MetricCell label="Appointments" value={advisor.metrics.appointments} icon={<TrendingUp size={15} />} />
          <MetricCell label="SEO score" value={`${advisor.metrics.seoScore}/100`} icon={<Gauge size={15} />} />
          <MetricCell label="Avg rating" value={advisor.metrics.avgRating || '—'} icon={<Star size={15} />} />
          <MetricCell label="Reviews" value={advisor.metrics.reviews} icon={<Star size={15} />} />
        </div>
      </Card>

      {/* Traffic sources */}
      <Card>
        <CardHeader
          title="Traffic sources"
          subtitle="Visitor breakdown by channel"
          icon={<Users size={18} />}
          action={<Button size="sm" variant="secondary" onClick={() => setTrafficOpen(true)}><Pencil size={13} /> Edit</Button>}
        />
        <div className="space-y-2.5 p-5">
          {advisor.trafficSources.length === 0 && <p className="text-sm text-slate-400">No sources yet — click Edit to add them.</p>}
          {advisor.trafficSources.map((t) => {
            const max = Math.max(1, ...advisor.trafficSources.map((s) => s.visitors))
            return (
              <div key={t.source}>
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{t.source}</span>
                  <span>{t.visitors.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(t.visitors / max) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Keyword rankings */}
      <KeywordEditor advisor={advisor} />

      {/* Integration */}
      <IntegrationCard advisor={advisor} />

      <MetricsModal advisor={advisor} open={metricsOpen} onClose={() => setMetricsOpen(false)} onSave={(metrics) => { updateAdvisor(advisor.id, { metrics }); notify('Metrics updated.') }} />
      <TrafficModal advisor={advisor} open={trafficOpen} onClose={() => setTrafficOpen(false)} onSave={(trafficSources) => { updateAdvisor(advisor.id, { trafficSources }); notify('Traffic sources updated.') }} />
    </div>
  )
}

function MetricCell({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</div>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

// --- Keyword editor -------------------------------------------------------
function KeywordEditor({ advisor }: { advisor: AdvisorAccount }) {
  const { updateAdvisor } = useAdvisors()
  const notify = useToast()
  const [draft, setDraft] = useState<AdvisorKeyword[]>(advisor.keywords)
  const [dirty, setDirty] = useState(false)

  // Reset the draft if the advisor changes (e.g. after an external update).
  useEffect(() => {
    setDraft(advisor.keywords)
    setDirty(false)
  }, [advisor.id, advisor.keywords])

  const set = (id: string, patch: Partial<AdvisorKeyword>) => {
    setDraft((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)))
    setDirty(true)
  }
  const add = () => {
    setDraft((prev) => [
      ...prev,
      { id: 'kw-' + Math.random().toString(36).slice(2, 8), term: '', currentRank: 0, previousRank: 0, searchVolume: 0 },
    ])
    setDirty(true)
  }
  const remove = (id: string) => {
    setDraft((prev) => prev.filter((k) => k.id !== id))
    setDirty(true)
  }
  const save = () => {
    updateAdvisor(advisor.id, { keywords: draft.filter((k) => k.term.trim()) })
    setDirty(false)
    notify('Keyword rankings saved.')
  }

  return (
    <Card>
      <CardHeader
        title="Keyword rankings"
        subtitle="Search terms and their positions — override any value manually"
        icon={<Search size={18} />}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={add}><Plus size={13} /> Add</Button>
            <Button size="sm" onClick={save} disabled={!dirty}>Save</Button>
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Keyword</th>
              <th className="px-5 py-3 font-medium">Volume/mo</th>
              <th className="px-5 py-3 font-medium">Current rank</th>
              <th className="px-5 py-3 font-medium">Previous</th>
              <th className="px-5 py-3 font-medium">Change</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {draft.map((k) => {
              const change = k.previousRank - k.currentRank
              return (
                <tr key={k.id}>
                  <td className="px-5 py-2">
                    <input value={k.term} onChange={(e) => set(k.id, { term: e.target.value })} placeholder="keyword" className={cx(inputCls, 'min-w-[180px]')} />
                  </td>
                  <td className="px-5 py-2">
                    <input type="number" value={k.searchVolume} onChange={(e) => set(k.id, { searchVolume: Number(e.target.value) })} className={cx(inputCls, 'w-24')} />
                  </td>
                  <td className="px-5 py-2">
                    <input type="number" value={k.currentRank} onChange={(e) => set(k.id, { currentRank: Number(e.target.value) })} className={cx(inputCls, 'w-20')} />
                  </td>
                  <td className="px-5 py-2">
                    <input type="number" value={k.previousRank} onChange={(e) => set(k.id, { previousRank: Number(e.target.value) })} className={cx(inputCls, 'w-20')} />
                  </td>
                  <td className="px-5 py-2">
                    <span className={cx('inline-flex items-center gap-0.5 text-xs font-semibold', change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-400')}>
                      {change > 0 ? <ArrowUp size={13} /> : change < 0 ? <ArrowDown size={13} /> : <Minus size={13} />}
                      {change !== 0 ? Math.abs(change) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-right">
                    <button onClick={() => remove(k.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove keyword"><Trash2 size={15} /></button>
                  </td>
                </tr>
              )
            })}
            {draft.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">No keywords tracked. Click “Add”.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// --- Integration ----------------------------------------------------------
function IntegrationCard({ advisor }: { advisor: AdvisorAccount }) {
  const { updateAdvisor } = useAdvisors()
  const { getAccessToken, demoMode } = useAuth()
  const notify = useToast()
  const [source, setSource] = useState<AnalyticsSource>(advisor.integration.source)
  const [gaPropertyId, setGaPropertyId] = useState(advisor.integration.gaPropertyId ?? '')
  const [searchConsoleUrl, setSearchConsoleUrl] = useState(advisor.integration.searchConsoleUrl ?? '')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setSource(advisor.integration.source)
    setGaPropertyId(advisor.integration.gaPropertyId ?? '')
    setSearchConsoleUrl(advisor.integration.searchConsoleUrl ?? '')
  }, [advisor.id, advisor.integration])

  const save = () => {
    updateAdvisor(advisor.id, {
      integration: { ...advisor.integration, source, gaPropertyId: gaPropertyId.trim() || undefined, searchConsoleUrl: searchConsoleUrl.trim() || undefined },
    })
    notify('Integration settings saved.')
  }

  const sync = async () => {
    if (demoMode) {
      notify('Live sync needs the deployed backend (Supabase + Google). It works once connected.')
      return
    }
    if (source !== 'google_analytics') {
      notify('Switch the source to Google Analytics and save first.')
      return
    }
    if (!gaPropertyId.trim() && !searchConsoleUrl.trim()) {
      notify('Add a GA4 Property ID or Search Console URL first.')
      return
    }
    setSyncing(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/admin/sync-analytics', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ gaPropertyId: gaPropertyId.trim(), searchConsoleUrl: searchConsoleUrl.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Sync failed.')

      const patch: Partial<AdvisorAccount> = {
        integration: { ...advisor.integration, source, gaPropertyId, searchConsoleUrl, lastSyncedAt: new Date().toISOString().slice(0, 10) },
      }
      if (typeof data.visitors === 'number') patch.metrics = { ...advisor.metrics, visitors: data.visitors }
      if (Array.isArray(data.trafficSources) && data.trafficSources.length) patch.trafficSources = data.trafficSources
      if (Array.isArray(data.keywords) && data.keywords.length) patch.keywords = data.keywords
      updateAdvisor(advisor.id, patch)
      notify('Synced from Google. You can still override any number manually.')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Data source & sync" subtitle="Connect Google Analytics / Search Console, or keep it manual" icon={<Plug size={18} />} />
      <div className="space-y-4 p-5">
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Analytics source</span>
          <div className="flex gap-2">
            {([['manual', 'Manual entry'], ['google_analytics', 'Google Analytics']] as [AnalyticsSource, string][]).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setSource(val)}
                className={cx('flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition-colors', source === val ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {source === 'google_analytics' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">GA4 Property ID</span>
              <input value={gaPropertyId} onChange={(e) => setGaPropertyId(e.target.value)} placeholder="e.g. 481234567" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Search Console site URL</span>
              <input value={searchConsoleUrl} onChange={(e) => setSearchConsoleUrl(e.target.value)} placeholder="https://firm.com/" className={inputCls} />
            </label>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save}>Save settings</Button>
          <Button variant="secondary" onClick={sync} disabled={syncing}>
            <RefreshCw size={15} className={syncing ? 'animate-spin' : undefined} /> {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        </div>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Recommended: <strong>Google Analytics 4</strong> for traffic and <strong>Google Search Console</strong> for
          keyword positions (both free). Live pull runs through a serverless function with a Google service account —
          until that's connected, numbers are whatever you enter here.
        </p>
      </div>
    </Card>
  )
}

// --- Modals ---------------------------------------------------------------
function MetricsModal({ advisor, open, onClose, onSave }: { advisor: AdvisorAccount; open: boolean; onClose: () => void; onSave: (m: AdvisorAccount['metrics']) => void }) {
  const [m, setM] = useState(advisor.metrics)
  useEffect(() => { setM(advisor.metrics) }, [advisor.metrics, open])

  const fields: [keyof AdvisorAccount['metrics'], string][] = [
    ['visitors', 'Site visitors'],
    ['leads', 'Leads (30d)'],
    ['appointments', 'Appointments'],
    ['seoScore', 'SEO score (0–100)'],
    ['avgRating', 'Avg rating (0–5)'],
    ['reviews', 'Reviews'],
  ]

  return (
    <Modal open={open} onClose={onClose} title="Edit traffic & performance" subtitle={advisor.firm} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { onSave(m); onClose() }}>Save</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
            <input type="number" step={key === 'avgRating' ? '0.1' : '1'} value={m[key]} onChange={(e) => setM({ ...m, [key]: Number(e.target.value) })} className={inputCls} />
          </label>
        ))}
      </div>
    </Modal>
  )
}

function TrafficModal({ advisor, open, onClose, onSave }: { advisor: AdvisorAccount; open: boolean; onClose: () => void; onSave: (t: AdvisorAccount['trafficSources']) => void }) {
  const [rows, setRows] = useState(advisor.trafficSources)
  useEffect(() => { setRows(advisor.trafficSources.length ? advisor.trafficSources : [{ source: '', visitors: 0 }]) }, [advisor.trafficSources, open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit traffic sources"
      subtitle={advisor.firm}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => { onSave(rows.filter((r) => r.source.trim())); onClose() }}>Save</Button></>}
    >
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <input value={r.source} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, source: e.target.value } : x))} placeholder="Channel (e.g. Organic Search)" className={cx(inputCls, 'flex-1')} />
            <input type="number" value={r.visitors} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, visitors: Number(e.target.value) } : x))} className={cx(inputCls, 'w-28')} />
            <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove"><Trash2 size={16} /></button>
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setRows([...rows, { source: '', visitors: 0 }])}><Plus size={13} /> Add channel</Button>
      </div>
    </Modal>
  )
}
