import { NavLink } from 'react-router-dom'
import { BarChart3, X } from 'lucide-react'
import { navItems } from '../../nav'
import { currentAdvisor } from '../../data/mockData'
import { cx } from '../../lib/format'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
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
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Marketing Hub</p>
              <p className="text-xs text-slate-400">OneStop Marketing &amp; Print</p>
            </div>
          </div>
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
              className={({ isActive }) =>
                cx(
                  'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )
              }
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
                      className={cx(
                        'block text-xs',
                        isActive ? 'text-brand-100' : 'text-slate-500',
                      )}
                    >
                      {item.description}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
              {currentAdvisor.avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {currentAdvisor.name}
              </p>
              <p className="truncate text-xs text-slate-400">{currentAdvisor.firm}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
