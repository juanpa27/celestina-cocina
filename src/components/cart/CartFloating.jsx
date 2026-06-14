import { ShoppingBag } from 'lucide-react'
import { useCartStore, selectTotalItems, selectTotalPrice } from '../../store/cartStore'
import { formatPrice } from '../../lib/utils'

export default function CartFloating({ onOpen }) {
  const totalItems = useCartStore(selectTotalItems)
  const totalPrice = useCartStore(selectTotalPrice)

  if (totalItems === 0) return null

  return (
    <button
      onClick={onOpen}
      className="fixed left-4 right-4 md:hidden z-30 flex items-center justify-between text-white font-bold text-sm rounded-2xl px-4 py-3.5"
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        background: '#1d5e8c',
        boxShadow: '0 8px 24px rgba(29,94,140,0.35)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: '#f2c14e', color: '#1c2b36' }}
        >
          {totalItems}
        </span>
        Ver mi pedido
      </div>
      <span>{formatPrice(totalPrice)}</span>
    </button>
  )
}
