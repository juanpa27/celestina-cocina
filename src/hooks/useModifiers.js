import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchModifierGroups() {
  const { data, error } = await supabase
    .from('modifier_groups')
    .select(`
      id, name, selection_type, required, sort_order,
      modifiers ( id, name, extra_price, sort_order ),
      menu_item_modifier_groups ( menu_item_id, menu_items ( id, name ) )
    `)
    .order('sort_order')
    .order('sort_order', { referencedTable: 'modifiers' })
  if (error) throw error
  return (data ?? []).map(g => ({
    ...g,
    modifiers: (g.modifiers ?? []).sort((a, b) => a.sort_order - b.sort_order),
    linkedItems: (g.menu_item_modifier_groups ?? [])
      .map(r => r.menu_items)
      .filter(Boolean),
  }))
}

export function useModifierGroups() {
  return useQuery({
    queryKey: ['modifier-groups'],
    queryFn: fetchModifierGroups,
    staleTime: 0,
  })
}
