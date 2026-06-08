import { useLocation } from 'react-router-dom'
import { ExternalLink, LifeBuoy, Menu } from 'lucide-react'
import { navItems } from '../../nav'
import { currentAdvisor } from '../../data/mockData'
import { useSupportModal } from '../../state/SupportModal'
import { Button } from '../ui/Button'

interface TopbarProps {
  onOpenMenu: () => void
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { pathname } = useLocation()
  const openSupport = useSupportModal()
  const current = navItems.find((n) =>
    n.to === '/' ? pathname === '/' : pathname.startsWith(n.to),
  )

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
            {current?.label ?? 'Dashboard'}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            {current?.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href={`https://${currentAdvisor.website}`}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:inline-flex"
        >
          {currentAdvisor.website}
          <ExternalLink size={14} />
        </a>
        <Button variant="primary" size="sm" onClick={() => openSupport()}>
          <LifeBuoy size={15} />
          <span className="hidden sm:inline">Get Support</span>
        </Button>
      </div>
    </header>
  )
}
