import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  generateTempPassword,
  getServiceClient,
  HttpError,
  requireAdmin,
} from '../_lib'

interface ProfileRow {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'advisor'
  firm: string | null
  created_at: string | null
}

// Admin-only: list / create / delete users. Caller must present a valid admin
// session token (verified in requireAdmin).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const svc = getServiceClient()
    await requireAdmin(req, svc)

    // ---- List ----
    if (req.method === 'GET') {
      const { data, error } = await svc
        .from('profiles')
        .select('id,email,full_name,role,firm,created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      const users = (data as ProfileRow[]).map((r) => ({
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        role: r.role,
        firm: r.firm ?? undefined,
        createdAt: (r.created_at ?? '').slice(0, 10),
      }))
      return res.status(200).json({ users })
    }

    // ---- Create ----
    if (req.method === 'POST') {
      const { email, fullName, role, firm } = (req.body ?? {}) as {
        email?: string
        fullName?: string
        role?: string
        firm?: string
      }
      if (!email || !fullName) {
        return res.status(400).json({ error: 'Email and full name are required.' })
      }
      const safeRole = role === 'admin' ? 'admin' : 'advisor'
      const password = generateTempPassword()

      const { data, error } = await svc.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (error || !data.user) throw error ?? new Error('Could not create the user.')

      const { error: pErr } = await svc.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: safeRole,
        firm: firm || null,
      })
      if (pErr) throw pErr

      return res.status(200).json({
        user: {
          id: data.user.id,
          email,
          fullName,
          role: safeRole,
          firm: firm || undefined,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        tempPassword: password,
      })
    }

    // ---- Delete ----
    if (req.method === 'DELETE') {
      const id = String(req.query.id ?? '')
      if (!id) return res.status(400).json({ error: 'Missing user id.' })
      const { error } = await svc.auth.admin.deleteUser(id)
      if (error) throw error
      await svc.from('profiles').delete().eq('id', id)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: e instanceof Error ? e.message : 'Unknown error' })
  }
}
