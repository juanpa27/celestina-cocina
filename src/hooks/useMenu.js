import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchMenu({ adminMode = false } = {}) {
  let query = supabase
    .from('categories')
    .select(`
      id, name, sort_order, active,
      menu_items (
        id, name, description, price, image_url, notes, available, sort_order,
        menu_item_modifier_groups (
          modifier_groups (
            id, name, selection_type, required, sort_order,
            modifiers ( id, name, description, extra_price, sort_order )
          )
        )
      )
    `)
    .order('sort_order')
    .order('sort_order', { referencedTable: 'menu_items' })

  // El menú público solo muestra categorías activas
  if (!adminMode) query = query.eq('active', true)

  const { data, error } = await query
  if (error) throw error

  return data.map(category => ({
    ...category,
    // En admin mostramos todos los items; en público solo los disponibles
    items: (category.menu_items ?? [])
      .filter(item => adminMode || item.available)
      .map(item => {
        const modifierGroups = (item.menu_item_modifier_groups ?? [])
          .map(rel => rel.modifier_groups)
          .filter(Boolean)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(group => ({
            ...group,
            modifiers: (group.modifiers ?? []).sort((a, b) => a.sort_order - b.sort_order),
          }))

        const { menu_item_modifier_groups: _omit, ...rest } = item
        return { ...rest, modifierGroups }
      }),
  }))
}

// Menú público — solo categorías activas e items disponibles
export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: () => fetchMenu({ adminMode: false }),
  })
}

// Admin — todas las categorías e items, independientemente del estado
export function useMenuAdmin() {
  return useQuery({
    queryKey: ['menu', 'admin'],
    queryFn: () => fetchMenu({ adminMode: true }),
    staleTime: 0,
  })
}
