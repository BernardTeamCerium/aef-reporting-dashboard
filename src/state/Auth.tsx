import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  adminEmail,
  isAuthEnabled,
  supabase,
  type AppUser,
} from '../lib/supabase'

interface AuthContextValue {
  /** True while the initial session is being resolved. */
  loading: boolean
  /** Whether a real Supabase backend is configured. */
  authEnabled: boolean
  /** True when running open (no backend) — everyone is treated as admin. */
  demoMode: boolean
  user: AppUser | null
  isAdmin: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  /** Bearer token for calling the serverless admin API; null in demo mode. */
  getAccessToken: () => Promise<string | null>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const demoUser: AppUser = {
  id: 'demo-admin',
  email: adminEmail,
  fullName: 'Demo Admin',
  role: 'admin',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // In demo mode we resolve immediately as the demo admin.
  const [user, setUser] = useState<AppUser | null>(isAuthEnabled ? null : demoUser)
  const [loading, setLoading] = useState(isAuthEnabled)

  // Map a Supabase auth user + profile row into our AppUser shape.
  const loadProfile = useCallback(async (): Promise<AppUser | null> => {
    if (!supabase) return null
    const { data: auth } = await supabase.auth.getUser()
    const authUser = auth.user
    if (!authUser) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, firm')
      .eq('id', authUser.id)
      .maybeSingle()

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      fullName: profile?.full_name ?? authUser.email ?? 'User',
      role: (profile?.role as AppUser['role']) ?? 'advisor',
      firm: profile?.firm ?? undefined,
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!isAuthEnabled) return
    setUser(await loadProfile())
  }, [loadProfile])

  useEffect(() => {
    if (!supabase) return
    let active = true

    // Resolve the current session on load.
    loadProfile()
      .then((u) => active && setUser(u))
      .finally(() => active && setLoading(false))

    // Keep in sync with sign-in / sign-out / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadProfile().then((u) => active && setUser(u))
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return {}
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      setUser(await loadProfile())
      return {}
    },
    [loadProfile],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const getAccessToken = useCallback(async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      authEnabled: isAuthEnabled,
      demoMode: !isAuthEnabled,
      user,
      isAdmin: user?.role === 'admin',
      signInWithPassword,
      signOut,
      getAccessToken,
      refreshProfile,
    }),
    [loading, user, signInWithPassword, signOut, getAccessToken, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
