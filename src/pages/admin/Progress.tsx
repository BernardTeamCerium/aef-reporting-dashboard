import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock,
  Loader2,
  Plus,
  Target,
  Trash2,
  User,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { BadgeTone } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../state/Auth'
import {
  createTask,
  deleteTask,
  listTasks,
  TASK_CATEGORIES,
  updateTaskStatus,
  type ServiceTask,
  type TaskCategory,
  type TaskStatus,
} from '../../lib/tasksApi'
import { cx, formatDate, relativeDay } from '../../lib/format'

const categoryTone: Record<TaskCategory, BadgeTone> = {
  Content: 'blue',
  Print: 'purple',
  Website: 'teal',
  SEO: 'amber',
  Strategy: 'gray',
}

const columns: { status: TaskStatus; label: string; icon: React.ReactNode; accent: string }[] = [
  { status: 'todo', label: 'To do', icon: <CircleDashed size={16} />, accent: 'text-slate-500' },
  { status: 'in_progress', label: 'In progress', icon: <Clock size={16} />, accent: 'text-amber-600' },
  { status: 'done', label: 'Done', icon: <CheckCircle2 size={16} />, accent: 'text-emerald-600' },
]

export function AdminProgress() {
  const { getAccessToken, demoMode } = useAuth()
  const notify = useToast()

  const [tasks, setTasks] = useState<ServiceTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientFilter, setClientFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)

  // Add-task form
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [category, setCategory] = useState<TaskCategory>('Content')
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTasks(await listTasks(getAccessToken))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks.')
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  useEffect(() => {
    refresh()
  }, [refresh])

  const clients = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.client))).sort(),
    [tasks],
  )

  const visible = useMemo(
    () => (clientFilter === 'all' ? tasks : tasks.filter((t) => t.client === clientFilter)),
    [tasks, clientFilter],
  )

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    const done = visible.filter((t) => t.status === 'done')
    const completedThisMonth = done.filter((t) => (t.completedAt ?? '').startsWith(month)).length
    const withDue = done.filter((t) => t.dueDate && t.completedAt)
    const onTime = withDue.filter((t) => (t.completedAt as string) <= (t.dueDate as string)).length
    const onTimeRate = withDue.length ? Math.round((onTime / withDue.length) * 100) : 100
    return {
      completedThisMonth,
      inProgress: visible.filter((t) => t.status === 'in_progress').length,
      todo: visible.filter((t) => t.status === 'todo').length,
      onTimeRate,
    }
  }, [visible])

  const advance = async (task: ServiceTask) => {
    const next: TaskStatus = task.status === 'todo' ? 'in_progress' : 'done'
    // optimistic
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: next, completedAt: next === 'done' ? new Date().toISOString().slice(0, 10) : undefined }
          : t,
      ),
    )
    try {
      await updateTaskStatus(getAccessToken, task.id, next)
      if (next === 'done') notify(`Marked "${task.title}" as done.`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Update failed.')
      refresh()
    }
  }

  const remove = async (task: ServiceTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try {
      await deleteTask(getAccessToken, task.id)
    } catch {
      refresh()
    }
  }

  const resetForm = () => {
    setTitle('')
    setClient('')
    setCategory('Content')
    setAssignee('')
    setDueDate('')
    setFormError(null)
  }

  const submitAdd = async () => {
    if (!title.trim() || !client.trim()) {
      setFormError('Task and client are required.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const task = await createTask(getAccessToken, {
        title: title.trim(),
        client: client.trim(),
        category,
        assignee: assignee.trim() || undefined,
        dueDate: dueDate || undefined,
      })
      setTasks((prev) => [task, ...prev])
      setAddOpen(false)
      resetForm()
      notify('Task added.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add the task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Track what the team has delivered for each client and what's still in flight.
          </p>
          {demoMode && (
            <p className="text-xs text-amber-600">
              Demo mode: progress is stored in your browser only. Connect Supabase to share
              it across the team (see <code>docs/AUTH_SETUP.md</code>).
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">All clients</option>
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add task
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={<CheckCircle2 size={18} />} label="Completed this month" value={stats.completedThisMonth} />
        <StatTile icon={<Clock size={18} />} label="In progress" value={stats.inProgress} />
        <StatTile icon={<CircleDashed size={18} />} label="To do" value={stats.todo} />
        <StatTile icon={<Target size={18} />} label="On-time rate" value={`${stats.onTimeRate}%`} />
      </div>

      {loading ? (
        <Card className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="animate-spin" size={18} /> Loading progress…
        </Card>
      ) : error ? (
        <Card className="py-12 text-center text-sm text-rose-600">{error}</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {columns.map((col) => {
            const items = visible.filter((t) => t.status === col.status)
            return (
              <div key={col.status} className="rounded-2xl bg-slate-100/70 p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className={cx('flex items-center gap-1.5 text-sm font-semibold', col.accent)}>
                    {col.icon} {col.label}
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onAdvance={() => advance(task)}
                      onRemove={() => remove(task)}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-slate-400">Nothing here.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add task modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add service task"
        subtitle="Log a piece of work the team is delivering for a client."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdd} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Add task
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow label="Task">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design August newsletter" className={inputCls} />
          </FormRow>
          <FormRow label="Client">
            <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Advisor or firm name" list="client-list" className={inputCls} />
            <datalist id="client-list">
              {clients.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormRow>
          <FormRow label="Category">
            <div className="flex flex-wrap gap-2">
              {TASK_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cx(
                    'rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors',
                    category === c
                      ? 'bg-brand-600 text-white ring-brand-600'
                      : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Assignee (optional)">
              <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Team member" className={inputCls} />
            </FormRow>
            <FormRow label="Due date (optional)">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </FormRow>
          </div>
          {formError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{formError}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

function TaskCard({
  task,
  onAdvance,
  onRemove,
}: {
  task: ServiceTask
  onAdvance: () => void
  onRemove: () => void
}) {
  const overdue =
    task.status !== 'done' && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10)
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{task.title}</p>
        <button
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">{task.client}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={categoryTone[task.category]}>{task.category}</Badge>
        {task.assignee && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <User size={12} /> {task.assignee}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        {task.status === 'done' ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 size={13} /> {task.completedAt ? formatDate(task.completedAt) : 'Done'}
          </span>
        ) : (
          <span className={cx('text-xs', overdue ? 'font-medium text-rose-600' : 'text-slate-400')}>
            {task.dueDate ? `Due ${relativeDay(task.dueDate)}` : 'No due date'}
          </span>
        )}
        {task.status !== 'done' && (
          <button
            onClick={onAdvance}
            className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
          >
            {task.status === 'todo' ? 'Start' : 'Mark done'}
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
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
