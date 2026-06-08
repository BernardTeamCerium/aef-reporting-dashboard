import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  printOrders as seedOrders,
  socialPosts as seedPosts,
  supportTickets as seedTickets,
} from '../data/mockData'
import type {
  PostStatus,
  PrintCategory,
  PrintOrder,
  SocialPost,
  SupportPriority,
  SupportTicket,
  SupportType,
} from '../types'

// Centralized in-memory store. State resets on refresh — perfect for a
// prototype — but the action surface matches what a real API client would expose.

interface NewOrderInput {
  productName: string
  category: PrintCategory
  quantity: number
  estimatedCost: number
  shipTo: string
  notes?: string
}

interface NewTicketInput {
  subject: string
  type: SupportType
  priority: SupportPriority
  description: string
}

interface AppStateValue {
  posts: SocialPost[]
  orders: PrintOrder[]
  tickets: SupportTicket[]
  setPostStatus: (id: string, status: PostStatus, feedback?: string) => void
  addOrder: (input: NewOrderInput) => PrintOrder
  addTicket: (input: NewTicketInput) => SupportTicket
}

const AppStateContext = createContext<AppStateValue | null>(null)

const todayIso = () => new Date().toISOString().slice(0, 10)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<SocialPost[]>(seedPosts)
  const [orders, setOrders] = useState<PrintOrder[]>(seedOrders)
  const [tickets, setTickets] = useState<SupportTicket[]>(seedTickets)

  const setPostStatus = useCallback(
    (id: string, status: PostStatus, feedback?: string) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status, feedback: feedback ?? p.feedback } : p,
        ),
      )
    },
    [],
  )

  const addOrder = useCallback((input: NewOrderInput) => {
    const order: PrintOrder = {
      id: `ord_${Math.floor(Math.random() * 90000 + 10000)}`,
      status: 'submitted',
      submittedOn: todayIso(),
      ...input,
    }
    setOrders((prev) => [order, ...prev])
    return order
  }, [])

  const addTicket = useCallback((input: NewTicketInput) => {
    const ticket: SupportTicket = {
      id: `tkt_${Math.floor(Math.random() * 90000 + 10000)}`,
      status: 'open',
      createdOn: todayIso(),
      updatedOn: todayIso(),
      ...input,
    }
    setTickets((prev) => [ticket, ...prev])
    return ticket
  }, [])

  const value = useMemo(
    () => ({ posts, orders, tickets, setPostStatus, addOrder, addTicket }),
    [posts, orders, tickets, setPostStatus, addOrder, addTicket],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
