import { isAuthEnabled } from './supabase'

// Service tasks let the OneStop team track delivery progress per client so the
// admin can see what's been done. Same dual-mode approach as the users API:
// a local store in demo mode, the serverless API when Supabase is configured.

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskCategory = 'Content' | 'Print' | 'Website' | 'SEO' | 'Strategy'

export const TASK_CATEGORIES: TaskCategory[] = [
  'Content',
  'Print',
  'Website',
  'SEO',
  'Strategy',
]

export interface ServiceTask {
  id: string
  title: string
  client: string
  category: TaskCategory
  status: TaskStatus
  assignee?: string
  dueDate?: string
  completedAt?: string
  createdAt: string
}

export interface NewTaskInput {
  title: string
  client: string
  category: TaskCategory
  assignee?: string
  dueDate?: string
}

type TokenGetter = () => Promise<string | null>

// ---------------------------------------------------------------------------
// Demo store
// ---------------------------------------------------------------------------
const DEMO_KEY = 'onestop.demo.tasks'

const demoSeed: ServiceTask[] = [
  { id: 't-1', title: 'Publish "Mid-Year Market Check-In" (LinkedIn)', client: 'Frazier Wealth Partners', category: 'Content', status: 'done', assignee: 'Dana Whitfield', dueDate: '2026-06-09', completedAt: '2026-06-08', createdAt: '2026-06-01' },
  { id: 't-2', title: 'Print & ship June seminar postcards', client: 'Frazier Wealth Partners', category: 'Print', status: 'done', assignee: 'Marcus Lee', dueDate: '2026-05-28', completedAt: '2026-05-27', createdAt: '2026-05-19' },
  { id: 't-3', title: 'Monthly SEO audit + keyword report', client: 'Frazier Wealth Partners', category: 'SEO', status: 'done', assignee: 'Priya Nair', dueDate: '2026-06-03', completedAt: '2026-06-03', createdAt: '2026-05-25' },
  { id: 't-4', title: 'Build "Retire by 60" webinar landing page', client: 'Frazier Wealth Partners', category: 'Website', status: 'in_progress', assignee: 'Marcus Lee', dueDate: '2026-06-20', createdAt: '2026-05-30' },
  { id: 't-5', title: 'Swap homepage & About headshots', client: 'Frazier Wealth Partners', category: 'Website', status: 'in_progress', assignee: 'Dana Whitfield', dueDate: '2026-06-12', createdAt: '2026-06-02' },
  { id: 't-6', title: 'Business cards reprint — new associate', client: 'Cole Retirement Group', category: 'Print', status: 'in_progress', assignee: 'Marcus Lee', dueDate: '2026-06-15', createdAt: '2026-06-04' },
  { id: 't-7', title: 'Q3 content calendar planning', client: 'Frazier Wealth Partners', category: 'Strategy', status: 'todo', assignee: 'Dana Whitfield', dueDate: '2026-06-25', createdAt: '2026-06-06' },
  { id: 't-8', title: 'Draft 4 blog posts on tax planning', client: 'Cole Retirement Group', category: 'Content', status: 'todo', assignee: 'Priya Nair', dueDate: '2026-06-30', createdAt: '2026-06-07' },
]

function readDemo(): ServiceTask[] {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) return JSON.parse(raw) as ServiceTask[]
  } catch {
    /* ignore */
  }
  localStorage.setItem(DEMO_KEY, JSON.stringify(demoSeed))
  return demoSeed
}

function writeDemo(tasks: ServiceTask[]) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(tasks))
}

const today = () => new Date().toISOString().slice(0, 10)

// ---------------------------------------------------------------------------
// API
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

export async function listTasks(getToken: TokenGetter): Promise<ServiceTask[]> {
  if (!isAuthEnabled) return readDemo()
  const data = await authedFetch('/api/admin/tasks', getToken)
  return data.tasks as ServiceTask[]
}

export async function createTask(
  getToken: TokenGetter,
  input: NewTaskInput,
): Promise<ServiceTask> {
  if (!isAuthEnabled) {
    const task: ServiceTask = {
      id: 't-' + Math.random().toString(36).slice(2, 9),
      status: 'todo',
      createdAt: today(),
      ...input,
    }
    writeDemo([task, ...readDemo()])
    return task
  }
  const data = await authedFetch('/api/admin/tasks', getToken, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.task as ServiceTask
}

export async function updateTaskStatus(
  getToken: TokenGetter,
  id: string,
  status: TaskStatus,
): Promise<ServiceTask> {
  const completedAt = status === 'done' ? today() : undefined
  if (!isAuthEnabled) {
    const tasks = readDemo()
    const next = tasks.map((t) =>
      t.id === id ? { ...t, status, completedAt: status === 'done' ? today() : undefined } : t,
    )
    writeDemo(next)
    return next.find((t) => t.id === id)!
  }
  const data = await authedFetch(`/api/admin/tasks?id=${encodeURIComponent(id)}`, getToken, {
    method: 'PATCH',
    body: JSON.stringify({ status, completedAt }),
  })
  return data.task as ServiceTask
}

export async function deleteTask(getToken: TokenGetter, id: string): Promise<void> {
  if (!isAuthEnabled) {
    writeDemo(readDemo().filter((t) => t.id !== id))
    return
  }
  await authedFetch(`/api/admin/tasks?id=${encodeURIComponent(id)}`, getToken, {
    method: 'DELETE',
  })
}
