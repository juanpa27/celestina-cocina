import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/utils'
import { useModifierGroups } from '../../hooks/useModifiers'

// ── Modales ─────────────────────────────────────────────────────────────────

function GroupFormModal({ group, onClose, onSave }) {
  const [name, setName] = useState(group?.name ?? '')
  const [selectionType, setSelectionType] = useState(group?.selection_type ?? 'single')
  const [required, setRequired] = useState(group?.required ?? false)
  const [saving, setSaving] = useState(false)
  const isCreate = !group

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    const payload = { name: trimmed, selection_type: selectionType, required }
    let error
    if (isCreate) {
      ;({ error } = await supabase.from('modifier_groups').insert({ ...payload, sort_order: 0 }))
    } else {
      ;({ error } = await supabase.from('modifier_groups').update(payload).eq('id', group.id))
    }
    if (error) {
      toast.error('No se pudo guardar.')
    } else {
      toast.success(isCreate ? `Grupo "${trimmed}" creado.` : 'Grupo actualizado.')
      onSave()
      onClose()
    }
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg" style={{ color: '#1c2b36' }}>
            {isCreate ? 'Nuevo grupo' : 'Editar grupo'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>
              Nombre del grupo
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Variación, Salsa…"
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ borderColor: '#e5e7eb' }}
              maxLength={60}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#1d5e8c' }}>
              Tipo de selección
            </label>
            <div className="flex gap-2">
              {[{ value: 'single', label: 'Una opción' }, { value: 'multiple', label: 'Varias' }].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectionType(value)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all"
                  style={{
                    borderColor: selectionType === value ? '#1d5e8c' : '#e5e7eb',
                    background: selectionType === value ? '#eaf3f8' : '#fff',
                    color: selectionType === value ? '#1d5e8c' : '#6b7280',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold" style={{ color: '#1c2b36' }}>Obligatorio</span>
              <p className="text-xs mt-0.5" style={{ color: '#7c8a93' }}>El cliente debe elegir antes de agregar al carrito</p>
            </div>
            <input
              type="checkbox"
              checked={required}
              onChange={e => setRequired(e.target.checked)}
              className="w-5 h-5 rounded"
            />
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: '#f3f4f6', color: '#6b7280' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ background: '#1d5e8c', color: '#fff' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {isCreate ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModifierFormModal({ groupId, modifier, sortOrder, onClose, onSave }) {
  const [name, setName] = useState(modifier?.name ?? '')
  const [extraPrice, setExtraPrice] = useState(modifier?.extra_price ?? 0)
  const [saving, setSaving] = useState(false)
  const isCreate = !modifier

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    let error
    if (isCreate) {
      ;({ error } = await supabase.from('modifiers').insert({
        group_id: groupId,
        name: trimmed,
        extra_price: Number(extraPrice),
        sort_order: sortOrder,
      }))
    } else {
      ;({ error } = await supabase.from('modifiers').update({
        name: trimmed,
        extra_price: Number(extraPrice),
      }).eq('id', modifier.id))
    }
    if (error) {
      toast.error('No se pudo guardar.')
    } else {
      toast.success(isCreate ? `"${trimmed}" creada.` : 'Opción actualizada.')
      onSave()
      onClose()
    }
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg" style={{ color: '#1c2b36' }}>
            {isCreate ? 'Nueva opción' : 'Editar opción'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Nombre</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Napolitana, Boloñesa…"
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ borderColor: '#e5e7eb' }}
              maxLength={60}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#1d5e8c' }}>Precio extra (Gs)</label>
            <input
              value={extraPrice}
              onChange={e => setExtraPrice(e.target.value)}
              type="number"
              step="1000"
              min="0"
              className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ borderColor: '#e5e7eb' }}
            />
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>0 = incluida sin costo extra</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: '#f3f4f6', color: '#6b7280' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ background: '#1d5e8c', color: '#fff' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {isCreate ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteGroupModal({ group, onClose, onDelete }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const linkedCount = group.linkedItems?.length ?? 0
  const modCount = group.modifiers?.length ?? 0

  async function executeDelete() {
    setLoading(true)
    const { error } = await supabase.from('modifier_groups').delete().eq('id', group.id)
    if (error) {
      toast.error('No se pudo borrar el grupo.')
      setLoading(false)
    } else {
      toast.success(`Grupo "${group.name}" eliminado.`)
      onDelete()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef2f2' }}>
            <Trash2 size={18} color="#dc2626" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: '#1c2b36' }}>
              Borrar "{group.name}"
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Esta acción no se puede deshacer.</p>
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
              <p className="text-sm" style={{ color: '#374151' }}>
                Se eliminarán <span className="font-bold">{modCount} opcion{modCount !== 1 ? 'es' : ''}</span> del grupo.
              </p>
              {linkedCount > 0 ? (
                <div className="flex items-start gap-2 mt-1 rounded-lg p-2.5" style={{ background: '#fef9c3', border: '1px solid #fde68a' }}>
                  <AlertTriangle size={14} style={{ color: '#92400e', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-xs leading-snug" style={{ color: '#92400e' }}>
                    Está aplicado a <span className="font-bold">{linkedCount} plato{linkedCount !== 1 ? 's' : ''}</span>:{' '}
                    {group.linkedItems.map(i => i.name).join(', ')}. Dejarán de ofrecer estas opciones al cliente.
                  </p>
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#9ca3af' }}>No está aplicado a ningún plato del menú.</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#f3f4f6', color: '#6b7280' }}
              >
                Cancelar
              </button>
              <button
                onClick={linkedCount > 0 ? () => setStep(2) : executeDelete}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {linkedCount > 0 ? 'Continuar →' : 'Borrar'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-xl p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-sm leading-snug" style={{ color: '#991b1b' }}>
                Los <span className="font-bold">{linkedCount} platos</span> asociados dejarán de ofrecer estas opciones al cliente. Los pedidos históricos conservan sus datos intactos.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#f3f4f6', color: '#6b7280' }}
              >
                ← Volver
              </button>
              <button
                onClick={executeDelete}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Borrar definitivamente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Tarjeta de grupo ─────────────────────────────────────────────────────────

function GroupCard({ group, onEditGroup, onDeleteGroup, onAddModifier, onEditModifier, onDeleteModifier }) {
  return (
    <section className="mb-6">
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-t-2xl flex-wrap"
        style={{ background: '#1d5e8c' }}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <h2 className="font-display font-bold text-sm" style={{ color: '#fff' }}>{group.name}</h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            {group.selection_type === 'single' ? 'Una opción' : 'Varias'}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{
              background: group.required ? 'rgba(242,193,78,0.25)' : 'rgba(255,255,255,0.1)',
              color: group.required ? '#f2c14e' : 'rgba(255,255,255,0.6)',
            }}
          >
            {group.required ? 'Obligatorio' : 'Opcional'}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEditGroup}
            title="Editar grupo"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/20"
          >
            <Pencil size={13} color="#fff" />
          </button>
          <button
            onClick={onDeleteGroup}
            title="Borrar grupo"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/20"
          >
            <Trash2 size={13} color="#fca5a5" />
          </button>
        </div>
      </div>

      <div className="rounded-b-2xl overflow-hidden" style={{ border: '1px solid #e5e7eb', borderTop: 'none' }}>
        {group.modifiers.length === 0 && (
          <p className="text-xs text-center py-4 bg-white" style={{ color: '#9ca3af' }}>Sin opciones todavía</p>
        )}

        {group.modifiers.map((mod, idx) => (
          <div
            key={mod.id}
            className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50"
            style={{ borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#1c2b36' }}>{mod.name}</p>
              <p className="text-xs" style={{ color: mod.extra_price > 0 ? '#1d5e8c' : '#9ca3af' }}>
                {mod.extra_price > 0 ? `+ ${formatPrice(mod.extra_price)}` : 'Incluida'}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEditModifier(mod)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
              >
                <Pencil size={14} style={{ color: '#1d5e8c' }} />
              </button>
              <button
                onClick={() => onDeleteModifier(mod)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
              >
                <Trash2 size={14} style={{ color: '#ef4444' }} />
              </button>
            </div>
          </div>
        ))}

        {group.linkedItems?.length > 0 && (
          <div className="px-4 py-2" style={{ background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
            <p className="text-xs" style={{ color: '#9ca3af' }}>
              <span className="font-semibold" style={{ color: '#6b7280' }}>Aplicado a:</span>{' '}
              {group.linkedItems.map(i => i.name).join(', ')}
            </p>
          </div>
        )}

        <button
          onClick={onAddModifier}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-sm font-bold hover:bg-gray-50"
          style={{ borderTop: '1px solid #f3f4f6', color: '#1d5e8c' }}
        >
          <Plus size={14} /> Agregar opción
        </button>
      </div>
    </section>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function ComplementosPage() {
  const { data: groups = [], isLoading } = useModifierGroups()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['modifier-groups'] })
    queryClient.invalidateQueries({ queryKey: ['menu'] })
  }

  async function deleteModifier(mod) {
    const { error } = await supabase.from('modifiers').delete().eq('id', mod.id)
    if (error) toast.error('No se pudo borrar.')
    else { toast.success(`"${mod.name}" eliminada.`); invalidate() }
  }

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1" style={{ color: '#1c2b36' }}>Complementos</h1>
      <p className="text-xs mb-5" style={{ color: '#9ca3af' }}>
        Grupos de opciones que el cliente elige al agregar ciertos platos al carrito (ej: variación de milanesa, salsa de pasta).
      </p>

      {isLoading && (
        <div className="flex flex-col gap-6">
          {[1, 2].map(n => (
            <div key={n}>
              <div className="h-5 w-36 rounded mb-3 animate-pulse" style={{ background: '#e5e7eb' }} />
              <div className="h-20 rounded-xl animate-pulse" style={{ background: '#e5e7eb' }} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="text-center py-12 rounded-2xl" style={{ border: '2px dashed #e5e7eb' }}>
          <p className="text-4xl mb-3">🧩</p>
          <p className="font-display font-bold text-base mb-1" style={{ color: '#1c2b36' }}>Sin grupos todavía</p>
          <p className="text-xs" style={{ color: '#9ca3af' }}>Creá el primer grupo para agregar variaciones a tus platos.</p>
        </div>
      )}

      {!isLoading && groups.map(group => (
        <GroupCard
          key={group.id}
          group={group}
          onEditGroup={() => setModal({ type: 'edit-group', data: group })}
          onDeleteGroup={() => setModal({ type: 'delete-group', data: group })}
          onAddModifier={() => setModal({ type: 'create-modifier', data: { groupId: group.id, sortOrder: group.modifiers.length + 1 } })}
          onEditModifier={mod => setModal({ type: 'edit-modifier', data: mod })}
          onDeleteModifier={deleteModifier}
        />
      ))}

      {!isLoading && (
        <button
          onClick={() => setModal({ type: 'create-group' })}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold hover:opacity-85 mt-2"
          style={{ background: '#f2c14e', color: '#1c2b36', border: '2px dashed #e5b83a' }}
        >
          <Plus size={16} /> Nuevo grupo
        </button>
      )}

      {(modal?.type === 'create-group' || modal?.type === 'edit-group') && (
        <GroupFormModal
          group={modal.type === 'edit-group' ? modal.data : null}
          onClose={() => setModal(null)}
          onSave={invalidate}
        />
      )}
      {modal?.type === 'delete-group' && (
        <DeleteGroupModal
          group={modal.data}
          onClose={() => setModal(null)}
          onDelete={invalidate}
        />
      )}
      {(modal?.type === 'create-modifier' || modal?.type === 'edit-modifier') && (
        <ModifierFormModal
          groupId={modal.type === 'create-modifier' ? modal.data.groupId : null}
          modifier={modal.type === 'edit-modifier' ? modal.data : null}
          sortOrder={modal.type === 'create-modifier' ? modal.data.sortOrder : 0}
          onClose={() => setModal(null)}
          onSave={invalidate}
        />
      )}
    </div>
  )
}
