import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Eye, EyeOff, Loader2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMenuAdmin } from '../../hooks/useMenu'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/utils'
import MenuItemEditor from '../../components/admin/MenuItemEditor'

export default function MenuAdminPage() {
  const { data: categories, isLoading } = useMenuAdmin()
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState(null)
  const [creatingCat, setCreatingCat] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  async function toggleCategory(cat) {
    setTogglingId(`cat-${cat.id}`)
    const { error } = await supabase
      .from('categories')
      .update({ active: !cat.active })
      .eq('id', cat.id)

    if (error) {
      toast.error('No se pudo actualizar la categoría.')
    } else {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success(cat.active ? `"${cat.name}" ocultada del menú` : `"${cat.name}" visible en el menú`)
    }
    setTogglingId(null)
  }

  async function toggleAvailable(item) {
    setTogglingId(item.id)
    const { error } = await supabase
      .from('menu_items')
      .update({ available: !item.available })
      .eq('id', item.id)

    if (error) {
      toast.error('No se pudo actualizar el plato.')
    } else {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success(item.available ? 'Plato ocultado' : 'Plato visible')
    }
    setTogglingId(null)
  }

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#1c2b36' }}>Menú</h1>
      <p className="text-xs mb-5" style={{ color: '#9ca3af' }}>
        Inactivar una categoría la oculta completa del menú público, sin tocar los platos uno a uno.
      </p>

      {isLoading && (
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map(n => (
            <div key={n}>
              <div className="h-5 w-36 rounded mb-3 animate-pulse" style={{ background: '#e5e7eb' }} />
              <div className="flex flex-col gap-2">
                {[1, 2].map(m => <div key={m} className="h-14 rounded-xl animate-pulse" style={{ background: '#e5e7eb' }} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && categories?.map(cat => (
        <section key={cat.id} className="mb-6">

          {/* Header de categoría */}
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-t-2xl"
            style={{
              background: cat.active ? '#1d5e8c' : '#e5e7eb',
              transition: 'background 0.2s',
            }}
          >
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-sm" style={{ color: cat.active ? '#fff' : '#9ca3af' }}>
                {cat.name}
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: cat.active ? 'rgba(255,255,255,0.15)' : '#d1d5db',
                  color: cat.active ? '#fff' : '#6b7280',
                }}
              >
                {cat.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            {/* Toggle categoría */}
            <button
              onClick={() => toggleCategory(cat)}
              disabled={togglingId === `cat-${cat.id}`}
              title={cat.active ? 'Desactivar categoría' : 'Activar categoría'}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              style={{
                background: cat.active ? 'rgba(255,255,255,0.2)' : '#d1d5db',
                color: cat.active ? '#fff' : '#6b7280',
              }}
            >
              {togglingId === `cat-${cat.id}`
                ? <Loader2 size={12} className="animate-spin" />
                : cat.active
                  ? <><EyeOff size={12} /> Desactivar</>
                  : <><Eye size={12} /> Activar</>
              }
            </button>
          </div>

          {/* Items de la categoría */}
          <div
            className="rounded-b-2xl overflow-hidden"
            style={{ border: '1px solid #e5e7eb', borderTop: 'none' }}
          >
            {/* Wrapper que se atenúa/bloquea si la categoría está inactiva.
                El botón "Agregar plato" queda FUERA, siempre usable. */}
            <div style={{ opacity: cat.active ? 1 : 0.5, pointerEvents: cat.active ? 'auto' : 'none' }}>
            {cat.items?.length === 0 && (
              <p className="text-xs text-center py-4 bg-white" style={{ color: '#9ca3af' }}>Sin platos</p>
            )}

            {cat.items?.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                style={{
                  borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none',
                  opacity: item.available ? 1 : 0.5,
                }}
              >
                {/* Thumbnail */}
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-lg"
                  style={{ background: '#eaf3f8' }}
                >
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    : '🍽'
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1c2b36' }}>{item.name}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{formatPrice(item.price)}</p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleAvailable(item)}
                    disabled={togglingId === item.id}
                    title={item.available ? 'Ocultar plato' : 'Mostrar plato'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100 disabled:opacity-50"
                  >
                    {togglingId === item.id
                      ? <Loader2 size={14} className="animate-spin" style={{ color: '#6b7280' }} />
                      : item.available
                        ? <Eye size={14} style={{ color: '#1d5e8c' }} />
                        : <EyeOff size={14} style={{ color: '#9ca3af' }} />
                    }
                  </button>

                  <button
                    onClick={() => setEditingItem(item)}
                    title="Editar plato"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                  >
                    <Pencil size={14} style={{ color: '#1d5e8c' }} />
                  </button>
                </div>
              </div>
            ))}
            </div>

            {/* Agregar plato — fuera del wrapper deshabilitado, siempre usable */}
            <button
              onClick={() => setCreatingCat(cat)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-sm font-bold transition-colors hover:bg-gray-50"
              style={{ borderTop: '1px solid #f3f4f6', color: '#1d5e8c' }}
            >
              <Plus size={14} /> Agregar plato
            </button>
          </div>
        </section>
      ))}

      {editingItem && (
        <MenuItemEditor item={editingItem} onClose={() => setEditingItem(null)} />
      )}

      {creatingCat && (
        <MenuItemEditor
          categoryId={creatingCat.id}
          sortOrder={(creatingCat.items?.length ?? 0) + 1}
          onClose={() => setCreatingCat(null)}
        />
      )}
    </div>
  )
}
