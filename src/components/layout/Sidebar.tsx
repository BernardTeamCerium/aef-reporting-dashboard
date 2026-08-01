import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ListChecks,
  LogOut,
  UserCog,
  X,
  type LucideIcon,
} from 'lucide-react'
import { navItems } from '../../nav'
import { cx } from '../../lib/format'
import { Logo } from '../Logo'
import { useAuth } from '../../state/Auth'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

interface AdminNavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}

const adminNav: AdminNavItem[] = [
  {
    to: '/admin',
    label: 'Advisors',
    description: 'Manage advisors & clients',
    icon: Briefcase,
    isActive: (p) => p === '/admin' || p.startsWith('/admin/advisors'),
  },
  {
    to: '/admin/progress',
    label: 'Service Progress',
    description: 'Track tasks delivered',
    icon: ListChecks,
    isActive: (p) => p.startsWith('/admin/progress'),
  },
  {
    to: '/admin/users',
    label: 'Team & Access',
    description: 'Login accounts & roles',
    icon: UserCog,
    isActive: (p) => p.startsWith('/admin/users'),
  },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, isAdmin, authEnabled, signOut, canSwitchRole, demoRole, setDemoRole } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const switchRole = (role: 'admin' | 'advisor') => {
    setDemoRole(role)
    navigate(role === 'admin' ? '/admin' : '/', { replace: true })
    onClose()
  }

  const itemClass = (active: boolean) =>
    cx(
      'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
      active ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
    )

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} aria-hidden />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-ink-950 text-slate-300 transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <Logo />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Context label */}
        <p className="px-6 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {isAdmin ? 'OneStop Admin' : 'Advisor Dashboard'}
        </p>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
          {isAdmin
            ? adminNav.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={onClose} className={itemClass(item.isActive(pathname))}>
                  <item.icon size={19} className={cx('mt-0.5 shrink-0', item.isActive(pathname) ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                  <span>
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className={cx('block text-xs', item.isActive(pathname) ? 'text-brand-100' : 'text-slate-500')}>
                      {item.description}
                    </span>
                  </span>
                </NavLink>
              ))
            : navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) => itemClass(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={19} className={cx('mt-0.5 shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                      <span>
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className={cx('block text-xs', isActive ? 'text-brand-100' : 'text-slate-500')}>
                          {item.description}
                        </span>
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
        </nav>

        {/* Demo role switch */}
        {canSwitchRole && (
          <div className="px-4 pb-2">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Demo — view as
            </p>
            <div className="flex rounded-lg bg-white/5 p-1">
              {(['admin', 'advisor'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => switchRole(role)}
                  className={cx(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-semibold capitalize transition-colors',
                    demoRole === role ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white',
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
              {initials(user?.fullName ?? 'User')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.fullName ?? 'User'}</p>
              <p className="truncate text-xs text-slate-400">
                {isAdmin ? 'Administrator' : (user?.firm ?? user?.email)}
              </p>
            </div>
            {authEnabled && (
              <button
                onClick={handleSignOut}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={17} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
