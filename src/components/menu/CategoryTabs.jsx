import { useEffect, useRef } from 'react'

export default function CategoryTabs({ categories = [], activeId, onSelect }) {
  const stripRef = useRef(null)
  const btnRefs = useRef({})

  // Auto-scroll el strip para mantener el tab activo visible
  useEffect(() => {
    const key = activeId ?? '__todo__'
    const btn = btnRefs.current[key]
    const strip = stripRef.current
    if (!btn || !strip) return
    const target = btn.offsetLeft - strip.offsetWidth / 2 + btn.offsetWidth / 2
    strip.scrollTo({ left: target, behavior: 'smooth' })
  }, [activeId])

  const activeStyle = { background: '#1d5e8c', color: '#fff', borderColor: '#1d5e8c' }
  const idleStyle   = { background: '#fff', color: '#1d5e8c', borderColor: '#5b96bf' }
  const btnClass    = 'flex-shrink-0 rounded-full px-4 py-2.5 text-xs font-bold border transition-colors duration-150 whitespace-nowrap active:opacity-70'

  return (
    <div
      className="sticky z-20"
      style={{
        top: 0,
        borderBottom: '1px solid rgba(227,237,242,0.7)',
        background: 'rgba(253,251,246,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        ref={stripRef}
        className="flex gap-2.5 overflow-x-auto px-5 py-3 scrollbar-none"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <button
          ref={el => { btnRefs.current['__todo__'] = el }}
          onClick={() => onSelect(null)}
          className={btnClass}
          style={{ minHeight: 36, ...(activeId === null ? activeStyle : idleStyle) }}
        >
          Todo
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            ref={el => { btnRefs.current[cat.id] = el }}
            onClick={() => onSelect(cat.id)}
            className={btnClass}
            style={{ minHeight: 36, ...(activeId === cat.id ? activeStyle : idleStyle) }}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
