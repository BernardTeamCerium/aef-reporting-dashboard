import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { SupportModalProvider } from '../../state/SupportModal'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SupportModalProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMenu={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SupportModalProvider>
  )
}
