import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, ShoppingBag, MessageCircle } from 'lucide-react'

const STEPS = [
  {
    num: 1,
    Icon: Search,
    accent: '#1d5e8c',
    title: 'Elegí tus platos',
    desc: 'Explorá el menú y encontrá lo que más te guste. Podés filtrar por categoría con las pestañas de arriba.',
  },
  {
    num: 2,
    Icon: ShoppingBag,
    accent: '#1d5e8c',
    title: 'Tocá "Pedir"',
    desc: 'Presioná el botón azul "Pedir" en cada plato. Podés agregar varios antes de confirmar.',
  },
  {
    num: 3,
    Icon: MessageCircle,
    accent: '#25D366',
    title: 'Confirmá por WhatsApp',
    desc: 'Al finalizar tocá "Confirmar pedido". Te redirigimos a WhatsApp con tu pedido ya escrito, listo para enviar.',
  },
]

export default function HowToOrderModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(9,28,46,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed z-50 inset-x-4 rounded-3xl overflow-hidden"
            style={{ maxWidth: 420, margin: '0 auto', top: '50%', background: '#fdfbf6' }}
            initial={{ opacity: 0, scale: 0.93, y: '-46%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.93, y: '-46%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #e3edf2' }}
            >
              <h2 className="font-display font-bold text-lg" style={{ color: '#1d5e8c' }}>
                ¿Cómo pedir?
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: '#eaf3f8' }}
                aria-label="Cerrar"
              >
                <X size={16} strokeWidth={2.5} color="#1d5e8c" />
              </button>
            </div>

            {/* Steps */}
            <div className="px-5 py-5 flex flex-col gap-5">
              {STEPS.map((step, i) => {
                const Icon = step.Icon
                return (
                  <div key={step.num} className="flex gap-4">
                    {/* Número + línea conectora */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ background: step.accent }}
                      >
                        {step.num}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 16, background: '#dbe9f0', marginTop: 6 }} />
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} color={step.accent} strokeWidth={2} />
                        <p className="font-bold text-[15px]" style={{ color: '#1c2b36' }}>
                          {step.title}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#7c8a93' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm tracking-wide"
                style={{ background: '#1d5e8c' }}
              >
                ¡Entendido!
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
