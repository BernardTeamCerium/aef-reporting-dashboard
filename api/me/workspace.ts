import type { VercelRequest, VercelResponse } from '@vercel/node'
import { errorMessage, getServiceClient, HttpError, requireUser } from '../_lib.js'

// The signed-in user's own workspace (their clients, reviews, and review
// settings), stored as one JSON row keyed by their user id. Any authenticated
// user manages only their own row.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const svc = getServiceClient()
    const user = await requireUser(req, svc)

    if (req.method === 'GET') {
      const { data, error } = await svc
        .from('advisor_workspace')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return res.status(200).json({ data: data?.data ?? null })
    }

    if (req.method === 'PUT') {
      const { data } = (req.body ?? {}) as { data?: unknown }
      if (typeof data !== 'object' || data === null) {
        return res.status(400).json({ error: 'Expected a "data" object.' })
      }
      const { error } = await svc
        .from('advisor_workspace')
        .upsert({ user_id: user.id, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
