import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { ContentApprovals } from './pages/ContentApprovals'
import { PrintOrders } from './pages/PrintOrders'
import { Seo } from './pages/Seo'
import { Support } from './pages/Support'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/content" element={<ContentApprovals />} />
        <Route path="/print" element={<PrintOrders />} />
        <Route path="/seo" element={<Seo />} />
        <Route path="/support" element={<Support />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
