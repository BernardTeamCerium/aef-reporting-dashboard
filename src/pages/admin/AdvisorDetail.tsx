import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarCheck,
  Copy,
  ExternalLink,
  Gauge,
  LifeBuoy,
  Link2,
  Mail,
  Package,
  Phone,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { useAdvisors, type AdvisorContent } from '../../state/Advisors'
import { useNotify } from '../../state/Notifications'
import { AdvisorAnalytics } from './AdvisorAnalytics'
import { initialsOf } from '../../lib/reviewsUtil'
import { formatCurrency, formatDate, cx } from '../../lib/format'

type Tab = 'overview' | 'analytics' | 'content' | 'orders' | 'support' | 'clients' | 'reviews'

const contentStatusMeta: Record<AdvisorContent['status'], { label: string; tone: BadgeTone }> = {
  pending: { label: 'Awaiting approval', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  changes_requested: { label: 'Changes requested', tone: 'red' },
}

const origin = typeof window !== 'undefined' ? window.location.origin : ''

export function AdvisorDetail() {
  const { id = '' } = useParams()
  const { getAdvisor, addClientTo, removeClientFrom, addContentTo, removeContentFrom } = useAdvisors()
  const notify = useToast()
  const pushNotify = useNotify()
  const advisor = getAdvisor(id)
  const [tab, setTab] = useState<Tab>('overview')
  const [addClientOpen, setAddClientOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  if (!advisor) {
    return (
      <Card className="p-10 text-center text-sm text-slate-500">
        Advisor not found. <Link to="/admin/advisors" className="font-semibold text-brand-600">Back to advisors</Link>
      </Card>
    )
  }

  const m = advisor.metrics
  const reviewUrl = origin + advisor.reviewLink
  const pendingContent = advisor.content.filter((c) => c.status === 'pending').length
  const openSupport = advisor.support.filter((s) => s.status !== 'resolved').length

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'content', label: `Content${pendingContent ? ` (${pendingContent})` : ''}` },
    { key: 'orders', label: `Orders (${advisor.orders.length})` },
    { key: 'support', label: `Support${openSupport ? ` (${openSupport})` : ''}` },
    { key: 'clients', label: `Clients (${advisor.clients.length})` },
    { key: 'reviews', label: `Reviews (${advisor.reviews.length})` },
  ]

  const maxTraffic = Math.max(1, ...advisor.trafficSources.map((t) => t.visitors))

  return (
    <div className="space-y-5">
      <Link to="/admin/advisors" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> All advisors
      </Link>

      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-base font-semibold text-brand-700">
              {initialsOf(advisor.firm)}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{advisor.firm}</h2>
              <p className="text-sm text-slate-500">{advisor.name} · Managed by {advisor.accountManager}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={advisor.status === 'active' ? 'green' : 'amber'}>{advisor.status === 'active' ? 'Active' : 'Paused'}</Badge>
            <Badge tone="purple">{advisor.plan}</Badge>
            {advisor.website && (
              <a href={`https://${advisor.website}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">{advisor.website} <ExternalLink size={13} /></Button>
              </a>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><Mail size={12} /> {advisor.email}</span>
          <span className="inline-flex items-center gap-1"><Phone size={12} /> {advisor.phone}</span>
          <span>Joined {formatDate(advisor.joinedDate)}</span>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Metric icon={<Users size={18} />} value={m.visitors.toLocaleString()} label="Site visitors" />
            <Metric icon={<TrendingUp size={18} />} value={m.leads.toLocaleString()} label="Leads (30d)" />
            <Metric icon={<CalendarCheck size={18} />} value={m.appointments} label="Appointments" />
            <Metric icon={<Gauge size={18} />} value={`${m.seoScore}/100`} label="SEO score" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Review link + key links */}
            <Card>
              <CardHeader title="Key links" subtitle="Share these with the advisor" icon={<Link2 size={18} />} />
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">Review collection link</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{reviewUrl}</code>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(reviewUrl); notify('Review link copied.') }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Copy review link"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-600">Website</span>
                  {advisor.website ? (
                    <a href={`https://${advisor.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                      {advisor.website} <ExternalLink size={13} />
                    </a>
                  ) : <span className="text-sm text-slate-400">—</span>}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-600">Avg. rating</span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-800">
                    <Star size={13} className="fill-amber-400 text-amber-400" /> {m.avgRating || '—'} ({m.reviews})
                  </span>
                </div>
              </div>
            </Card>

            {/* Traffic */}
            <Card>
              <CardHeader title="Traffic sources" subtitle="Where their visitors come from" icon={<TrendingUp size={18} />} />
              <div className="space-y-2.5 p-5">
                {advisor.trafficSources.length === 0 && <p className="text-sm text-slate-400">No traffic data yet.</p>}
                {advisor.trafficSources.map((t) => (
                  <div key={t.source}>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{t.source}</span>
                      <span>{t.visitors.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(t.visitors / maxTraffic) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'analytics' && <AdvisorAnalytics advisor={advisor} />}

      {tab === 'content' && (
        <Card>
          <CardHeader
            title="Content"
            subtitle="Upload posts for this advisor to review & approve"
            icon={<CalendarCheck size={18} />}
            action={<Button size="sm" onClick={() => setUploadOpen(true)}><Upload size={14} /> Upload content</Button>}
          />
          <div className="divide-y divide-slate-100">
            {advisor.content.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{c.title}</p>
                    <Badge tone="blue">{c.channel}</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{c.body}</p>
                  <p className="mt-1 text-xs text-slate-400">Scheduled {formatDate(c.scheduledFor)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={contentStatusMeta[c.status].tone}>{contentStatusMeta[c.status].label}</Badge>
                  <button onClick={() => { removeContentFrom(advisor.id, c.id); notify('Content removed.') }} className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {advisor.content.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">No content uploaded yet.</p>}
          </div>
        </Card>
      )}

      {tab === 'orders' && (
        <Card>
          <CardHeader title="Orders" subtitle="Print & additional service orders" icon={<Package size={18} />} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Cost</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advisor.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{o.item}{o.quantity ? ` (${o.quantity.toLocaleString()})` : ''}</td>
                    <td className="px-5 py-3 text-slate-500">{o.category}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(o.submittedOn)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatCurrency(o.cost)}</td>
                    <td className="px-5 py-3"><Badge tone="purple">{o.status.replace('_', ' ')}</Badge></td>
                  </tr>
                ))}
                {advisor.orders.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'support' && (
        <Card>
          <CardHeader title="Support requests" subtitle="Digital, print, website & marketing help" icon={<LifeBuoy size={18} />} />
          <div className="divide-y divide-slate-100">
            {advisor.support.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{s.subject}</p>
                  <p className="text-xs text-slate-500">{s.type} · Opened {formatDate(s.createdOn)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={s.priority === 'high' || s.priority === 'urgent' ? 'red' : 'gray'}>{s.priority}</Badge>
                  <Badge tone={s.status === 'resolved' ? 'green' : s.status === 'in_progress' ? 'amber' : 'blue'}>{s.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
            {advisor.support.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">No support requests.</p>}
          </div>
        </Card>
      )}

      {tab === 'clients' && (
        <Card>
          <CardHeader
            title="Client book"
            subtitle={`${advisor.clients.length} clients for ${advisor.firm}`}
            icon={<Users size={18} />}
            action={<Button size="sm" onClick={() => setAddClientOpen(true)}><UserPlus size={14} /> Add client</Button>}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Review</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advisor.clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-5 py-3">
                      <div className="text-slate-600">{c.email || '—'}</div>
                      <div className="text-xs text-slate-400">{c.phone || '—'}</div>
                    </td>
                    <td className="px-5 py-3">
                      {c.reviewStatus === 'reviewed' ? <Badge tone="green">Reviewed</Badge> : c.reviewStatus === 'requested' ? <Badge tone="amber">Requested</Badge> : <Badge tone="gray">None</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => { removeClientFrom(advisor.id, c.id); notify(`Removed ${c.name}.`) }} className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${c.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {advisor.clients.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">No clients yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'reviews' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {advisor.reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">{r.clientName}</p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} className={n <= (r.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'} />)}
                </div>
              </div>
              <p className="text-sm text-slate-600">“{r.text}”</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{formatDate(r.createdAt)}</span>
                {r.postedToGoogle && <Badge tone="green">Posted to Google</Badge>}
              </div>
            </Card>
          ))}
          {advisor.reviews.length === 0 && <Card className="p-10 text-center text-sm text-slate-400 md:col-span-2">No reviews collected yet.</Card>}
        </div>
      )}

      <AddClientModal open={addClientOpen} onClose={() => setAddClientOpen(false)} onAdd={(input) => { addClientTo(advisor.id, input); notify(`${input.name} added.`) }} />
      <UploadContentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(input) => {
          addContentTo(advisor.id, input)
          notify(`"${input.title}" pushed to ${advisor.firm} for approval.`)
          pushNotify({
            audience: 'advisor',
            type: 'content_uploaded',
            title: 'New content to review',
            body: `"${input.title}" (${input.channel}) is ready for your approval.`,
            link: '/content',
            email: advisor.email,
          })
        }}
      />
    </div>
  )
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <Card className="p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>
      <p className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  )
}

function UploadContentModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean
  onClose: () => void
  onUpload: (input: { title: string; channel: AdvisorContent['channel']; scheduledFor: string; body: string }) => void
}) {
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState<AdvisorContent['channel']>('LinkedIn')
  const [scheduledFor, setScheduledFor] = useState('')
  const [body, setBody] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const channels: AdvisorContent['channel'][] = ['LinkedIn', 'Facebook', 'Instagram', 'Blog', 'Email']

  const submit = () => {
    if (!title.trim() || !body.trim()) { setErr('Title and content are required.'); return }
    onUpload({ title: title.trim(), channel, scheduledFor: scheduledFor || new Date().toISOString().slice(0, 10), body: body.trim() })
    setTitle(''); setChannel('LinkedIn'); setScheduledFor(''); setBody(''); setErr(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload content"
      subtitle="This goes to the advisor's dashboard for them to approve."
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}><Upload size={16} /> Push for approval</Button></>}
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-Year Market Check-In" className={inputCls} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Channel</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value as AdvisorContent['channel'])} className={inputCls}>
              {channels.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Scheduled date</span>
            <input type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className={inputCls} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Content</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Write the post copy…" className={cx(inputCls, 'resize-none')} />
        </label>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{err}</p>}
      </div>
    </Modal>
  )
}

function AddClientModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (input: { name: string; email: string; phone: string; birthday?: string }) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const submit = () => {
    if (!name.trim()) { setErr('Name is required.'); return }
    onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim(), birthday: birthday || undefined })
    setName(''); setEmail(''); setPhone(''); setBirthday(''); setErr(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add client"
      subtitle="Add a client to this advisor's book."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}><Plus size={16} /> Add client</Button></>}
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Birthday</span>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputCls} />
        </label>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{err}</p>}
      </div>
    </Modal>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
