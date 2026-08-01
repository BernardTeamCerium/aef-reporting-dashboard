import { useMemo, useState } from 'react'
import {
  CalendarHeart,
  Cake,
  Gift,
  Mail,
  MessageSquare,
  PartyPopper,
  Plus,
  Star,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { RequestReviewModal } from '../components/reviews/RequestReviewModal'
import { useClients, type Client } from '../state/Clients'
import {
  initialsOf,
  parseClientsCsv,
  upcomingOccasions,
} from '../lib/reviewsUtil'
import { cx, formatDate } from '../lib/format'

export function Clients() {
  const { clients, addClient, addClients, updateClient, removeClient } = useClients()
  const notify = useToast()

  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [removing, setRemoving] = useState<Client | null>(null)
  const [requestClient, setRequestClient] = useState<Client | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)

  const occasions = useMemo(() => upcomingOccasions(clients), [clients])

  const optedIn = clients.filter((c) => c.greetings.birthday || c.greetings.holidays).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm text-slate-500">
          Add your clients with their phone, email, and birthday. Turn on automated birthday and
          holiday greetings, and request reviews — all from one place.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload size={15} /> Import list
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus size={15} /> Add client
          </Button>
        </div>
      </div>

      {/* Upcoming automated greetings */}
      <Card>
        <CardHeader
          title="Automated greetings"
          subtitle={`Birthday & holiday messages queued for ${optedIn} opted-in client${optedIn === 1 ? '' : 's'}`}
          icon={<CalendarHeart size={18} />}
        />
        {occasions.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">
            No birthdays or holidays coming up in the next 45 days.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-5 py-4">
            {occasions.map((o, i) => (
              <div
                key={i}
                className="flex w-56 shrink-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cx(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      o.kind === 'birthday' ? 'bg-brand-50 text-brand-600' : 'bg-violet-50 text-violet-600',
                    )}
                  >
                    {o.kind === 'birthday' ? <Cake size={16} /> : <PartyPopper size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{o.label}</p>
                    <p className="text-xs text-slate-400">
                      {o.daysAway === 0 ? 'Today' : o.daysAway === 1 ? 'Tomorrow' : `in ${o.daysAway} days`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  {o.kind === 'birthday' && o.client ? (
                    <>
                      {o.client.email && <Mail size={12} />}
                      {o.client.phone && <MessageSquare size={12} />}
                      <span className="ml-1">auto-send scheduled</span>
                    </>
                  ) : (
                    <>
                      <Gift size={12} /> <span>to all opted-in clients</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">
          Demo preview. Connect Supabase + an email/SMS provider (or Zapier) to actually send these
          automatically — the schedule shown here is what would go out.
        </p>
      </Card>

      {/* Clients table */}
      <Card>
        <CardHeader
          title="Clients"
          subtitle={`${clients.length} customer profile${clients.length === 1 ? '' : 's'}`}
          icon={<UserPlus size={18} />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Birthday</th>
                <th className="px-5 py-3 font-medium">Greetings</th>
                <th className="px-5 py-3 font-medium">Review</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {initialsOf(c.name)}
                      </span>
                      <span className="font-medium text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-slate-600">{c.email || '—'}</div>
                    <div className="text-xs text-slate-400">{c.phone || '—'}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {c.birthday ? formatBirthday(c.birthday) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <GreetingToggle
                        active={c.greetings.birthday}
                        onClick={() =>
                          updateClient(c.id, { greetings: { ...c.greetings, birthday: !c.greetings.birthday } })
                        }
                        icon={<Cake size={13} />}
                        label="Birthday"
                      />
                      <GreetingToggle
                        active={c.greetings.holidays}
                        onClick={() =>
                          updateClient(c.id, { greetings: { ...c.greetings, holidays: !c.greetings.holidays } })
                        }
                        icon={<Gift size={13} />}
                        label="Holidays"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {c.reviewStatus === 'reviewed' ? (
                      <Badge tone="green">
                        <Star size={11} className="fill-emerald-600" /> Reviewed
                      </Badge>
                    ) : c.reviewStatus === 'requested' ? (
                      <Badge tone="amber">Requested</Badge>
                    ) : (
                      <button
                        onClick={() => {
                          setRequestClient(c)
                          setRequestOpen(true)
                        }}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Request
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setRemoving(c)}
                      className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Remove ${c.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    No clients yet. Add one or import a list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AddClientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(input) => {
          addClient(input)
          notify(`${input.name} added.`)
        }}
      />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(rows) => {
          const n = addClients(rows)
          notify(`Imported ${n} client${n === 1 ? '' : 's'}.`)
        }}
      />
      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove client"
        subtitle={removing?.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (removing) removeClient(removing.id)
                setRemoving(null)
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This removes {removing?.name}'s profile and stops their automated greetings.
        </p>
      </Modal>

      <RequestReviewModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        client={requestClient}
      />
    </div>
  )
}

function GreetingToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      title={`${label} greetings ${active ? 'on' : 'off'}`}
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
        active
          ? 'bg-brand-50 text-brand-700 ring-brand-200'
          : 'bg-slate-50 text-slate-400 ring-slate-200 hover:text-slate-600',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

interface AddInput {
  name: string
  email: string
  phone: string
  birthday?: string
}

function AddClientModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (input: AddInput & { greetings: { birthday: boolean; holidays: boolean } }) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState('')
  const [bday, setBday] = useState(true)
  const [holidays, setHolidays] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setBirthday('')
    setBday(true)
    setHolidays(true)
    setErr(null)
  }

  const submit = () => {
    if (!name.trim()) {
      setErr('Name is required.')
      return
    }
    if (!email.trim() && !phone.trim()) {
      setErr('Add an email or phone so you can reach them.')
      return
    }
    onAdd({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      birthday: birthday || undefined,
      greetings: { birthday: bday, holidays },
    })
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add client"
      subtitle="Their profile powers review requests and automated greetings."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Plus size={16} /> Add client
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" className={inputCls} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 0100" className={inputCls} />
          </Field>
        </div>
        <Field label="Birthday">
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputCls} />
        </Field>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Automated greetings</span>
          <div className="flex gap-2">
            <ToggleChip active={bday} onClick={() => setBday(!bday)} icon={<Cake size={14} />} label="Birthday" />
            <ToggleChip active={holidays} onClick={() => setHolidays(!holidays)} icon={<Gift size={14} />} label="Holidays" />
          </div>
        </div>
        {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{err}</p>}
      </div>
    </Modal>
  )
}

function ImportModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean
  onClose: () => void
  onImport: (rows: AddInput[]) => void
}) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => (text.trim() ? parseClientsCsv(text) : []), [text])

  const onFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import client list"
      subtitle="Paste rows or upload a CSV — columns: name, email, phone, birthday."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onImport(parsed)
              setText('')
              onClose()
            }}
            disabled={parsed.length === 0}
          >
            Import {parsed.length > 0 ? `${parsed.length} client${parsed.length === 1 ? '' : 's'}` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 hover:bg-slate-50">
          <Upload size={16} />
          Upload a .csv file
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={'name, email, phone, birthday\nJane Doe, jane@email.com, +1 415 555 0100, 1980-04-12'}
          className={cx(inputCls, 'font-mono text-xs')}
        />
        {parsed.length > 0 && (
          <p className="text-xs text-emerald-600">
            {parsed.length} client{parsed.length === 1 ? '' : 's'} ready to import.
          </p>
        )}
      </div>
    </Modal>
  )
}

function ToggleChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors',
        active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
      )}
    >
      {icon}
      {label}
    </button>
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

function formatBirthday(iso: string): string {
  const m = iso.match(/^\d{4}-(\d{2})-(\d{2})$/)
  if (!m) return iso
  return formatDate(iso).replace(/,?\s*\d{4}$/, '')
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
