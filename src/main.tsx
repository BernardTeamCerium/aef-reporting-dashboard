import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AppStateProvider } from './state/AppState.tsx'
import { AuthProvider } from './state/Auth.tsx'
import { ClientsProvider } from './state/Clients.tsx'
import { AdvisorsProvider } from './state/Advisors.tsx'
import { NotificationsProvider } from './state/Notifications.tsx'
import { ToastProvider } from './components/ui/Toast.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ToastProvider>
        <AuthProvider>
          <NotificationsProvider>
            <AdvisorsProvider>
              <ClientsProvider>
                <AppStateProvider>
                  <App />
                </AppStateProvider>
              </ClientsProvider>
            </AdvisorsProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
