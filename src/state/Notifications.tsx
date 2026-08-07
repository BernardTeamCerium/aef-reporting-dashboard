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

// In-app notification center. Events (post approved, new support request, etc.)
// create notifications routed to an audience (admins or advisors). Persists to
// localStorage; important events also fire an email via the Zapier webhook.

export type NotifAudience = 'admin' | 'advisor'

export interface AppNotification {
  id: string
  audience: NotifAudience
  type: string
  title: string
  body: string
  link?: string
  createdAt: string
  read: boolean
}

export interface NotifyInput {
  audience: NotifAudience
  type: string
  title: string
  body: string
  link?: string
  /** Also send an email: true (to the audience default) or an explicit address. */
  email?: boolean | string
}

interface NotificationsValue {
  notifications: AppNotification[]
  add: (input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markRead: (id: string) => void
  markAllRead: (audience: NotifAudience) => void
  unreadFor: (audience: NotifAudience) => number
}

const NotificationsContext = createContext<NotificationsValue | null>(null)

const KEY = 'onestop.notifications.v1'

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AppNotification[]
  } catch {
    /* ignore */
  }
  return []
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(useRef(load()).current)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(notifications.slice(0, 100)))
    } catch {
      /* ignore */
    }
  }, [notifications])

  const add = useCallback((input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const n: AppNotification = {
      ...input,
      id: 'n-' + Math.random().toString(36).slice(2, 10),
      createdAt: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [n, ...prev].slice(0, 100))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback((audience: NotifAudience) => {
    setNotifications((prev) => prev.map((n) => (n.audience === audience ? { ...n, read: true } : n)))
  }, [])

  const unreadFor = useCallback(
    (audience: NotifAudience) => notifications.filter((n) => n.audience === audience && !n.read).length,
    [notifications],
  )

  const value = useMemo<NotificationsValue>(
    () => ({ notifications, add, markRead, markAllRead, unreadFor }),
    [notifications, add, markRead, markAllRead, unreadFor],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}

/**
 * Fire a notification: always shows in-app, and (when a backend is configured
 * and `email` is set) also emails the audience via the Zapier webhook.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useNotify() {
  const { add } = useNotifications()
  const { getAccessToken } = useAuth()

  return useCallback(
    (input: NotifyInput) => {
      add({ audience: input.audience, type: input.type, title: input.title, body: input.body, link: input.link })
      if (isAuthEnabled && input.email) {
        void (async () => {
          try {
            const token = await getAccessToken()
            await fetch('/api/notify', {
              method: 'POST',
              headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({
                audience: input.audience,
                to: typeof input.email === 'string' ? input.email : undefined,
                title: input.title,
                body: input.body,
              }),
            })
          } catch {
            /* best effort */
          }
        })()
      }
    },
    [add, getAccessToken],
  )
}
