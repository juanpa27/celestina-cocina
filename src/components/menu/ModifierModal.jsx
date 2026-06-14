import { useState } from 'react'
import { X } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { formatPrice } from '../../lib/utils'

export default function ModifierModal({ item, onClose }) {
  const addItem = useCartStore(s => s.addItem)

  // Por ahora el menú tiene como máximo 1 grupo por ítem
  const group = item.modifierGroups?.[0]

  const [selected, setSelected] = useState(null)

  const canConfirm = !group?.required || selected !== null

  function handleConfirm() {
    const selectedModifier = selected
      ? { name: selected.name, extraPrice: selected.extra_price }
      : null

    addItem({
      menuItemId: item.id,
      itemName: item.name,
      basePrice: item.price,
      selectedModifier,
    })
    onClose()
  }

  const totalPrice = item.price + (selected?.extra_price ?? 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(28,43,54,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(29,94,140,0.18)' }}
      >
        {/* Header del modal */}
        <div
          className="flex items-start justify-between p-5"
          style={{ borderBottom: '1px solid #e3edf2' }}
        >
          <div>
            <h2 className="font-display font-bold text-lg text-celestina-tinta leading-tight">
              {item.name}
            </h2>
            {item.notes && (
              <span className="text-xs mt-0.5 block" style={{ color: '#7c8a93' }}>
                {item.notes}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors ml-2 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} className="text-celestina-tinta" />
          </button>
        </div>

        {/* Opciones del grupo */}
        {group && (
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#1d5e8c' }}>
              {group.name}
              {group.required && (
                <span className="ml-1.5 font-normal normal-case tracking-normal" style={{ color: '#7c8a93' }}>
                  (requerido)
                </span>
              )}
            </p>

            <div className="flex flex-col gap-2">
              {/* Opción "sin variante" si el grupo no es requerido */}
              {!group.required && (
                <label
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    border: selected === null ? '2px solid #1d5e8c' : '1px solid #e3edf2',
                    background: selected === null ? '#eaf3f8' : '#fff',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="modifier"
                      checked={selected === null}
                      onChange={() => setSelected(null)}
                      className="accent-celestina-azul"
                    />
                    <span className="text-sm font-medium text-celestina-tinta">Sin variante</span>
                  </div>
                  <span className="text-xs" style={{ color: '#7c8a93' }}>precio base</span>
                </label>
              )}

              {group.modifiers.map(mod => (
                <label
                  key={mod.id}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
                  style={{
                    border: selected?.id === mod.id ? '2px solid #1d5e8c' : '1px solid #e3edf2',
                    background: selected?.id === mod.id ? '#eaf3f8' : '#fff',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="modifier"
                      checked={selected?.id === mod.id}
                      onChange={() => setSelected(mod)}
                      className="accent-celestina-azul"
                    />
                    <div>
                      <span className="text-sm font-medium text-celestina-tinta">{mod.name}</span>
                      {mod.description && (
                        <p className="text-xs mt-0.5" style={{ color: '#7c8a93' }}>{mod.description}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: mod.extra_price > 0 ? '#1d5e8c' : '#7c8a93' }}
                  >
                    {mod.extra_price > 0 ? `+${formatPrice(mod.extra_price)}` : 'incluido'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Footer con total + botón */}
        <div className="px-5 pb-5 pt-2 flex items-center gap-3">
          <div className="flex-1">
            <span className="text-xs" style={{ color: '#7c8a93' }}>Total</span>
            <p className="font-display font-bold text-lg text-celestina-tinta">
              {formatPrice(totalPrice)}
            </p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-opacity"
            style={{
              background: '#1d5e8c',
              opacity: canConfirm ? 1 : 0.45,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
            }}
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  )
}
