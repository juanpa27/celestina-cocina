import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, SlidersHorizontal, Images, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import LoginPage from './LoginPage'

const NAV = [
  { to: '/admin/dashboard',     icon: LayoutDashboard,   label: 'Resumen' },
  { to: '/admin/pedidos',       icon: ShoppingBag,        label: 'Pedidos' },
  { to: '/admin/menu',          icon: UtensilsCrossed,    label: 'Menú' },
  { to: '/admin/complementos',  icon: SlidersHorizontal,  label: 'Complementos' },
  { to: '/admin/flyers',        icon: Images,             label: 'Flyers' },
  { to: '/admin/carta',         icon: BookOpen,           label: 'Carta PDF' },
  { to: '/admin/configuracion', icon: Settings,           label: 'Config' },
]

export default function AdminLayout() {
  const { session, loading, user, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: '#1d5e8c', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!session) return <LoginPage />

  return (
    <div className="min-h-screen flex" style={{ background: '#f9fafb' }}>

      {/* ── Sidebar desktop ── */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 sticky top-0 h-screen"
        style={{ background: '#1c2b36' }}
      >
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid #f2c14e' }}>
              <img src="/logo-celestina.jpg" alt="Celestina Cocina" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">Celestina</p>
              <p className="text-xs" style={{ color: '#5b96bf' }}>Back Office</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(242,193,78,0.12)' : 'transparent',
                color: isActive ? '#f2c14e' : '#94a3b8',
                borderLeft: isActive ? '3px solid #f2c14e' : '3px solid transparent',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs truncate mb-2" style={{ color: '#64748b' }}>{user?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs font-semibold transition-colors hover:text-white"
            style={{ color: '#64748b' }}
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Topbar mobile ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{
          background: '#1c2b36',
          height: '52px',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1.5px solid #f2c14e' }}>
            <img src="/logo-celestina.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <p className="font-display font-bold text-white text-sm">Celestina · Admin</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-xl transition-colors hover:bg-white/10"
          aria-label="Abrir menú"
        >
          <Menu size={22} style={{ color: '#94a3b8' }} />
        </button>
      </div>

      {/* ── Overlay del drawer ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Drawer mobile ── */}
      <div
        className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col"
        style={{
          background: '#1c2b36',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid #f2c14e' }}>
              <img src="/logo-celestina.jpg" alt="Celestina Cocina" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">Celestina</p>
              <p className="text-xs" style={{ color: '#5b96bf' }}>Back Office</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <X size={18} style={{ color: '#94a3b8' }} />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(242,193,78,0.12)' : 'transparent',
                color: isActive ? '#f2c14e' : '#94a3b8',
                borderLeft: isActive ? '3px solid #f2c14e' : '3px solid transparent',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer footer */}
        <div
          className="px-4 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs truncate mb-3" style={{ color: '#64748b' }}>{user?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-white"
            style={{ color: '#64748b' }}
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <main className="flex-1 min-w-0 pt-[52px] md:pt-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
