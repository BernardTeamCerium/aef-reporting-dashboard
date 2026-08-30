import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute, RequireAdmin } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { ContentApprovals } from './pages/ContentApprovals'
import { PrintOrders } from './pages/PrintOrders'
import { Seo } from './pages/Seo'
import { Support } from './pages/Support'
import { Login } from './pages/Login'
import { Reviews } from './pages/Reviews'
import { Clients } from './pages/Clients'
import { Services } from './pages/Services'
import { ReviewCollect } from './pages/public/ReviewCollect'
import { AdminUsers } from './pages/admin/Users'
import { AdminProgress } from './pages/admin/Progress'
import { AdminOverview } from './pages/admin/Overview'
import { AdminAdvisors } from './pages/admin/Advisors'
import { AdvisorDetail } from './pages/admin/AdvisorDetail'
import { useAuth } from './state/Auth'

/** Admins land in the management console; advisors land on their own dashboard. */
function RoleHome() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Public, no-auth review collection page */}
      <Route path="/r/:slug" element={<ReviewCollect />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<RoleHome />} />
          <Route path="/content" element={<ContentApprovals />} />
          <Route path="/print" element={<PrintOrders />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/services" element={<Services />} />
          <Route path="/seo" element={<Seo />} />
          <Route path="/support" element={<Support />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/advisors" element={<AdminAdvisors />} />
            <Route path="/admin/advisors/:id" element={<AdvisorDetail />} />
            <Route path="/admin/progress" element={<AdminProgress />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
