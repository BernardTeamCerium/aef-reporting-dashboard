import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { SupportRequestModal } from '../components/support/SupportRequestModal'
import type { SupportType } from '../types'

const SupportModalContext = createContext<(type?: SupportType) => void>(() => {})

export function SupportModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<SupportType>('Digital')

  const openSupport = useCallback((type?: SupportType) => {
    if (type) setDefaultType(type)
    setOpen(true)
  }, [])

  return (
    <SupportModalContext.Provider value={openSupport}>
      {children}
      <SupportRequestModal
        key={open ? defaultType : 'closed'}
        open={open}
        onClose={() => setOpen(false)}
        defaultType={defaultType}
      />
    </SupportModalContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSupportModal() {
  return useContext(SupportModalContext)
}
