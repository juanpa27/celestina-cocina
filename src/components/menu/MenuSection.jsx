import { motion } from 'framer-motion'
import MenuItemCard from './MenuItemCard'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function MenuSection({ category, onAddWithModifiers }) {
  if (!category.items?.length) return null

  return (
    <section id={`cat-${category.id}`} className="mb-8">
      <motion.h2
        className="font-display font-bold text-[22px] flex items-center gap-2.5 mb-3.5"
        style={{ color: '#1d5e8c' }}
        initial={{ opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {category.name}
        <span
          className="flex-1 h-0.5"
          style={{
            background: 'repeating-linear-gradient(90deg, #5b96bf 0 6px, transparent 6px 12px)',
          }}
        />
      </motion.h2>

      <motion.div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
      >
        {category.items.map(item => (
          <motion.div key={item.id} variants={cardVariant}>
            <MenuItemCard
              item={item}
              onAddWithModifiers={onAddWithModifiers}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
