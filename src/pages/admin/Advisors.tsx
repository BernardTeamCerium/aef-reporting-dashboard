import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ChevronRight,
  Plus,
  Star,
  UserPlus,
  Users,
} from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { useAdvisors, type AdvisorPlan } from '../../state/Advisors'
import { initialsOf } from '../../lib/reviewsUtil'

const planTone: Record<AdvisorPlan, BadgeTone> = {
  Starter: 'gray',
  Growth: 'blue',
  Premium: 'purple',
}

export function AdminAdvisors() {
  const { advisors, addAdvisor } = useAdvisors()
  const navigate = useNavigate()
  const notify = useToast()
  const [addOpen, setAddOpen] = useState(false)

  const totals = useMemo(() => {
    return {
      advisors: advisors.length,
      active: advisors.filter((a) => a.status === 'active').length,
      clients: advisors.reduce((s, a) => s + a.clients.length, 0),
      leads: advisors.reduce((s, a) => s + a.metrics.leads, 0),
    }
  }, [advisors])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Every advisor OneStop manages. Add advisors, and open any to manage their clients and
          see their analytics.
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus size={15} /> Add advisor
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile icon={<Briefcase size={18} />} value={totals.advisors} label="Advisors" />
        <Tile icon={<Users size={18} />} value={totals.active} label="Active" />
        <Tile icon={<Users size={18} />} value={totals.clients} label="Total clients" />
        <Tile icon={<Star size={18} />} value={totals.leads.toLocaleString()} label="Leads (30d)" />
      </div>

      <Card>
        <CardHeader title="Advisors" subtitle="Click an advisor to manage their account" icon={<Briefcase size={18} />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Advisor</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Clients</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Leads</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advisors.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/admin/advisors/${a.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {initialsOf(a.firm)}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">{a.firm}</p>
                        <p className="text-xs text-slate-400">{a.name} · {a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={planTone[a.plan]}>{a.plan}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{a.clients.length}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {a.metrics.avgRating ? (
                      <span className="inline-flex items-center gap-1">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        {a.metrics.avgRating}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{a.metrics.leads.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <Badge tone={a.status === 'active' ? 'green' : 'amber'}>
                      {a.status === 'active' ? 'Active' : 'Paused'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-300">
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddAdvisorModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(input) => {
          const a = addAdvisor(input)
          notify(`${a.firm} added.`)
          navigate(`/admin/advisors/${a.id}`)
        }}
      />
    </div>
  )
}

function Tile({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <Card className="p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <p className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  )
}

function AddAdvisorModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (input: { name: string; firm: string; email: string; phone: string; website?: string; plan: AdvisorPlan; accountManager?: string }) => void
}) {
  const [firm, setFirm] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [plan, setPlan] = useState<AdvisorPlan>('Growth')
  const [err, setErr] = useState<string | null>(null)

  const reset = () => {
    setFirm('')
    setName('')
    setEmail('')
    setPhone('')
    setWebsite('')
    setPlan('Growth')
    setErr(null)
  }

  const submit = () => {
    if (!firm.trim() || !name.trim() || !email.trim()) {
      setErr('Firm, contact name, and email are required.')
      return
    }
    onAdd({ firm: firm.trim(), name: name.trim(), email: email.trim(), phone: phone.trim(), website: website.trim(), plan })
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add advisor"
      subtitle="Create an advisor account for the OneStop team to manage."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Plus size={16} /> Add advisor
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Firm / business name">
          <input value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="Acme Wealth Partners" className={inputCls} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Primary contact">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Advisor name" className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="advisor@firm.com" className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 0100" className={inputCls} />
          </Field>
          <Field label="Website">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="firm.com" className={inputCls} />
          </Field>
        </div>
        <Field label="Plan">
          <div className="flex gap-2">
            {(['Starter', 'Growth', 'Premium'] as AdvisorPlan[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlan(p)}
                className={
                  'flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset transition-colors ' +
                  (plan === p ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50')
                }
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{err}</p>}
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
