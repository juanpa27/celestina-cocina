import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { ShoppingBag, UtensilsCrossed, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import LoginPage from './LoginPage'

const NAV = [
  { to: '/admin/pedidos',       icon: ShoppingBag,     label: 'Pedidos' },
  { to: '/admin/menu',          icon: UtensilsCrossed, label: 'Menú' },
  { to: '/admin/configuracion', icon: Settings,        label: 'Configuración' },
]

export default function AdminLayout() {
  const { session, loading, user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#1d5e8c', borderTopColor: 'transparent' }} />
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
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
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

        {/* User */}
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3" style={{ background: '#1c2b36' }}>
        <p className="font-display font-bold text-white">Celestina · Admin</p>
        <button onClick={() => setMobileOpen(o => !o)} className="text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Drawer mobile ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-12 left-0 right-0 p-4 flex flex-col gap-2" style={{ background: '#1c2b36' }} onClick={e => e.stopPropagation()}>
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(242,193,78,0.12)' : 'transparent',
                  color: isActive ? '#f2c14e' : '#94a3b8',
                })}
              >
                <Icon size={16} />{label}
              </NavLink>
            ))}
            <button onClick={signOut} className="flex items-center gap-2 px-4 py-3 text-sm" style={{ color: '#64748b' }}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* ── Contenido ── */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
