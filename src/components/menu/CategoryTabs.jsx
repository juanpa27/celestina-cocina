export default function CategoryTabs({ categories = [], activeId, onSelect }) {
  return (
    <div
      className="flex gap-2.5 overflow-x-auto px-5 py-4 scrollbar-none"
      style={{
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x proximity',
      }}
    >
      <button
        onClick={() => onSelect(null)}
        className="flex-shrink-0 rounded-full px-4 py-2.5 text-xs font-bold border transition-colors duration-150 active:opacity-70"
        style={{
          scrollSnapAlign: 'start',
          minHeight: '36px',
          ...(activeId === null
            ? { background: '#1d5e8c', color: '#fff', borderColor: '#1d5e8c' }
            : { background: '#fff', color: '#1d5e8c', borderColor: '#5b96bf' }),
        }}
      >
        Todo
      </button>

      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="flex-shrink-0 rounded-full px-4 py-2.5 text-xs font-bold border transition-colors duration-150 whitespace-nowrap active:opacity-70"
          style={{
            scrollSnapAlign: 'start',
            minHeight: '36px',
            ...(activeId === cat.id
              ? { background: '#1d5e8c', color: '#fff', borderColor: '#1d5e8c' }
              : { background: '#fff', color: '#1d5e8c', borderColor: '#5b96bf' }),
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
