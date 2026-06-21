import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { formatPrice, vibrateFeedback, calcDiscountedPrice } from '../../lib/utils'

export default function ModifierModal({ item, onClose }) {
  const addItem = useCartStore(s => s.addItem)
  const group = item.modifierGroups?.[0]
  const [selected, setSelected] = useState(null)

  const canConfirm = !group?.required || selected !== null
  const effectivePrice = calcDiscountedPrice(item.price, item.discount_pct)
  const totalPrice = effectivePrice + (selected?.extra_price ?? 0)

  function handleConfirm() {
    vibrateFeedback()
    addItem({
      menuItemId: item.id,
      itemName: item.name,
      basePrice: effectivePrice,
      selectedModifier: selected
        ? { name: selected.name, extraPrice: selected.extra_price }
        : null,
    })
    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backdropFilter: 'blur(3px)' }}
      initial={{ background: 'rgba(28,43,54,0)' }}
      animate={{ background: 'rgba(28,43,54,0.55)' }}
      exit={{ background: 'rgba(28,43,54,0)' }}
      transition={{ duration: 0.22 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="w-full bg-white overflow-hidden"
        style={{
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(29,94,140,0.18)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#dbe9f0' }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4" style={{ borderBottom: '1px solid #e3edf2' }}>
          <div>
            <h2 className="font-display font-bold text-xl text-celestina-tinta leading-tight">
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
            className="p-2 -mr-1 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors ml-3 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={20} className="text-celestina-tinta" />
          </button>
        </div>

        {/* Opciones */}
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

            <div className="flex flex-col gap-2.5">
              {!group.required && (
                <label
                  className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors active:opacity-80"
                  style={{
                    border: selected === null ? '2px solid #1d5e8c' : '1.5px solid #e3edf2',
                    background: selected === null ? '#eaf3f8' : '#fff',
                    minHeight: '52px',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="modifier"
                      checked={selected === null}
                      onChange={() => setSelected(null)}
                      className="accent-celestina-azul w-4 h-4"
                    />
                    <span className="text-sm font-medium text-celestina-tinta">Sin variante</span>
                  </div>
                  <span className="text-xs" style={{ color: '#7c8a93' }}>precio base</span>
                </label>
              )}

              {group.modifiers.map(mod => (
                <label
                  key={mod.id}
                  className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors active:opacity-80"
                  style={{
                    border: selected?.id === mod.id ? '2px solid #1d5e8c' : '1.5px solid #e3edf2',
                    background: selected?.id === mod.id ? '#eaf3f8' : '#fff',
                    minHeight: '52px',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="modifier"
                      checked={selected?.id === mod.id}
                      onChange={() => setSelected(mod)}
                      className="accent-celestina-azul w-4 h-4 flex-shrink-0"
                    />
                    <div>
                      <span className="text-sm font-medium text-celestina-tinta">{mod.name}</span>
                      {mod.description && (
                        <p className="text-xs mt-0.5" style={{ color: '#7c8a93' }}>{mod.description}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold flex-shrink-0 ml-2"
                    style={{ color: mod.extra_price > 0 ? '#1d5e8c' : '#7c8a93' }}
                  >
                    {mod.extra_price > 0 ? `+${formatPrice(mod.extra_price)}` : 'incluido'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
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
            className="flex-1 py-4 rounded-2xl text-white font-bold text-sm transition-opacity active:opacity-75"
            style={{
              background: '#1d5e8c',
              opacity: canConfirm ? 1 : 0.4,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
            }}
          >
            Agregar al carrito
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
