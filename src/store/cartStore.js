import { create } from 'zustand'

const makeKey = (menuItemId, modifierName) =>
  `${menuItemId}|${modifierName ?? ''}`

export const useCartStore = create((set, get) => ({
  items: [],

  addItem({ menuItemId, itemName, basePrice, selectedModifier }) {
    const key = makeKey(menuItemId, selectedModifier?.name)
    set(({ items }) => {
      const idx = items.findIndex(i => i.key === key)
      if (idx >= 0) {
        const next = [...items]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return { items: next }
      }
      return {
        items: [
          ...items,
          { key, menuItemId, itemName, basePrice, selectedModifier: selectedModifier ?? null, quantity: 1 },
        ],
      }
    })
  },

  decrement(key) {
    set(({ items }) => {
      const idx = items.findIndex(i => i.key === key)
      if (idx < 0) return {}
      if (items[idx].quantity === 1) return { items: items.filter(i => i.key !== key) }
      const next = [...items]
      next[idx] = { ...next[idx], quantity: next[idx].quantity - 1 }
      return { items: next }
    })
  },

  removeItem(key) {
    set(({ items }) => ({ items: items.filter(i => i.key !== key) }))
  },

  clearCart() {
    set({ items: [] })
  },

  getQuantity(menuItemId, modifierName) {
    const key = makeKey(menuItemId, modifierName)
    return get().items.find(i => i.key === key)?.quantity ?? 0
  },
}))

export const selectTotalItems = s =>
  s.items.reduce((n, i) => n + i.quantity, 0)

export const selectTotalPrice = s =>
  s.items.reduce(
    (n, i) => n + (i.basePrice + (i.selectedModifier?.extraPrice ?? 0)) * i.quantity,
    0
  )
