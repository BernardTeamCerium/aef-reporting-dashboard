import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ADMIN_EMAIL, getServiceClient, HttpError } from '../_lib'

// Public: tells the login screen whether the admin account has been created yet.
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const svc = getServiceClient()
    const { count, error } = await svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    if (error) throw error
    res.status(200).json({ adminExists: (count ?? 0) > 0, adminEmail: ADMIN_EMAIL })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    res.status(status).json({ error: e instanceof Error ? e.message : 'Unknown error' })
  }
}
