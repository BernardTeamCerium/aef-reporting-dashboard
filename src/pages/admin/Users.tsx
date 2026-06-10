import { useCallback, useEffect, useState } from 'react'
import {
  Copy,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users as UsersIcon,
} from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../state/Auth'
import {
  createUser,
  deleteUser,
  listUsers,
  type ManagedUser,
} from '../../lib/adminApi'
import type { AppRole } from '../../lib/supabase'
import { formatDate } from '../../lib/format'

export function AdminUsers() {
  const { getAccessToken, demoMode, user: me } = useAuth()
  const notify = useToast()

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [removing, setRemoving] = useState<ManagedUser | null>(null)
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null)

  // Add-user form state
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [firm, setFirm] = useState('')
  const [role, setRole] = useState<AppRole>('advisor')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setUsers(await listUsers(getAccessToken))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    refresh()
  }, [refresh])

  const resetForm = () => {
    setEmail('')
    setFullName('')
    setFirm('')
    setRole('advisor')
    setFormError(null)
  }

  const submitAdd = async () => {
    if (!email.trim() || !fullName.trim()) {
      setFormError('Email and name are required.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const result = await createUser(getAccessToken, {
        email: email.trim(),
        fullName: fullName.trim(),
        role,
        firm: firm.trim() || undefined,
      })
      setUsers((prev) => [result.user, ...prev])
      setAddOpen(false)
      resetForm()
      if (result.tempPassword) {
        setTempPassword({ email: result.user.email, password: result.tempPassword })
      } else {
        notify(`Invitation sent to ${result.user.email}.`)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the user.')
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    const target = removing
    setRemoving(null)
    try {
      await deleteUser(getAccessToken, target.id)
      setUsers((prev) => prev.filter((u) => u.id !== target.id))
      notify(`Removed ${target.email}.`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not remove the user.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-slate-500">
          Add advisors and teammates who can sign in to the hub, and manage their access.
        </p>
        {demoMode && (
          <p className="text-xs text-amber-600">
            Demo mode: changes are stored in your browser only. Connect Supabase to manage
            real accounts (see <code>docs/AUTH_SETUP.md</code>).
          </p>
        )}
      </div>

      <Card>
        <CardHeader
          title="Users"
          subtitle={`${users.length} ${users.length === 1 ? 'person' : 'people'} with access`}
          icon={<UsersIcon size={18} />}
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add user
            </Button>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={18} /> Loading users…
          </div>
        ) : loadError ? (
          <div className="px-5 py-10 text-center text-sm text-rose-600">{loadError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Firm</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Added</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{u.fullName}</td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3 text-slate-500">{u.firm ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge tone={u.role === 'admin' ? 'purple' : 'blue'}>
                        {u.role === 'admin' ? (
                          <>
                            <ShieldCheck size={12} /> Admin
                          </>
                        ) : (
                          <>
                            <UserCog size={12} /> Advisor
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {u.email !== me?.email && (
                        <button
                          onClick={() => setRemoving(u)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remove ${u.email}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add user modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add user"
        subtitle="They'll be able to sign in to the marketing hub."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdd} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Create user
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Advisor"
              className={inputCls}
            />
          </FormRow>
          <FormRow label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@firm.com"
              className={inputCls}
            />
          </FormRow>
          <FormRow label="Firm (optional)">
            <input
              value={firm}
              onChange={(e) => setFirm(e.target.value)}
              placeholder="Advisor's firm name"
              className={inputCls}
            />
          </FormRow>
          <FormRow label="Role">
            <div className="flex gap-2">
              {(['advisor', 'admin'] as AppRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={
                    'flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize ring-1 ring-inset transition-colors ' +
                    (role === r
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50')
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </FormRow>
          {formError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {formError}
            </p>
          )}
        </div>
      </Modal>

      {/* Temp password reveal */}
      <Modal
        open={tempPassword !== null}
        onClose={() => setTempPassword(null)}
        title="User created"
        subtitle="Share these one-time credentials securely. They won't be shown again."
        footer={
          <Button onClick={() => setTempPassword(null)}>Done</Button>
        }
      >
        {tempPassword && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <Mail size={15} className="text-slate-400" />
              <span className="font-medium text-slate-700">{tempPassword.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <code className="text-sm font-semibold text-slate-900">{tempPassword.password}</code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(tempPassword.password)
                  notify('Temporary password copied.')
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
              >
                <Copy size={13} /> Copy
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Ask them to sign in with this temporary password and change it.
            </p>
          </div>
        )}
      </Modal>

      {/* Remove confirm */}
      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove user"
        subtitle={removing?.email}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemove}>
              Remove access
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {removing?.fullName} will no longer be able to sign in. This can't be undone.
        </p>
      </Modal>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}
