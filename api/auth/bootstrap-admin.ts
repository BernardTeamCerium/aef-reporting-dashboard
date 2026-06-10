import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ADMIN_EMAIL, getServiceClient, HttpError } from '../_lib'

// One-time: creates the admin account by letting the configured admin email
// choose its password on first login. Refuses once an admin already exists.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string }
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res
        .status(403)
        .json({ error: 'Only the configured admin email can be set up here.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const svc = getServiceClient()

    const { count } = await svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    if ((count ?? 0) > 0) {
      return res.status(409).json({ error: 'An admin account already exists.' })
    }

    const { data, error } = await svc.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Administrator' },
    })
    if (error || !data.user) throw error ?? new Error('Could not create the admin user.')

    const { error: pErr } = await svc.from('profiles').insert({
      id: data.user.id,
      email,
      full_name: 'Administrator',
      role: 'admin',
    })
    if (pErr) throw pErr

    res.status(200).json({ ok: true })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: e instanceof Error ? e.message : 'Unknown error' })
  }
}
