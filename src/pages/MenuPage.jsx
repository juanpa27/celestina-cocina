import { useState, useEffect, useRef } from 'react'
import { useMenu } from '../hooks/useMenu'
import MenuHeader from '../components/menu/MenuHeader'
import CategoryTabs from '../components/menu/CategoryTabs'
import MenuSection from '../components/menu/MenuSection'
import ModifierModal from '../components/menu/ModifierModal'
import CartSidebar from '../components/cart/CartSidebar'
import CartFloating from '../components/cart/CartFloating'
import AzulejoStrip from '../components/ui/AzulejoStrip'

const TABS_HEIGHT = 52 // px — altura del sticky tabs bar

export default function MenuPage() {
  const { data: categories, isLoading, error } = useMenu()
  const [activeCategory, setActiveCategory] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [modifierItem, setModifierItem] = useState(null)
  const observerRef = useRef(null)
  const visibleSet = useRef(new Set())

  // Scroll spy: detecta qué sección está visible y actualiza el tab activo
  useEffect(() => {
    if (!categories?.length) return
    observerRef.current?.disconnect()
    visibleSet.current.clear()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const id = entry.target.id.replace('cat-', '')
          if (entry.isIntersecting) visibleSet.current.add(id)
          else visibleSet.current.delete(id)
        })
        const first = categories.find(c => visibleSet.current.has(c.id))
        setActiveCategory(first?.id ?? null)
      },
      { rootMargin: `-${TABS_HEIGHT + 10}px 0px -50% 0px`, threshold: 0 }
    )

    categories.forEach(cat => {
      const el = document.getElementById(`cat-${cat.id}`)
      if (el) observerRef.current.observe(el)
    })

    return () => observerRef.current?.disconnect()
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

          {!isLoading && !error && (
            <div className="pt-2">
              {categories?.map(cat => (
                <MenuSection
                  key={cat.id}
                  category={cat}
                  onAddWithModifiers={setModifierItem}
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

      {/* Floating cart — solo mobile */}
      <CartFloating onOpen={() => setCartOpen(true)} />

      {/* Modal de modificadores */}
      {modifierItem && (
        <ModifierModal
          item={modifierItem}
          onClose={() => setModifierItem(null)}
        />
      )}
    </div>
  )
}
