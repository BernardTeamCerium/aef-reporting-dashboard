import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getServiceClient, HttpError, requireAdmin } from '../_lib'

interface TaskRow {
  id: string
  title: string
  client: string
  category: string
  status: string
  assignee: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string | null
}

function toTask(r: TaskRow) {
  return {
    id: r.id,
    title: r.title,
    client: r.client,
    category: r.category,
    status: r.status,
    assignee: r.assignee ?? undefined,
    dueDate: r.due_date ?? undefined,
    completedAt: r.completed_at ?? undefined,
    createdAt: (r.created_at ?? '').slice(0, 10),
  }
}

// Admin-only: list / create / update-status / delete service tasks.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const svc = getServiceClient()
    await requireAdmin(req, svc)

    if (req.method === 'GET') {
      const { data, error } = await svc
        .from('service_tasks')
        .select('id,title,client,category,status,assignee,due_date,completed_at,created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ tasks: (data as TaskRow[]).map(toTask) })
    }

    if (req.method === 'POST') {
      const { title, client, category, assignee, dueDate } = (req.body ?? {}) as Record<
        string,
        string | undefined
      >
      if (!title || !client) {
        return res.status(400).json({ error: 'Title and client are required.' })
      }
      const { data, error } = await svc
        .from('service_tasks')
        .insert({
          title,
          client,
          category: category ?? 'Content',
          status: 'todo',
          assignee: assignee || null,
          due_date: dueDate || null,
        })
        .select('id,title,client,category,status,assignee,due_date,completed_at,created_at')
        .single()
      if (error) throw error
      return res.status(200).json({ task: toTask(data as TaskRow) })
    }

    if (req.method === 'PATCH') {
      const id = String(req.query.id ?? '')
      if (!id) return res.status(400).json({ error: 'Missing task id.' })
      const { status } = (req.body ?? {}) as { status?: string }
      if (!status || !['todo', 'in_progress', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' })
      }
      const { data, error } = await svc
        .from('service_tasks')
        .update({
          status,
          completed_at: status === 'done' ? new Date().toISOString().slice(0, 10) : null,
        })
        .eq('id', id)
        .select('id,title,client,category,status,assignee,due_date,completed_at,created_at')
        .single()
      if (error) throw error
      return res.status(200).json({ task: toTask(data as TaskRow) })
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id ?? '')
      if (!id) return res.status(400).json({ error: 'Missing task id.' })
      const { error } = await svc.from('service_tasks').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: e instanceof Error ? e.message : 'Unknown error' })
  }
}
