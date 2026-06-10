import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'

// Server-only configuration. These are NOT prefixed with VITE_ so they are
// never exposed to the browser bundle. Set them in your Vercel project.
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bernard@teamcerium.com'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Service-role client — full access; only ever used server-side. */
export function getServiceClient(): SupabaseClient {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new HttpError(
      500,
      'Supabase server env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not configured.',
    )
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function bearer(req: VercelRequest): string | null {
  const h = req.headers.authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}

/** Verify the caller is signed in AND has the admin role; otherwise throw. */
export async function requireAdmin(req: VercelRequest, svc: SupabaseClient) {
  const token = bearer(req)
  if (!token) throw new HttpError(401, 'Missing authorization token.')

  const { data, error } = await svc.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session.')

  const { data: profile } = await svc
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') throw new HttpError(403, 'Admin access required.')
  return data.user
}

export function generateTempPassword(): string {
  return (
    'OS-' +
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6)
  )
}
