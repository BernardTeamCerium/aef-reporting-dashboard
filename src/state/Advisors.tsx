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
import { isAuthEnabled } from '../lib/supabase'
import { useAuth } from './Auth'

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

export type ContentStatus = 'pending' | 'approved' | 'changes_requested'
export interface AdvisorContent {
  id: string
  title: string
  channel: 'Facebook' | 'LinkedIn' | 'Instagram' | 'Blog' | 'Email'
  scheduledFor: string
  status: ContentStatus
  body: string
  uploadedOn: string
}

export type ServiceOrderStatus = 'submitted' | 'in_production' | 'shipped' | 'delivered'
export interface AdvisorServiceOrder {
  id: string
  item: string
  category: string
  quantity?: number
  status: ServiceOrderStatus
  submittedOn: string
  cost: number
}

export type SupportReqStatus = 'open' | 'in_progress' | 'resolved'
export interface AdvisorSupportReq {
  id: string
  subject: string
  type: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: SupportReqStatus
  createdOn: string
}

export interface AdvisorKeyword {
  id: string
  term: string
  currentRank: number
  previousRank: number
  searchVolume: number
}

export type ActivityCategory =
  | 'Content'
  | 'Print'
  | 'Website'
  | 'SEO'
  | 'Ads'
  | 'Design'
  | 'Email'
  | 'Strategy'
  | 'Other'

/** A logged accomplishment the team delivered for the advisor. */
export interface AdvisorActivity {
  id: string
  date: string // YYYY-MM-DD
  category: ActivityCategory
  title: string
  description?: string
  /** Optional measurable outcome, e.g. "Appointments up 18%". */
  impact?: string
}

/** Where an advisor's analytics come from. */
export type AnalyticsSource = 'manual' | 'google_analytics'

export interface AdvisorIntegration {
  source: AnalyticsSource
  gaPropertyId?: string
  searchConsoleUrl?: string
  lastSyncedAt?: string
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
  reviewLink: string
  metrics: AdvisorMetrics
  trafficSources: { source: string; visitors: number }[]
  keywords: AdvisorKeyword[]
  integration: AdvisorIntegration
  clients: Client[]
  reviews: CustomerReview[]
  content: AdvisorContent[]
  orders: AdvisorServiceOrder[]
  support: AdvisorSupportReq[]
  activity: AdvisorActivity[]
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
  addContentTo: (
    advisorId: string,
    content: { title: string; channel: AdvisorContent['channel']; scheduledFor: string; body: string },
  ) => void
  removeContentFrom: (advisorId: string, contentId: string) => void
  addActivityTo: (
    advisorId: string,
    activity: { date: string; category: ActivityCategory; title: string; description?: string; impact?: string },
  ) => void
  removeActivityFrom: (advisorId: string, activityId: string) => void
}

const AdvisorsContext = createContext<AdvisorsValue | null>(null)

const STORE_KEY = 'onestop.advisors.v1'
const todayIso = () => new Date().toISOString().slice(0, 10)
const rid = (p: string) => p + Math.random().toString(36).slice(2, 9)

const g = (_birthday?: string): Client['greetings'] => ({ birthday: true, holidays: true })

const seedRaw: Omit<
  AdvisorAccount,
  'reviewLink' | 'trafficSources' | 'keywords' | 'integration' | 'content' | 'orders' | 'support' | 'activity'
>[] = [
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

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const trafficSplit = (visitors: number) => [
  { source: 'Organic Search', visitors: Math.round(visitors * 0.44) },
  { source: 'Direct', visitors: Math.round(visitors * 0.22) },
  { source: 'Social', visitors: Math.round(visitors * 0.17) },
  { source: 'Referral', visitors: Math.round(visitors * 0.1) },
  { source: 'Email', visitors: Math.round(visitors * 0.07) },
]

const sampleContent = (id: string): AdvisorContent[] =>
  id === 'adv-frazier'
    ? [
        { id: 'ct-1', title: 'Mid-Year Market Check-In', channel: 'LinkedIn', scheduledFor: '2026-06-09', status: 'pending', body: 'Markets shifted fast in the first half of 2026 — three things to review before Q3.', uploadedOn: '2026-06-01' },
        { id: 'ct-2', title: '5 Tax Moves Before Year-End', channel: 'Facebook', scheduledFor: '2026-06-11', status: 'approved', body: 'From Roth conversions to tax-loss harvesting — five moves to lower your 2026 bill.', uploadedOn: '2026-06-02' },
      ]
    : id === 'adv-cole'
      ? [{ id: 'ct-3', title: 'Retirement Myths, Debunked', channel: 'Blog', scheduledFor: '2026-06-14', status: 'pending', body: 'Three retirement myths that could be costing you.', uploadedOn: '2026-06-05' }]
      : []

const sampleOrders = (id: string): AdvisorServiceOrder[] =>
  id === 'adv-frazier'
    ? [
        { id: 'so-1', item: 'Premium Business Cards', category: 'Print', quantity: 500, status: 'in_production', submittedOn: '2026-05-28', cost: 96 },
        { id: 'so-2', item: 'Seminar Postcards', category: 'Print', quantity: 1000, status: 'shipped', submittedOn: '2026-05-19', cost: 330 },
      ]
    : id === 'adv-cole'
      ? [{ id: 'so-3', item: 'Landing page — July webinar', category: 'Website', status: 'submitted', submittedOn: '2026-06-03', cost: 450 }]
      : []

const sampleSupport = (id: string): AdvisorSupportReq[] =>
  id === 'adv-frazier'
    ? [
        { id: 'sr-1', subject: 'Update homepage headshot', type: 'Website', priority: 'normal', status: 'in_progress', createdOn: '2026-06-02' },
        { id: 'sr-2', subject: 'Landing page for July webinar', type: 'Digital', priority: 'high', status: 'open', createdOn: '2026-05-30' },
      ]
    : id === 'adv-cole'
      ? [{ id: 'sr-3', subject: 'Add team bios to About page', type: 'Website', priority: 'low', status: 'open', createdOn: '2026-06-04' }]
      : []

const sampleKeywords = (id: string): AdvisorKeyword[] =>
  id === 'adv-frazier'
    ? [
        { id: 'kw-1', term: 'financial advisor near me', currentRank: 4, previousRank: 9, searchVolume: 2400 },
        { id: 'kw-2', term: 'retirement planning', currentRank: 2, previousRank: 5, searchVolume: 1300 },
        { id: 'kw-3', term: 'fee-only financial planner', currentRank: 8, previousRank: 12, searchVolume: 880 },
        { id: 'kw-4', term: '401k rollover advice', currentRank: 6, previousRank: 18, searchVolume: 1100 },
      ]
    : id === 'adv-cole'
      ? [
          { id: 'kw-5', term: 'retirement group', currentRank: 7, previousRank: 11, searchVolume: 720 },
          { id: 'kw-6', term: 'roth conversion strategy', currentRank: 13, previousRank: 15, searchVolume: 640 },
        ]
      : []

const sampleActivity = (id: string): AdvisorActivity[] =>
  id === 'adv-frazier'
    ? [
        { id: 'ac-1', date: '2026-06-08', category: 'Content', title: 'Published "Mid-Year Market Check-In" on LinkedIn', impact: '2,400 impressions in 48 hours' },
        { id: 'ac-2', date: '2026-06-03', category: 'SEO', title: 'Completed monthly SEO audit & fixed 6 meta descriptions', impact: 'SEO score +7 (now 78/100)' },
        { id: 'ac-3', date: '2026-05-30', category: 'Website', title: 'Launched refreshed homepage with a booking CTA', impact: 'Appointments up 18% MoM' },
        { id: 'ac-4', date: '2026-05-27', category: 'Print', title: 'Designed & shipped 1,000 seminar postcards', description: 'For the June retirement seminar.' },
        { id: 'ac-5', date: '2026-05-20', category: 'Ads', title: 'Launched Google Ads campaign — retirement planning', impact: '112 new leads in 30 days' },
        { id: 'ac-6', date: '2026-05-06', category: 'Strategy', title: 'Built and approved the Q2 content calendar', description: '12 posts across LinkedIn, Facebook & blog.' },
      ]
    : id === 'adv-cole'
      ? [
          { id: 'ac-7', date: '2026-06-01', category: 'Content', title: 'Drafted 4 tax-planning blog posts', impact: 'Scheduled through July' },
          { id: 'ac-8', date: '2026-05-22', category: 'Website', title: 'Set up appointment booking on the site' },
        ]
      : []

const seed: AdvisorAccount[] = seedRaw.map((a) => ({
  ...a,
  reviewLink: `/r/${slugify(a.firm)}`,
  trafficSources: trafficSplit(a.metrics.visitors),
  keywords: sampleKeywords(a.id),
  integration: { source: 'manual' as const },
  content: sampleContent(a.id),
  orders: sampleOrders(a.id),
  support: sampleSupport(a.id),
  activity: sampleActivity(a.id),
}))

function load(): AdvisorAccount[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as AdvisorAccount[]
  } catch {
    /* ignore */
  }
  return seed
}

// Best-effort push of the whole registry to Supabase. Never throws.
async function putAdvisors(token: string | null, advisors: AdvisorAccount[]) {
  if (!token) return
  try {
    await fetch('/api/admin/advisors-data', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ advisors }),
    })
  } catch {
    /* ignore — local state remains the source of truth */
  }
}

export function AdvisorsProvider({ children }: { children: ReactNode }) {
  const [advisors, setAdvisors] = useState<AdvisorAccount[]>(useRef(load()).current)
  const { isAdmin, getAccessToken } = useAuth()

  // Keep a ref to the latest advisors for async closures.
  const advisorsRef = useRef(advisors)
  advisorsRef.current = advisors
  const hydratedRef = useRef(false)

  // Local cache (also the demo-mode store). Always runs — local-first.
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(advisors))
    } catch {
      /* ignore */
    }
  }, [advisors])

  // When a real admin is signed in, hydrate from Supabase. Falls back to the
  // local/seed data on any failure, so the console can never break.
  useEffect(() => {
    if (!isAuthEnabled || !isAdmin) return
    let active = true
    ;(async () => {
      try {
        const token = await getAccessToken()
        if (!token) return
        const res = await fetch('/api/admin/advisors-data', { headers: { authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const json = await res.json()
        if (!active) return
        const list = json.advisors as AdvisorAccount[] | undefined
        if (Array.isArray(list) && list.length) {
          setAdvisors(list)
        } else {
          // Server is empty — seed it with the current advisors.
          await putAdvisors(token, advisorsRef.current)
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
  }, [isAdmin, getAccessToken])

  // Best-effort persist on change (guarded so the initial seed can't overwrite
  // real server data before hydration completes).
  useEffect(() => {
    if (!isAuthEnabled || !isAdmin || !hydratedRef.current) return
    const t = setTimeout(() => {
      void getAccessToken().then((token) => putAdvisors(token, advisors))
    }, 800)
    return () => clearTimeout(t)
  }, [advisors, isAdmin, getAccessToken])

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
      reviewLink: `/r/${slugify(input.firm)}`,
      metrics: { visitors: 0, leads: 0, appointments: 0, reviews: 0, avgRating: 0, seoScore: 0 },
      trafficSources: [],
      keywords: [],
      integration: { source: 'manual' },
      clients: [],
      reviews: [],
      content: [],
      orders: [],
      support: [],
      activity: [],
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

  const addContentTo: AdvisorsValue['addContentTo'] = useCallback((advisorId, content) => {
    setAdvisors((prev) =>
      prev.map((a) =>
        a.id === advisorId
          ? {
              ...a,
              content: [
                { ...content, id: rid('ct-'), status: 'pending', uploadedOn: todayIso() },
                ...a.content,
              ],
            }
          : a,
      ),
    )
  }, [])

  const removeContentFrom = useCallback((advisorId: string, contentId: string) => {
    setAdvisors((prev) =>
      prev.map((a) =>
        a.id === advisorId ? { ...a, content: a.content.filter((c) => c.id !== contentId) } : a,
      ),
    )
  }, [])

  const addActivityTo: AdvisorsValue['addActivityTo'] = useCallback((advisorId, activity) => {
    setAdvisors((prev) =>
      prev.map((a) =>
        a.id === advisorId
          ? { ...a, activity: [{ ...activity, id: rid('ac-') }, ...a.activity] }
          : a,
      ),
    )
  }, [])

  const removeActivityFrom = useCallback((advisorId: string, activityId: string) => {
    setAdvisors((prev) =>
      prev.map((a) =>
        a.id === advisorId ? { ...a, activity: a.activity.filter((x) => x.id !== activityId) } : a,
      ),
    )
  }, [])

  const value = useMemo<AdvisorsValue>(
    () => ({ advisors, getAdvisor, addAdvisor, updateAdvisor, removeAdvisor, addClientTo, removeClientFrom, addContentTo, removeContentFrom, addActivityTo, removeActivityFrom }),
    [advisors, getAdvisor, addAdvisor, updateAdvisor, removeAdvisor, addClientTo, removeClientFrom, addContentTo, removeContentFrom, addActivityTo, removeActivityFrom],
  )

  return <AdvisorsContext.Provider value={value}>{children}</AdvisorsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdvisors() {
  const ctx = useContext(AdvisorsContext)
  if (!ctx) throw new Error('useAdvisors must be used within AdvisorsProvider')
  return ctx
}
