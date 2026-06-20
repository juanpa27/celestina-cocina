import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Eye, EyeOff, Loader2, Plus, FolderPlus, X, Trash2, AlertTriangle, UtensilsCrossed } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMenuAdmin } from '../../hooks/useMenu'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/utils'
import MenuItemEditor from '../../components/admin/MenuItemEditor'

export default function MenuAdminPage() {
  const { data: categories, isLoading } = useMenuAdmin()
  const queryClient = useQueryClient()

  // Platos
  const [editingItem, setEditingItem] = useState(null)
  const [creatingCat, setCreatingCat] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  // Nueva categoría
  const [newCatOpen, setNewCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)
  const newCatInputRef = useRef(null)

  // Editar nombre de categoría
  const [editingCat, setEditingCat] = useState(null) // { id, name }
  const [savingEditCat, setSavingEditCat] = useState(false)
  const editCatInputRef = useRef(null)

  // Borrar categoría — { cat, step: 1|2, ordersCount, loading }
  const [deletingCat, setDeletingCat] = useState(null)

  useEffect(() => {
    if (newCatOpen) newCatInputRef.current?.focus()
  }, [newCatOpen])

  useEffect(() => {
    if (editingCat) editCatInputRef.current?.focus()
  }, [editingCat])

  // ── Crear categoría ──────────────────────────────────────────────
  async function createCategory(e) {
    e.preventDefault()
    const name = newCatName.trim()
    if (!name) return
    setSavingCat(true)
    const sortOrder = (categories?.length ?? 0) + 1
    const { error } = await supabase
      .from('categories')
      .insert({ name, sort_order: sortOrder, active: true })
    if (error) {
      toast.error('No se pudo crear la categoría.')
    } else {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success(`Categoría "${name}" creada.`)
      setNewCatName('')
      setNewCatOpen(false)
    }
    setSavingCat(false)
  }

  // ── Editar nombre de categoría ───────────────────────────────────
  async function saveEditCategory(e) {
    e.preventDefault()
    const name = editingCat.name.trim()
    if (!name) return
    setSavingEditCat(true)
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', editingCat.id)
    if (error) {
      toast.error('No se pudo renombrar la categoría.')
    } else {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success('Categoría renombrada.')
      setEditingCat(null)
    }
    setSavingEditCat(false)
  }

  // ── Iniciar borrado: cargar impacto ──────────────────────────────
  async function startDeleteCategory(cat) {
    setDeletingCat({ cat, step: 1, ordersCount: 0, loading: true })
    const itemIds = (cat.items ?? []).map(i => i.id)
    let ordersCount = 0
    if (itemIds.length > 0) {
      const { count } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .in('menu_item_id', itemIds)
      ordersCount = count ?? 0
    }
    setDeletingCat(prev => ({ ...prev, ordersCount, loading: false }))
  }

  // ── Pasar al paso 2 o ejecutar directamente ─────────────────────
  function advanceDelete() {
    if (deletingCat.ordersCount > 0) {
      setDeletingCat(prev => ({ ...prev, step: 2 }))
    } else {
      executeDelete()
    }
  }

  // ── Ejecutar borrado ─────────────────────────────────────────────
  async function executeDelete() {
    const cat = deletingCat.cat
    setDeletingCat(prev => ({ ...prev, loading: true }))

    const itemIds = (cat.items ?? []).map(i => i.id)

    // Desvincular order_items antes de borrar (FK sin CASCADE)
    if (itemIds.length > 0) {
      await supabase
        .from('order_items')
        .update({ menu_item_id: null })
        .in('menu_item_id', itemIds)
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', cat.id)

    if (error) {
      toast.error('No se pudo borrar la categoría.')
      setDeletingCat(prev => ({ ...prev, loading: false }))
    } else {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success(`"${cat.name}" eliminada.`)
      setDeletingCat(null)
    }
  }

  // ── Toggle categoría / plato ─────────────────────────────────────
  async function toggleCategory(cat) {
    setTogglingId(`cat-${cat.id}`)
    const { error } = await supabase
      .from('categories')
      .update({ active: !cat.active })
      .eq('id', cat.id)
    if (error) toast.error('No se pudo actualizar la categoría.')
    else {
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
    if (error) toast.error('No se pudo actualizar el plato.')
    else {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success(item.available ? 'Plato ocultado' : 'Plato visible')
    }
    setTogglingId(null)
  }

  // ── Helpers de estilo ────────────────────────────────────────────
  const inputStyle = {
    border: '1.5px solid #d1d5db',
    color: '#1c2b36',
    outline: 'none',
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-t-2xl"
            style={{
              background: cat.active ? '#1d5e8c' : '#e5e7eb',
              transition: 'background 0.2s',
            }}
          >
            {/* Nombre */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <h2 className="font-display font-bold text-sm truncate" style={{ color: cat.active ? '#fff' : '#9ca3af' }}>
                {cat.name}
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                style={{
                  background: cat.active ? 'rgba(255,255,255,0.15)' : '#d1d5db',
                  color: cat.active ? '#fff' : '#6b7280',
                }}
              >
                {cat.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            {/* Acciones de categoría */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Renombrar */}
              <button
                onClick={() => setEditingCat({ id: cat.id, name: cat.name })}
                title="Renombrar categoría"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
              >
                <Pencil size={13} color={cat.active ? '#fff' : '#6b7280'} />
              </button>

              {/* Borrar */}
              <button
                onClick={() => startDeleteCategory(cat)}
                title="Borrar categoría"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
              >
                <Trash2 size={13} color={cat.active ? '#fca5a5' : '#ef4444'} />
              </button>

              {/* Toggle activo */}
              <button
                onClick={() => toggleCategory(cat)}
                disabled={togglingId === `cat-${cat.id}`}
                title={cat.active ? 'Desactivar categoría' : 'Activar categoría'}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ml-1"
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
          </div>

          {/* Items de la categoría */}
          <div
            className="rounded-b-2xl overflow-hidden"
            style={{ border: '1px solid #e5e7eb', borderTop: 'none' }}
          >
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
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-lg"
                    style={{ background: '#eaf3f8' }}
                  >
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      : <UtensilsCrossed size={20} style={{ color: '#5b96bf' }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1c2b36' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{formatPrice(item.price)}</p>
                  </div>

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

      {/* Botón nueva categoría */}
      {!isLoading && (
        <button
          onClick={() => setNewCatOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-colors hover:opacity-85 mt-2"
          style={{ background: '#f2c14e', color: '#1c2b36', border: '2px dashed #e5b83a' }}
        >
          <FolderPlus size={16} /> Nueva categoría
        </button>
      )}

      {/* ── Modal: nueva categoría ───────────────────────────────── */}
      {newCatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setNewCatOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg" style={{ color: '#1c2b36' }}>Nueva categoría</h2>
              <button onClick={() => setNewCatOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createCategory} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Nombre</label>
                <input
                  ref={newCatInputRef}
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Ej: Postres, Entradas…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                  maxLength={60}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setNewCatOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#f3f4f6', color: '#6b7280' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={savingCat || !newCatName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: '#1d5e8c', color: '#fff' }}>
                  {savingCat ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
                  {savingCat ? 'Guardando…' : 'Crear categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: renombrar categoría ───────────────────────────── */}
      {editingCat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditingCat(null) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg" style={{ color: '#1c2b36' }}>Renombrar categoría</h2>
              <button onClick={() => setEditingCat(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveEditCategory} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Nuevo nombre</label>
                <input
                  ref={editCatInputRef}
                  type="text"
                  value={editingCat.name}
                  onChange={e => setEditingCat(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                  maxLength={60}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingCat(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#f3f4f6', color: '#6b7280' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={savingEditCat || !editingCat.name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: '#1d5e8c', color: '#fff' }}>
                  {savingEditCat ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                  {savingEditCat ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: borrar categoría (2 pasos) ────────────────────── */}
      {deletingCat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget && !deletingCat.loading) setDeletingCat(null) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">

            {/* Paso 1: resumen de impacto */}
            {deletingCat.step === 1 && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
                    <Trash2 size={18} color="#dc2626" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base" style={{ color: '#1c2b36' }}>
                      Borrar "{deletingCat.cat.name}"
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                {deletingCat.loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={20} className="animate-spin" style={{ color: '#1d5e8c' }} />
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                      <p className="text-sm" style={{ color: '#374151' }}>
                        <span className="font-bold">{deletingCat.cat.items?.length ?? 0} platos</span> serán eliminados del menú.
                      </p>
                      {deletingCat.ordersCount > 0 ? (
                        <div className="flex items-start gap-2 mt-1 rounded-lg p-2.5" style={{ background: '#fef9c3', border: '1px solid #fde68a' }}>
                          <AlertTriangle size={14} style={{ color: '#92400e', flexShrink: 0, marginTop: 1 }} />
                          <p className="text-xs leading-snug" style={{ color: '#92400e' }}>
                            <span className="font-bold">{deletingCat.ordersCount} líneas de pedidos históricos</span> quedarán sin vínculo al plato, pero los pedidos y sus datos se conservan intactos.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: '#9ca3af' }}>
                          Ningún pedido histórico hace referencia a estos platos.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setDeletingCat(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: '#f3f4f6', color: '#6b7280' }}>
                        Cancelar
                      </button>
                      <button onClick={advanceDelete}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
                        style={{ background: '#dc2626', color: '#fff' }}>
                        <Trash2 size={14} />
                        {deletingCat.ordersCount > 0 ? 'Continuar →' : 'Borrar'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Paso 2: confirmación final (solo si hay pedidos afectados) */}
            {deletingCat.step === 2 && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
                    <AlertTriangle size={18} color="#dc2626" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base" style={{ color: '#dc2626' }}>
                      ¿Estás segura?
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                      Esto borrará la categoría y todos sus platos de forma permanente.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p className="text-sm leading-snug" style={{ color: '#991b1b' }}>
                    Los <span className="font-bold">{deletingCat.ordersCount} registros de pedidos</span> que referenciaban estos platos perderán el vínculo, pero el historial de pedidos (nombre, precio, cantidades) se mantiene intacto.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setDeletingCat(prev => ({ ...prev, step: 1 }))}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: '#f3f4f6', color: '#6b7280' }}>
                    ← Volver
                  </button>
                  <button onClick={executeDelete} disabled={deletingCat.loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-1.5"
                    style={{ background: '#dc2626', color: '#fff' }}>
                    {deletingCat.loading
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                    {deletingCat.loading ? 'Borrando…' : 'Borrar definitivamente'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
