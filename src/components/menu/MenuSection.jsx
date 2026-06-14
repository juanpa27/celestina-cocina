import MenuItemCard from './MenuItemCard'

export default function MenuSection({ category, onAddWithModifiers }) {
  if (!category.items?.length) return null

  return (
    <section id={`cat-${category.id}`} className="mb-8">
      {/* Título de sección estilo mock */}
      <h2
        className="font-display font-bold text-[22px] flex items-center gap-2.5 mb-3.5"
        style={{ color: '#1d5e8c' }}
      >
        {category.name}
        <span
          className="flex-1 h-0.5"
          style={{
            background: 'repeating-linear-gradient(90deg, #5b96bf 0 6px, transparent 6px 12px)',
          }}
        />
      </h2>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}
      >
        {category.items.map(item => (
          <MenuItemCard
            key={item.id}
            item={item}
            onAddWithModifiers={onAddWithModifiers}
          />
        ))}
      </div>
    </section>
  )
}
