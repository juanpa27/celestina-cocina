import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MenuPage from './pages/MenuPage'
import AdminLayout from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import OrdersPage from './pages/admin/OrdersPage'
import MenuAdminPage from './pages/admin/MenuAdminPage'
import ComplementosPage from './pages/admin/ComplementosPage'
// Carga diferida: arrastran html-to-image / Google Maps / generadores, fuera del bundle del menú público.
const FlyersPage      = lazy(() => import('./pages/admin/FlyersPage'))
const CartaMenuPage   = lazy(() => import('./pages/admin/CartaMenuPage'))
const ConfigPage      = lazy(() => import('./pages/admin/ConfigPage'))
const NewOrderPage    = lazy(() => import('./pages/admin/NewOrderPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, system-ui, sans-serif',
            borderRadius: '12px',
            background: '#1c2b36',
            color: '#fdfbf6',
          },
          success: { iconTheme: { primary: '#f2c14e', secondary: '#1c2b36' } },
        }}
      />
      <Routes>
        {/* Menú público */}
        <Route path="/" element={<MenuPage />} />

        {/* Back office */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardPage />} />
          <Route path="pedidos"       element={<OrdersPage />} />
          <Route path="menu"          element={<MenuAdminPage />} />
          <Route path="complementos"  element={<ComplementosPage />} />
          <Route path="flyers"        element={<Suspense fallback={null}><FlyersPage /></Suspense>} />
          <Route path="carta"         element={<Suspense fallback={null}><CartaMenuPage /></Suspense>} />
          <Route path="configuracion" element={<Suspense fallback={null}><ConfigPage /></Suspense>} />
          <Route path="nuevo-pedido"  element={<Suspense fallback={null}><NewOrderPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
