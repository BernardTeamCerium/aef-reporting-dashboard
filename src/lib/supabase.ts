import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Auth is "enabled" only when the Supabase keys are configured. Until then the
// app runs in open demo mode, so the deployed prototype keeps working without
// any backend. Set these in a local .env file or in your Vercel project.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isAuthEnabled = Boolean(url && anonKey)

/** The configured admin email (defaults to the project owner). */
export const adminEmail =
  import.meta.env.VITE_ADMIN_EMAIL ?? 'bernard@teamcerium.com'

// Only construct a real client when configured; otherwise it's null and the
// AuthProvider falls back to demo mode.
export const supabase: SupabaseClient | null = isAuthEnabled
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export type AppRole = 'admin' | 'advisor'

export interface AppUser {
  id: string
  email: string
  fullName: string
  role: AppRole
  firm?: string
}
