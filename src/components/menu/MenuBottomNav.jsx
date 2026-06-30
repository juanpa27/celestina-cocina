import { Home, UtensilsCrossed, ShoppingBag, MessageCircle, HelpCircle } from 'lucide-react'
import { useCartStore, selectTotalItems } from '../../store/cartStore'
import { WHATSAPP_NUMBER } from '../../lib/config'

const ITEMS = (handlers) => [
  { key: 'home',    Icon: Home,            label: 'Inicio',    action: handlers.onScrollTop },
  { key: 'menu',    Icon: UtensilsCrossed, label: 'Menú',      action: handlers.onScrollMenu },
  { key: 'cart',    Icon: ShoppingBag,     label: 'Carrito',   action: handlers.onCartOpen, cart: true },
  { key: 'wa',      Icon: MessageCircle,   label: 'WhatsApp',  action: handlers.onWhatsApp },
  { key: 'help',    Icon: HelpCircle,      label: 'Ayuda',     action: handlers.onHowToOpen },
]

export default function MenuBottomNav({ onScrollTop, onScrollMenu, onCartOpen, onHowToOpen }) {
  const totalItems = useCartStore(selectTotalItems)

  function handleWhatsApp() {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank', 'noopener')
  }

  const items = ITEMS({ onScrollTop, onScrollMenu, onCartOpen, onWhatsApp: handleWhatsApp, onHowToOpen })

  return (
    <div
      className="md:hidden fixed left-1/2 z-40"
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        transform: 'translateX(-50%)',
      }}
    >
      <div
        className="flex items-center px-2 py-1.5 rounded-full"
        style={{
          background: '#1c2b36',
          boxShadow: '0 8px 32px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {items.map(({ key, Icon, label, action, cart }) => (
          <button
            key={key}
            onClick={action}
            aria-label={label}
            className="relative flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{ width: 50, height: 50 }}
          >
            <Icon
              size={22}
              style={{ color: '#f2c14e' }}
              strokeWidth={1.8}
            />
            {cart && totalItems > 0 && (
              <span
                className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
                style={{
                  minWidth: 16,
                  height: 16,
                  padding: '0 3px',
                  background: '#f2c14e',
                  color: '#1c2b36',
                }}
              >
                {totalItems}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
