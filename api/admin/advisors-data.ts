import type { VercelRequest, VercelResponse } from '@vercel/node'
import { errorMessage, getServiceClient, HttpError, requireAdmin } from '../_lib.js'

// Persists the advisors registry to Supabase. Each advisor is stored as one
// JSON row (id + data). The admin app reads all rows on load and best-effort
// upserts on change. Admin-only; the service-role client bypasses RLS.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const svc = getServiceClient()
    await requireAdmin(req, svc)

    if (req.method === 'GET') {
      const { data, error } = await svc.from('advisors_data').select('data')
      if (error) throw error
      return res.status(200).json({ advisors: (data ?? []).map((r) => r.data) })
    }

    if (req.method === 'PUT') {
      const { advisors } = (req.body ?? {}) as { advisors?: { id: string }[] }
      if (!Array.isArray(advisors)) {
        return res.status(400).json({ error: 'Expected an "advisors" array.' })
      }
      const rows = advisors.map((a) => ({ id: a.id, data: a }))
      if (rows.length) {
        const { error } = await svc.from('advisors_data').upsert(rows, { onConflict: 'id' })
        if (error) throw error
      }
      // Remove any advisors that were deleted client-side.
      const ids = advisors.map((a) => a.id)
      const { data: existing } = await svc.from('advisors_data').select('id')
      const toDelete = (existing ?? []).map((r) => r.id as string).filter((id) => !ids.includes(id))
      if (toDelete.length) {
        const { error } = await svc.from('advisors_data').delete().in('id', toDelete)
        if (error) throw error
      }
      return res.status(200).json({ ok: true, count: rows.length })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: errorMessage(e) })
  }
}
