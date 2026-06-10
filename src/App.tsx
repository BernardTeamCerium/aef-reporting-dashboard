import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute, RequireAdmin } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { ContentApprovals } from './pages/ContentApprovals'
import { PrintOrders } from './pages/PrintOrders'
import { Seo } from './pages/Seo'
import { Support } from './pages/Support'
import { Login } from './pages/Login'
import { AdminUsers } from './pages/admin/Users'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/content" element={<ContentApprovals />} />
          <Route path="/print" element={<PrintOrders />} />
          <Route path="/seo" element={<Seo />} />
          <Route path="/support" element={<Support />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
