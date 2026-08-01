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
import type { Client, CustomerReview } from './Clients'

// Registry of every advisor the OneStop team manages. Powers the admin
// console: the roster, add-advisor, and the per-advisor drill-in (their
// clients, reviews, and analytics). Persists to localStorage in demo mode.

export type AdvisorPlan = 'Starter' | 'Growth' | 'Premium'
export type AdvisorStatus = 'active' | 'paused'

export interface AdvisorMetrics {
  visitors: number
  leads: number
  appointments: number
  reviews: number
  avgRating: number
  seoScore: number
}

export interface AdvisorAccount {
  id: string
  name: string
  firm: string
  email: string
  phone: string
  website: string
  plan: AdvisorPlan
  status: AdvisorStatus
  joinedDate: string
  accountManager: string
  metrics: AdvisorMetrics
  clients: Client[]
  reviews: CustomerReview[]
}

export interface NewAdvisorInput {
  name: string
  firm: string
  email: string
  phone: string
  website?: string
  plan: AdvisorPlan
  accountManager?: string
}

interface AdvisorsValue {
  advisors: AdvisorAccount[]
  getAdvisor: (id: string) => AdvisorAccount | undefined
  addAdvisor: (input: NewAdvisorInput) => AdvisorAccount
  updateAdvisor: (id: string, patch: Partial<AdvisorAccount>) => void
  removeAdvisor: (id: string) => void
  addClientTo: (advisorId: string, client: Omit<Client, 'id' | 'createdAt' | 'reviewStatus' | 'greetings'> & { greetings?: Client['greetings'] }) => void
  removeClientFrom: (advisorId: string, clientId: string) => void
}

const AdvisorsContext = createContext<AdvisorsValue | null>(null)

const STORE_KEY = 'onestop.advisors.v1'
const todayIso = () => new Date().toISOString().slice(0, 10)
const rid = (p: string) => p + Math.random().toString(36).slice(2, 9)

const g = (_birthday?: string): Client['greetings'] => ({ birthday: true, holidays: true })

const seed: AdvisorAccount[] = [
  {
    id: 'adv-frazier',
    name: 'Renzo Frazier',
    firm: 'Frazier Wealth Partners',
    email: 'renzofrazier@gmail.com',
    phone: '+1 415 555 0100',
    website: 'frazierwealth.com',
    plan: 'Premium',
    status: 'active',
    joinedDate: '2026-01-14',
    accountManager: 'Dana Whitfield',
    metrics: { visitors: 8421, leads: 112, appointments: 37, reviews: 24, avgRating: 4.9, seoScore: 78 },
    clients: [
      { id: 'c-1', name: 'Michael Henderson', email: 'm.henderson@example.com', phone: '+1 415 555 0142', birthday: '1968-06-24', greetings: g('1968-06-24'), reviewStatus: 'reviewed', createdAt: '2026-05-02' },
      { id: 'c-2', name: 'Susan Alvarez', email: 'susan.alvarez@example.com', phone: '+1 415 555 0177', birthday: '1974-07-09', greetings: g('1974-07-09'), reviewStatus: 'requested', createdAt: '2026-05-10' },
      { id: 'c-3', name: 'David & Karen Wu', email: 'dwu@example.com', phone: '+1 650 555 0195', birthday: '1959-08-15', greetings: g('1959-08-15'), reviewStatus: 'none', createdAt: '2026-05-21' },
    ],
    reviews: [
      { id: 'r-1', clientName: 'Michael Henderson', type: 'text', rating: 5, text: 'Helped us retire two years early. Highly recommend.', createdAt: '2026-05-30', postedToGoogle: true },
    ],
  },
  {
    id: 'adv-cole',
    name: 'Dana Cole',
    firm: 'Cole Retirement Group',
    email: 'dana@coleretirement.com',
    phone: '+1 312 555 0161',
    website: 'coleretirement.com',
    plan: 'Growth',
    status: 'active',
    joinedDate: '2026-02-20',
    accountManager: 'Marcus Lee',
    metrics: { visitors: 5130, leads: 74, appointments: 22, reviews: 15, avgRating: 4.7, seoScore: 71 },
    clients: [
      { id: 'c-4', name: 'Robert Kim', email: 'rkim@example.com', phone: '+1 312 555 0130', birthday: '1971-03-11', greetings: g('1971-03-11'), reviewStatus: 'reviewed', createdAt: '2026-05-08' },
      { id: 'c-5', name: 'Elena Popov', email: 'elena.p@example.com', phone: '+1 312 555 0148', birthday: '1985-11-22', greetings: g('1985-11-22'), reviewStatus: 'none', createdAt: '2026-05-18' },
    ],
    reviews: [
      { id: 'r-2', clientName: 'Robert Kim', type: 'text', rating: 5, text: 'Clear, patient, and thorough with our rollover.', createdAt: '2026-06-01', postedToGoogle: false },
    ],
  },
  {
    id: 'adv-summit',
    name: 'Marcus Reed',
    firm: 'Summit Financial Advisors',
    email: 'marcus@summitfa.com',
    phone: '+1 720 555 0184',
    website: 'summitfa.com',
    plan: 'Starter',
    status: 'active',
    joinedDate: '2026-04-03',
    accountManager: 'Dana Whitfield',
    metrics: { visitors: 2980, leads: 38, appointments: 11, reviews: 6, avgRating: 4.6, seoScore: 63 },
    clients: [
      { id: 'c-6', name: 'Grace Liu', email: 'grace.liu@example.com', phone: '+1 720 555 0122', birthday: '1990-09-05', greetings: g('1990-09-05'), reviewStatus: 'none', createdAt: '2026-05-25' },
    ],
    reviews: [],
  },
  {
    id: 'adv-beacon',
    name: 'Alicia Gomez',
    firm: 'Beacon Wealth Management',
    email: 'alicia@beaconwm.com',
    phone: '+1 305 555 0139',
    website: 'beaconwm.com',
    plan: 'Growth',
    status: 'paused',
    joinedDate: '2026-03-11',
    accountManager: 'Priya Nair',
    metrics: { visitors: 4110, leads: 51, appointments: 16, reviews: 9, avgRating: 4.8, seoScore: 69 },
    clients: [],
    reviews: [],
  },
]

function load(): AdvisorAccount[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as AdvisorAccount[]
  } catch {
    /* ignore */
  }
  return seed
}

export function AdvisorsProvider({ children }: { children: ReactNode }) {
  const [advisors, setAdvisors] = useState<AdvisorAccount[]>(useRef(load()).current)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(advisors))
    } catch {
      /* ignore */
    }
  }, [advisors])

  const getAdvisor = useCallback((id: string) => advisors.find((a) => a.id === id), [advisors])

  const addAdvisor = useCallback((input: NewAdvisorInput) => {
    const advisor: AdvisorAccount = {
      id: rid('adv-'),
      name: input.name,
      firm: input.firm,
      email: input.email,
      phone: input.phone,
      website: input.website || '',
      plan: input.plan,
      status: 'active',
      joinedDate: todayIso(),
      accountManager: input.accountManager || 'Unassigned',
      metrics: { visitors: 0, leads: 0, appointments: 0, reviews: 0, avgRating: 0, seoScore: 0 },
      clients: [],
      reviews: [],
    }
    setAdvisors((prev) => [advisor, ...prev])
    return advisor
  }, [])

  const updateAdvisor = useCallback((id: string, patch: Partial<AdvisorAccount>) => {
    setAdvisors((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }, [])

  const removeAdvisor = useCallback((id: string) => {
    setAdvisors((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const addClientTo: AdvisorsValue['addClientTo'] = useCallback((advisorId, client) => {
    setAdvisors((prev) =>
      prev.map((a) =>
        a.id === advisorId
          ? {
              ...a,
              clients: [
                {
                  ...client,
                  id: rid('c-'),
                  createdAt: todayIso(),
                  reviewStatus: 'none',
                  greetings: client.greetings ?? { birthday: true, holidays: true },
                } as Client,
                ...a.clients,
              ],
            }
          : a,
      ),
    )
  }, [])

  const removeClientFrom = useCallback((advisorId: string, clientId: string) => {
    setAdvisors((prev) =>
      prev.map((a) =>
        a.id === advisorId ? { ...a, clients: a.clients.filter((c) => c.id !== clientId) } : a,
      ),
    )
  }, [])

  const value = useMemo<AdvisorsValue>(
    () => ({ advisors, getAdvisor, addAdvisor, updateAdvisor, removeAdvisor, addClientTo, removeClientFrom }),
    [advisors, getAdvisor, addAdvisor, updateAdvisor, removeAdvisor, addClientTo, removeClientFrom],
  )

  return <AdvisorsContext.Provider value={value}>{children}</AdvisorsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdvisors() {
  const ctx = useContext(AdvisorsContext)
  if (!ctx) throw new Error('useAdvisors must be used within AdvisorsProvider')
  return ctx
}
