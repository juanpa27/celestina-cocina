import { useState, useEffect } from 'react'
import { useMenu } from '../hooks/useMenu'
import { useIsOpen } from '../hooks/useIsOpen'
import MenuHeader from '../components/menu/MenuHeader'
import CategoryTabs from '../components/menu/CategoryTabs'
import MenuSection from '../components/menu/MenuSection'
import ModifierModal from '../components/menu/ModifierModal'
import HowToOrderModal from '../components/menu/HowToOrderModal'
import CartSidebar from '../components/cart/CartSidebar'
import CartFloating from '../components/cart/CartFloating'
import AzulejoStrip from '../components/ui/AzulejoStrip'
import ClosedBanner from '../components/ui/ClosedBanner'
import { Truck, ShoppingBag, MessageCircle, Search } from 'lucide-react'

const HOW_TO_STEPS = [
  { num: '1', Icon: Search,       label: 'Elegí tus platos',        color: '#1d5e8c' },
  { num: '2', Icon: ShoppingBag,  label: 'Tocá "Pedir"',            color: '#1d5e8c' },
  { num: '3', Icon: MessageCircle,label: 'Confirmá por WhatsApp',   color: '#25D366' },
]

const TABS_HEIGHT = 52 // px — altura del sticky tabs bar

export default function MenuPage() {
  const { data: categories, isLoading, error } = useMenu()
  const { data: isOpen = true } = useIsOpen()
  const [activeCategory, setActiveCategory] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [modifierItem, setModifierItem] = useState(null)
  const [howToOpen, setHowToOpen] = useState(false)

  // Scroll spy: la sección activa es la última cuyo top cruzó el tab bar.
  // Iterar en orden y quedarse con la última que pasó el umbral garantiza
  // que secciones cortas al final (ej. Bebidas) activen correctamente.
  useEffect(() => {
    if (!categories?.length) return

    function updateActive() {
      const threshold = TABS_HEIGHT + 16
      let activeId = null
      for (const cat of categories) {
        const el = document.getElementById(`cat-${cat.id}`)
        if (!el) continue
        if (el.getBoundingClientRect().top <= threshold) activeId = cat.id
      }
      setActiveCategory(activeId)
    }

    window.addEventListener('scroll', updateActive, { passive: true })
    updateActive()
    return () => window.removeEventListener('scroll', updateActive)
  }, [categories])

  // Click en tab: scroll suave a la sección con offset del sticky bar
  function handleTabSelect(id) {
    if (id === null) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(`cat-${id}`)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - TABS_HEIGHT - 12
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-celestina-crema">
      <MenuHeader />

      {/* Tabs de categorías */}
      {!isLoading && !error && (
        <CategoryTabs
          categories={categories ?? []}
          activeId={activeCategory}
          onSelect={handleTabSelect}
        />
      )}

      {/* Banner negocio cerrado */}
      {!isOpen && <ClosedBanner />}

      {/* Layout principal */}
      <div
        className="flex gap-7 px-5 pb-24 md:pb-10 items-start"
        style={{ maxWidth: 1100, margin: '0 auto' }}
      >
        <main className="flex-1 min-w-0">
          {isLoading && (
            <div className="flex flex-col gap-4 pt-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="animate-pulse">
                  <div className="h-6 w-40 rounded-lg mb-4" style={{ background: '#dbe9f0' }} />
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                    {[1, 2, 3].map(m => (
                      <div key={m} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e3edf2' }}>
                        <div style={{ aspectRatio: '4/3', background: '#eaf3f8' }} />
                        <div className="p-3.5 flex flex-col gap-2">
                          <div className="h-4 w-3/4 rounded" style={{ background: '#dbe9f0' }} />
                          <div className="h-3 w-full rounded" style={{ background: '#f0f5f8' }} />
                          <div className="h-3 w-2/3 rounded" style={{ background: '#f0f5f8' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: '#7c8a93' }}>
                No se pudo cargar el menú. Intentá recargar la página.
              </p>
            </div>
          )}

          {/* Mini guía cómo pedir — 3 columnas iguales, caben en cualquier mobile */}
          {!isLoading && !error && (
            <div className="pt-4 pb-1">
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {HOW_TO_STEPS.map((s) => {
                  const Icon = s.Icon
                  return (
                    <div
                      key={s.num}
                      className="flex flex-col items-center text-center gap-1.5 py-3 px-1 rounded-2xl"
                      style={{
                        background: '#fff',
                        border: '1px solid #e3edf2',
                        boxShadow: '0 1px 4px rgba(29,94,140,0.06)',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: s.color }}
                      >
                        {s.num}
                      </div>
                      <Icon size={16} color={s.color} strokeWidth={2} />
                      <span className="text-[11px] font-semibold leading-tight" style={{ color: '#1c2b36' }}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="pt-2">
              {categories?.map(cat => (
                <MenuSection
                  key={cat.id}
                  category={cat}
                  onAddWithModifiers={setModifierItem}
                  isOpen={isOpen}
                />
              ))}
            </div>
          )}
        </main>

        {/* Carrito sidebar — siempre visible en desktop */}
        <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      </div>

      {/* Footer */}
      <footer style={{ background: '#1c2b36', color: '#cfe0ea' }}>
        <AzulejoStrip height={8} />
        <div className="flex flex-col items-center gap-4 py-8 px-4">
          <p className="text-sm font-semibold tracking-wide" style={{ color: '#f2c14e' }}>
            Seguinos en las redes
          </p>
          <div className="flex items-center gap-5">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/1DozRUgv7i/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook de Celestina Cocina"
              className="transition-opacity hover:opacity-80 active:opacity-60"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#cfe0ea" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://www.instagram.com/celestinacocinapy?utm_source=qr&igsh=aTFjenViNWlmYWFw"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Celestina Cocina"
              className="transition-opacity hover:opacity-80 active:opacity-60"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#cfe0ea" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@celestinacocina"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok de Celestina Cocina"
              className="transition-opacity hover:opacity-80 active:opacity-60"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#cfe0ea" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.79a4.85 4.85 0 01-1.01-.1z"/>
              </svg>
            </a>
          </div>
          <p className="text-xs" style={{ color: '#7c8a93' }}>
            © {new Date().getFullYear()} Celestina Cocina · Caaguazú, Paraguay
          </p>
        </div>
      </footer>

      {/* Floating cart — solo mobile, oculto si el negocio está cerrado */}
      {isOpen && <CartFloating onOpen={() => setCartOpen(true)} />}

      {/* Botón flotante ¿Cómo pedir? — mobile, esquina inferior izquierda, solo ícono */}
      <button
        onClick={() => setHowToOpen(true)}
        className="fixed z-30 md:hidden w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
        style={{ bottom: 20, left: 16, background: '#1d5e8c', boxShadow: '0 4px 16px rgba(29,94,140,0.35)' }}
        aria-label="¿Cómo pedir?"
      >
        <Truck size={20} strokeWidth={2} />
      </button>

      {/* Modal de modificadores */}
      {modifierItem && (
        <ModifierModal
          item={modifierItem}
          onClose={() => setModifierItem(null)}
        />
      )}

      {/* Modal cómo pedir */}
      <HowToOrderModal open={howToOpen} onClose={() => setHowToOpen(false)} />
    </div>
  )
}
