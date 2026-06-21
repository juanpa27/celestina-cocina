import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Images, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import LoginPage from './LoginPage'

const NAV = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Resumen' },
  { to: '/admin/pedidos',       icon: ShoppingBag,     label: 'Pedidos' },
  { to: '/admin/menu',          icon: UtensilsCrossed, label: 'Menú' },
  { to: '/admin/flyers',        icon: Images,          label: 'Flyers' },
  { to: '/admin/configuracion', icon: Settings,        label: 'Config' },
]

export default function AdminLayout() {
  const { session, loading, user, signOut } = useAuth()

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

      {/* ── Topbar mobile (solo logo + título) ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4"
        style={{
          background: '#1c2b36',
          height: '52px',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1.5px solid #f2c14e' }}>
          <img src="/logo-celestina.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <p className="font-display font-bold text-white text-sm">Celestina · Admin</p>
      </div>

      {/* ── Contenido (padding top para topbar, bottom para bottom nav) ── */}
      <main className="flex-1 min-w-0 pt-[52px] pb-[68px] md:pt-0 md:pb-0 overflow-auto">
        <Outlet />
      </main>

      {/* ── Bottom nav mobile ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
        style={{
          background: '#1c2b36',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors"
            style={({ isActive }) => ({
              color: isActive ? '#f2c14e' : '#64748b',
            })}
          >
            {({ isActive }) => (
              <>
                <div
                  className="flex items-center justify-center w-10 h-7 rounded-xl transition-colors"
                  style={{ background: isActive ? 'rgba(242,193,78,0.15)' : 'transparent' }}
                >
                  <Icon size={20} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}

        {/* Cerrar sesión */}
        <button
          onClick={signOut}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold"
          style={{ color: '#64748b' }}
        >
          <div className="flex items-center justify-center w-10 h-7 rounded-xl">
            <LogOut size={20} />
          </div>
          Salir
        </button>
      </nav>
    </div>
  )
}
