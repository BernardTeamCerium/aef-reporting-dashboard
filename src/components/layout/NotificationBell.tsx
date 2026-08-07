import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useAuth } from '../../state/Auth'
import { useNotifications } from '../../state/Notifications'
import { cx } from '../../lib/format'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function NotificationBell() {
  const { isAdmin } = useAuth()
  const { notifications, markRead, markAllRead, unreadFor } = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const audience = isAdmin ? 'admin' : 'advisor'
  const mine = useMemo(
    () => notifications.filter((n) => n.audience === audience).slice(0, 12),
    [notifications, audience],
  )
  const unread = unreadFor(audience)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markAllRead(audience)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {mine.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">You're all caught up.</p>
            )}
            {mine.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markRead(n.id)
                  if (n.link) navigate(n.link)
                  setOpen(false)
                }}
                className={cx(
                  'flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50',
                  !n.read && 'bg-brand-50/40',
                )}
              >
                <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-brand-500')} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800">{n.title}</span>
                  <span className="block truncate text-xs text-slate-500">{n.body}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
