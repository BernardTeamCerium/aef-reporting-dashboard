import { NavLink, useNavigate } from 'react-router-dom'
import { ListChecks, LogOut, UserCog, X } from 'lucide-react'
import { navItems } from '../../nav'
import { cx } from '../../lib/format'
import { Logo } from '../Logo'
import { useAuth } from '../../state/Auth'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
  )

const adminItems = [
  {
    to: '/admin/progress',
    label: 'Service Progress',
    description: 'Track tasks delivered',
    icon: ListChecks,
  },
  {
    to: '/admin/users',
    label: 'User Management',
    description: 'Add & manage users',
    icon: UserCog,
  },
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U'
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, isAdmin, authEnabled, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
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

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={linkClass}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={19}
                    className={cx(
                      'mt-0.5 shrink-0',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                    )}
                  />
                  <span>
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span
                      className={cx('block text-xs', isActive ? 'text-brand-100' : 'text-slate-500')}
                    >
                      {item.description}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Admin-only */}
          {isAdmin && (
            <>
              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Admin
              </p>
              {adminItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={onClose} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={19}
                        className={cx(
                          'mt-0.5 shrink-0',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                        )}
                      />
                      <span>
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span
                          className={cx('block text-xs', isActive ? 'text-brand-100' : 'text-slate-500')}
                        >
                          {item.description}
                        </span>
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
              {initials(user?.fullName ?? 'User')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.fullName ?? 'User'}
              </p>
              <p className="truncate text-xs text-slate-400">
                {isAdmin ? 'Administrator' : (user?.firm ?? user?.email)}
              </p>
            </div>
            {authEnabled ? (
              <button
                onClick={handleSignOut}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={17} />
              </button>
            ) : (
              <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                Demo
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
