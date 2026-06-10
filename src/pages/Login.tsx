import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Lock, LogIn, ShieldCheck } from 'lucide-react'
import { OneStopMark } from '../components/Logo'
import { Button } from '../components/ui/Button'
import { useAuth } from '../state/Auth'
import { adminEmail, isAuthEnabled } from '../lib/supabase'

type Mode = 'loading' | 'login' | 'bootstrap'

export function Login() {
  const { signInWithPassword, demoMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [mode, setMode] = useState<Mode>(isAuthEnabled ? 'loading' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Determine whether the admin account still needs to be created.
  useEffect(() => {
    if (!isAuthEnabled) return
    let active = true
    fetch('/api/auth/status')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { adminExists: boolean; adminEmail?: string }) => {
        if (!active) return
        if (d.adminExists) {
          setMode('login')
        } else {
          setMode('bootstrap')
          setEmail(d.adminEmail ?? adminEmail)
        }
      })
      .catch(() => active && setMode('login'))
    return () => {
      active = false
    }
  }, [])

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error } = await signInWithPassword(email.trim(), password)
    setBusy(false)
    if (error) {
      setError(error)
      return
    }
    navigate(from, { replace: true })
  }

  const submitBootstrap = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/bootstrap-admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not create the admin account.')
      // Account created — sign straight in.
      const { error } = await signInWithPassword(email.trim(), password)
      if (error) throw new Error(error)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <OneStopMark className="h-12 w-12" />
          <p className="mt-3 text-xl font-extrabold tracking-tight text-slate-900">
            One<span className="text-brand-600">Stop</span>
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Advisor Marketing Hub
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {demoMode && (
            <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Demo mode — no backend configured, so login isn't required.{' '}
              <Link to="/" className="font-semibold underline">
                Open the dashboard
              </Link>
              .
            </div>
          )}

          {mode === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={18} /> Checking account…
            </div>
          )}

          {mode === 'bootstrap' && (
            <form onSubmit={submitBootstrap} className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-brand-700">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                <span>
                  First-time setup: create the admin account for{' '}
                  <strong>{email}</strong> by choosing a password.
                </span>
              </div>
              <Field label="Admin email">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </Field>
              <Field label="Create password">
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputCls}
                />
              </Field>
              <Field label="Confirm password">
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputCls}
                />
              </Field>
              {error && <Err msg={error} />}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                Create admin account
              </Button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={submitLogin} className="space-y-4">
              <Field label="Email">
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@firm.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls + ' pl-9'}
                  />
                </div>
              </Field>
              {error && <Err msg={error} />}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
                Sign in
              </Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Managed by OneStop Print &amp; Digital Marketing
        </p>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function Err({ msg }: { msg: string }) {
  return (
    <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{msg}</p>
  )
}
