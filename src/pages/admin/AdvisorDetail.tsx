import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarCheck,
  ExternalLink,
  Gauge,
  Mail,
  Phone,
  Plus,
  Star,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { useAdvisors } from '../../state/Advisors'
import { initialsOf } from '../../lib/reviewsUtil'
import { formatDate, cx } from '../../lib/format'

type Tab = 'overview' | 'clients' | 'reviews'

export function AdvisorDetail() {
  const { id = '' } = useParams()
  const { getAdvisor, addClientTo, removeClientFrom } = useAdvisors()
  const notify = useToast()
  const advisor = getAdvisor(id)
  const [tab, setTab] = useState<Tab>('overview')
  const [addOpen, setAddOpen] = useState(false)

  if (!advisor) {
    return (
      <Card className="p-10 text-center text-sm text-slate-500">
        Advisor not found. <Link to="/admin" className="font-semibold text-brand-600">Back to advisors</Link>
      </Card>
    )
  }

  const m = advisor.metrics
  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'clients', label: `Clients (${advisor.clients.length})` },
    { key: 'reviews', label: `Reviews (${advisor.reviews.length})` },
  ]

  return (
    <div className="space-y-5">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
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
              <p className="text-sm text-slate-500">
                {advisor.name} · Managed by {advisor.accountManager}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={advisor.status === 'active' ? 'green' : 'amber'}>
              {advisor.status === 'active' ? 'Active' : 'Paused'}
            </Badge>
            <Badge tone="purple">{advisor.plan}</Badge>
            {advisor.website && (
              <a href={`https://${advisor.website}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">
                  {advisor.website} <ExternalLink size={13} />
                </Button>
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
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Metric icon={<Star size={18} />} value={m.avgRating || '—'} label="Avg rating" />
            <Metric icon={<Star size={18} />} value={m.reviews} label="Reviews" />
            <Metric icon={<Users size={18} />} value={advisor.clients.length} label="Clients" />
          </div>
          <Card className="p-5 text-sm text-slate-500">
            This is the advisor's data as they see it in their own dashboard. When{' '}
            <span className="font-medium text-slate-700">{advisor.name}</span> signs in, they land on
            their personal dashboard with these tools and analytics — scoped to just their firm.
          </Card>
        </div>
      )}

      {tab === 'clients' && (
        <Card>
          <CardHeader
            title="Client book"
            subtitle={`${advisor.clients.length} clients for ${advisor.firm}`}
            icon={<Users size={18} />}
            action={
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus size={14} /> Add client
              </Button>
            }
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
                      {c.reviewStatus === 'reviewed' ? (
                        <Badge tone="green">Reviewed</Badge>
                      ) : c.reviewStatus === 'requested' ? (
                        <Badge tone="amber">Requested</Badge>
                      ) : (
                        <Badge tone="gray">None</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          removeClientFrom(advisor.id, c.id)
                          notify(`Removed ${c.name}.`)
                        }}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Remove ${c.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {advisor.clients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                      No clients yet for this advisor.
                    </td>
                  </tr>
                )}
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
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} className={n <= (r.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600">“{r.text}”</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{formatDate(r.createdAt)}</span>
                {r.postedToGoogle && <Badge tone="green">Posted to Google</Badge>}
              </div>
            </Card>
          ))}
          {advisor.reviews.length === 0 && (
            <Card className="p-10 text-center text-sm text-slate-400 md:col-span-2">
              No reviews collected yet.
            </Card>
          )}
        </div>
      )}

      <AddClientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(input) => {
          addClientTo(advisor.id, input)
          notify(`${input.name} added to ${advisor.firm}.`)
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
    if (!name.trim()) {
      setErr('Name is required.')
      return
    }
    onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim(), birthday: birthday || undefined })
    setName('')
    setEmail('')
    setPhone('')
    setBirthday('')
    setErr(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add client"
      subtitle="Add a client to this advisor's book."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}><Plus size={16} /> Add client</Button>
        </>
      }
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
