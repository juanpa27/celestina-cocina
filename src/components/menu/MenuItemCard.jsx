import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { formatPrice } from '../../lib/utils'

export default function MenuItemCard({ item, onAddWithModifiers }) {
  const addItem = useCartStore(s => s.addItem)
  const decrement = useCartStore(s => s.decrement)
  const getQuantity = useCartStore(s => s.getQuantity)

  const hasModifiers = item.modifierGroups?.length > 0
  const qty = hasModifiers ? 0 : getQuantity(item.id, undefined)

  function handleAdd() {
    if (hasModifiers) {
      onAddWithModifiers(item)
    } else {
      addItem({ menuItemId: item.id, itemName: item.name, basePrice: item.price, selectedModifier: null })
    }
  }

  function handleDecrement() {
    decrement(`${item.id}|`)
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{
        border: '1px solid #e3edf2',
        boxShadow: '0 2px 10px rgba(29,94,140,0.04)',
      }}
    >
      {/* Imagen */}
      <div className="w-full overflow-hidden relative" style={{ aspectRatio: '16/10' }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-display text-4xl select-none"
            style={{ background: '#eaf3f8', color: '#5b96bf' }}
          >
            🍽
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div className="p-3.5 flex flex-col gap-1 flex-1">
        <h3 className="font-display font-bold text-[17px] leading-tight text-celestina-tinta">
          {item.name}
        </h3>

        {item.description && (
          <p className="text-xs leading-relaxed flex-1" style={{ color: '#7c8a93' }}>
            {item.description}
          </p>
        )}

        {item.notes && (
          <span
            className="self-start text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#eaf3f8', color: '#1d5e8c' }}
          >
            {item.notes}
          </span>
        )}

        {/* Footer: precio + control */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            {hasModifiers && (
              <span
                className="text-[11px] font-semibold mb-1 px-2 py-0.5 rounded-full self-start"
                style={{ background: '#fff3cd', color: '#92620a' }}
              >
                Elegí tu variante
              </span>
            )}
            <span className="font-bold text-[16px] text-celestina-tinta">
              {formatPrice(item.price)}
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {hasModifiers || qty === 0 ? (
              <motion.button
                key="add-btn"
                onClick={handleAdd}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: '#1d5e8c' }}
                aria-label={`Agregar ${item.name}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                whileTap={{ scale: 0.88 }}
              >
                <Plus size={18} strokeWidth={2.5} />
              </motion.button>
            ) : (
              <motion.div
                key="qty-control"
                className="flex items-center gap-1 rounded-xl px-1.5 py-1"
                style={{ background: '#eaf3f8' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <button
                  onClick={handleDecrement}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:opacity-70"
                  style={{ background: '#1d5e8c' }}
                  aria-label="Quitar uno"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
                <motion.span
                  key={qty}
                  className="text-sm font-bold min-w-[20px] text-center text-celestina-tinta"
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  {qty}
                </motion.span>
                <button
                  onClick={handleAdd}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:opacity-70"
                  style={{ background: '#1d5e8c' }}
                  aria-label="Agregar uno más"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
