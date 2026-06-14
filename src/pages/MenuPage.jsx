import { useState } from 'react'
import { useMenu } from '../hooks/useMenu'
import MenuHeader from '../components/menu/MenuHeader'
import CategoryTabs from '../components/menu/CategoryTabs'
import MenuSection from '../components/menu/MenuSection'
import ModifierModal from '../components/menu/ModifierModal'
import CartSidebar from '../components/cart/CartSidebar'
import CartFloating from '../components/cart/CartFloating'
import AzulejoStrip from '../components/ui/AzulejoStrip'

export default function MenuPage() {
  const { data: categories, isLoading, error } = useMenu()
  const [activeCategory, setActiveCategory] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [modifierItem, setModifierItem] = useState(null)

  const visible = activeCategory
    ? categories?.filter(c => c.id === activeCategory)
    : categories

  return (
    <div className="min-h-screen bg-celestina-crema">
      <MenuHeader />

      {/* Tabs de categorías */}
      {!isLoading && !error && (
        <CategoryTabs
          categories={categories ?? []}
          activeId={activeCategory}
          onSelect={setActiveCategory}
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
              {visible?.map(cat => (
                <MenuSection
                  key={cat.id}
                  category={cat}
                  onAddWithModifiers={setModifierItem}
                />
              ))}

              {visible?.length === 0 && (
                <p className="text-sm py-12 text-center" style={{ color: '#7c8a93' }}>
                  No hay platos disponibles en esta categoría.
                </p>
              )}
            </div>
          )}
        </main>

        {/* Carrito sidebar — siempre visible en desktop */}
        <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      </div>

      {/* Footer */}
      <footer style={{ background: '#1c2b36', color: '#cfe0ea' }}>
        <AzulejoStrip height={8} />
        <p className="text-center py-6 text-xs px-4">
          © {new Date().getFullYear()} Celestina Cocina · Caaguazú, Paraguay · Hecho con 💛
        </p>
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
