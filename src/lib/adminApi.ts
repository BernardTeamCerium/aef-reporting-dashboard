import { adminEmail, isAuthEnabled, type AppRole } from './supabase'

export interface ManagedUser {
  id: string
  email: string
  fullName: string
  role: AppRole
  firm?: string
  createdAt: string
}

export interface NewUserInput {
  email: string
  fullName: string
  role: AppRole
  firm?: string
}

export interface CreateUserResult {
  user: ManagedUser
  /** Returned once so the admin can share it; only when a temp password is set. */
  tempPassword?: string
}

type TokenGetter = () => Promise<string | null>

// ---------------------------------------------------------------------------
// Demo-mode store (no backend): persists in localStorage so added users stick
// around during a demo session.
// ---------------------------------------------------------------------------
const DEMO_KEY = 'onestop.demo.users'

const demoSeed: ManagedUser[] = [
  { id: 'u-admin', email: adminEmail, fullName: 'Bernard (Admin)', role: 'admin', createdAt: '2026-05-09' },
  {
    id: 'u-renzo',
    email: 'renzofrazier@gmail.com',
    fullName: 'Renzo Frazier',
    role: 'advisor',
    firm: 'Frazier Wealth Partners',
    createdAt: '2026-05-12',
  },
  {
    id: 'u-dana',
    email: 'dana.advisor@example.com',
    fullName: 'Dana Cole',
    role: 'advisor',
    firm: 'Cole Retirement Group',
    createdAt: '2026-05-20',
  },
]

function readDemo(): ManagedUser[] {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) return JSON.parse(raw) as ManagedUser[]
  } catch {
    /* ignore */
  }
  localStorage.setItem(DEMO_KEY, JSON.stringify(demoSeed))
  return demoSeed
}

function writeDemo(users: ManagedUser[]) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(users))
}

function randomPassword(): string {
  return 'OS-' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6)
}

// ---------------------------------------------------------------------------
// Public API — same surface in demo and real mode.
// ---------------------------------------------------------------------------
async function authedFetch(path: string, getToken: TokenGetter, init?: RequestInit) {
  const token = await getToken()
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data
}

export async function listUsers(getToken: TokenGetter): Promise<ManagedUser[]> {
  if (!isAuthEnabled) return readDemo()
  const data = await authedFetch('/api/admin/users', getToken)
  return data.users as ManagedUser[]
}

export async function createUser(
  getToken: TokenGetter,
  input: NewUserInput,
): Promise<CreateUserResult> {
  if (!isAuthEnabled) {
    const users = readDemo()
    if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error('A user with that email already exists.')
    }
    const user: ManagedUser = {
      id: 'u-' + Math.random().toString(36).slice(2, 9),
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      firm: input.firm,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    writeDemo([user, ...users])
    return { user, tempPassword: randomPassword() }
  }
  const data = await authedFetch('/api/admin/users', getToken, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data as CreateUserResult
}

export async function deleteUser(getToken: TokenGetter, id: string): Promise<void> {
  if (!isAuthEnabled) {
    writeDemo(readDemo().filter((u) => u.id !== id))
    return
  }
  await authedFetch(`/api/admin/users?id=${encodeURIComponent(id)}`, getToken, {
    method: 'DELETE',
  })
}
