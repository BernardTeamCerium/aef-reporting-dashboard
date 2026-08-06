import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isAuthEnabled } from '../lib/supabase'
import { useAuth } from './Auth'

// Shared store for customer profiles, collected reviews, and settings. Powers
// both the Reviews hub and the Clients (customer profiles) page. Persists to
// localStorage in demo mode; the same action surface maps to a real API later.

export type ReviewChannel = 'sms' | 'email'
export type ReviewStatus = 'none' | 'requested' | 'reviewed'

export interface GreetingPrefs {
  birthday: boolean
  holidays: boolean
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  /** ISO YYYY-MM-DD; year may be a placeholder — only month/day are used. */
  birthday?: string
  greetings: GreetingPrefs
  reviewStatus: ReviewStatus
  lastRequestedAt?: string
  lastRequestChannel?: ReviewChannel
  createdAt: string
}

export interface CustomerReview {
  id: string
  clientId?: string
  clientName: string
  type: 'text' | 'video'
  rating?: number
  text?: string
  /** Object URL for a recorded clip (session-only in demo mode). */
  videoUrl?: string
  createdAt: string
  postedToGoogle: boolean
}

export interface ReviewSettings {
  firmName: string
  googleReviewUrl: string
  messageTemplate: string
  slug: string
}

export interface NewClientInput {
  name: string
  email: string
  phone: string
  birthday?: string
  greetings?: GreetingPrefs
}

interface ClientsValue {
  clients: Client[]
  reviews: CustomerReview[]
  settings: ReviewSettings
  addClient: (input: NewClientInput) => Client
  addClients: (inputs: NewClientInput[]) => number
  updateClient: (id: string, patch: Partial<Client>) => void
  removeClient: (id: string) => void
  markRequested: (id: string, channel: ReviewChannel) => void
  addReview: (review: Omit<CustomerReview, 'id' | 'createdAt' | 'postedToGoogle'>) => CustomerReview
  setPostedToGoogle: (id: string, posted: boolean) => void
  updateSettings: (patch: Partial<ReviewSettings>) => void
}

const ClientsContext = createContext<ClientsValue | null>(null)

const STORE_KEY = 'onestop.reviews.v1'
const todayIso = () => new Date().toISOString().slice(0, 10)
const rid = (p: string) => p + Math.random().toString(36).slice(2, 9)

const defaultSettings: ReviewSettings = {
  firmName: 'Frazier Wealth Partners',
  googleReviewUrl: 'https://g.page/r/your-google-review-link/review',
  messageTemplate:
    "Hi {{name}}, it was a pleasure working with you! Would you mind sharing a quick review of your experience with {{firm}}? It only takes a minute: {{link}}",
  slug: 'frazier-wealth',
}

const seedClients: Client[] = [
  { id: 'c-1', name: 'Michael Henderson', email: 'm.henderson@example.com', phone: '+1 415 555 0142', birthday: '1968-06-24', greetings: { birthday: true, holidays: true }, reviewStatus: 'reviewed', createdAt: '2026-05-02' },
  { id: 'c-2', name: 'Susan Alvarez', email: 'susan.alvarez@example.com', phone: '+1 415 555 0177', birthday: '1974-07-09', greetings: { birthday: true, holidays: false }, reviewStatus: 'requested', lastRequestedAt: '2026-06-04', lastRequestChannel: 'email', createdAt: '2026-05-10' },
  { id: 'c-3', name: 'David & Karen Wu', email: 'dwu@example.com', phone: '+1 650 555 0195', birthday: '1959-08-15', greetings: { birthday: true, holidays: true }, reviewStatus: 'none', createdAt: '2026-05-21' },
  { id: 'c-4', name: 'Priya Raman', email: 'priya.raman@example.com', phone: '+1 408 555 0113', birthday: '1982-12-02', greetings: { birthday: false, holidays: true }, reviewStatus: 'none', createdAt: '2026-06-01' },
]

const seedReviews: CustomerReview[] = [
  { id: 'r-1', clientId: 'c-1', clientName: 'Michael Henderson', type: 'text', rating: 5, text: 'The team helped us retire two years ahead of schedule. Clear guidance, always responsive, and genuinely cared about our goals. Highly recommend.', createdAt: '2026-05-30', postedToGoogle: true },
  { id: 'r-2', clientName: 'Janet Cole', type: 'text', rating: 5, text: 'Professional, patient, and thorough. They simplified a complicated rollover and saved us on taxes. Couldn’t be happier.', createdAt: '2026-06-02', postedToGoogle: false },
]

interface Persisted {
  clients: Client[]
  reviews: CustomerReview[]
  settings: ReviewSettings
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Persisted
      return {
        clients: p.clients ?? seedClients,
        reviews: p.reviews ?? seedReviews,
        settings: { ...defaultSettings, ...(p.settings ?? {}) },
      }
    }
  } catch {
    /* ignore */
  }
  return { clients: seedClients, reviews: seedReviews, settings: defaultSettings }
}

// Best-effort push of the workspace to Supabase. Never throws.
async function putWorkspace(token: string | null, data: unknown) {
  if (!token) return
  try {
    await fetch('/api/me/workspace', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ data }),
    })
  } catch {
    /* ignore — local remains the source of truth */
  }
}

export function ClientsProvider({ children }: { children: ReactNode }) {
  const initial = useRef(load()).current
  const [clients, setClients] = useState<Client[]>(initial.clients)
  const [reviews, setReviews] = useState<CustomerReview[]>(initial.reviews)
  const [settings, setSettings] = useState<ReviewSettings>(initial.settings)
  const { user, getAccessToken } = useAuth()

  const stateRef = useRef({ clients, reviews, settings })
  stateRef.current = { clients, reviews, settings }
  const hydratedRef = useRef(false)

  // Local cache (also the demo-mode store). Always runs — local-first.
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ clients, reviews, settings }))
    } catch {
      /* quota — ignore */
    }
  }, [clients, reviews, settings])

  // Hydrate the signed-in user's workspace from Supabase (best effort).
  useEffect(() => {
    if (!isAuthEnabled || !user) return
    let active = true
    ;(async () => {
      try {
        const token = await getAccessToken()
        if (!token) return
        const res = await fetch('/api/me/workspace', { headers: { authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const json = await res.json()
        if (!active) return
        const d = json.data as { clients?: Client[]; reviews?: CustomerReview[]; settings?: Partial<ReviewSettings> } | null
        if (d && typeof d === 'object') {
          if (Array.isArray(d.clients)) setClients(d.clients)
          if (Array.isArray(d.reviews)) setReviews(d.reviews)
          if (d.settings) setSettings((prev) => ({ ...prev, ...d.settings }))
        } else {
          // No workspace yet — seed it with the current local state.
          await putWorkspace(token, stateRef.current)
        }
      } catch {
        /* keep local */
      } finally {
        if (active) hydratedRef.current = true
      }
    })()
    return () => {
      active = false
    }
  }, [user?.id, getAccessToken])

  // Best-effort persist on change (guarded so the seed can't overwrite real
  // server data before hydration completes).
  useEffect(() => {
    if (!isAuthEnabled || !user || !hydratedRef.current) return
    const t = setTimeout(() => {
      void getAccessToken().then((token) => putWorkspace(token, { clients, reviews, settings }))
    }, 800)
    return () => clearTimeout(t)
  }, [clients, reviews, settings, user?.id, getAccessToken])

  const addClient = useCallback((input: NewClientInput) => {
    const client: Client = {
      id: rid('c-'),
      name: input.name,
      email: input.email,
      phone: input.phone,
      birthday: input.birthday,
      greetings: input.greetings ?? { birthday: true, holidays: true },
      reviewStatus: 'none',
      createdAt: todayIso(),
    }
    setClients((prev) => [client, ...prev])
    return client
  }, [])

  const addClients = useCallback((inputs: NewClientInput[]) => {
    const created = inputs.map<Client>((input) => ({
      id: rid('c-'),
      name: input.name,
      email: input.email,
      phone: input.phone,
      birthday: input.birthday,
      greetings: input.greetings ?? { birthday: true, holidays: true },
      reviewStatus: 'none',
      createdAt: todayIso(),
    }))
    setClients((prev) => [...created, ...prev])
    return created.length
  }, [])

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const removeClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const markRequested = useCallback((id: string, channel: ReviewChannel) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              reviewStatus: c.reviewStatus === 'reviewed' ? 'reviewed' : 'requested',
              lastRequestedAt: todayIso(),
              lastRequestChannel: channel,
            }
          : c,
      ),
    )
  }, [])

  const addReview = useCallback(
    (review: Omit<CustomerReview, 'id' | 'createdAt' | 'postedToGoogle'>) => {
      const full: CustomerReview = {
        ...review,
        id: rid('r-'),
        createdAt: todayIso(),
        postedToGoogle: false,
      }
      setReviews((prev) => [full, ...prev])
      if (review.clientId) {
        setClients((prev) =>
          prev.map((c) => (c.id === review.clientId ? { ...c, reviewStatus: 'reviewed' } : c)),
        )
      }
      return full
    },
    [],
  )

  const setPostedToGoogle = useCallback((id: string, posted: boolean) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, postedToGoogle: posted } : r)))
  }, [])

  const updateSettings = useCallback((patch: Partial<ReviewSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const value = useMemo<ClientsValue>(
    () => ({
      clients,
      reviews,
      settings,
      addClient,
      addClients,
      updateClient,
      removeClient,
      markRequested,
      addReview,
      setPostedToGoogle,
      updateSettings,
    }),
    [clients, reviews, settings, addClient, addClients, updateClient, removeClient, markRequested, addReview, setPostedToGoogle, updateSettings],
  )

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClients() {
  const ctx = useContext(ClientsContext)
  if (!ctx) throw new Error('useClients must be used within ClientsProvider')
  return ctx
}
