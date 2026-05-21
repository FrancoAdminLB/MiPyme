import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/supabase/helpers'

interface ImportItem {
  name: string
  unit: string
  category: string
  current_stock: number
  min_stock: number
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { items } = await req.json() as { items: ImportItem[] }
  if (!Array.isArray(items) || !items.length) return Response.json({ error: 'Sin ítems' }, { status: 400 })
  if (items.length > 1000) return Response.json({ error: 'Máximo 1000 ítems por importación.' }, { status: 400 })

  const supabase = createClient()
  const orgId = ctx.organization.id

  // Traer nombres ya existentes para deduplicar
  const { data: existing } = await supabase
    .from('inventory_items')
    .select('name')
    .eq('organization_id', orgId)

  const existingNames = new Set((existing ?? []).map((i) => i.name.toLowerCase().trim()))

  const toInsert = items
    .filter((i) => i.name && !existingNames.has(i.name.toLowerCase().trim()))
    .map((i) => ({
      organization_id: orgId,
      name: i.name.trim(),
      unit: i.unit.trim() || 'unidad',
      category: i.category || 'insumo',
      current_stock: i.current_stock ?? 0,
      min_stock: i.min_stock ?? 0,
    }))

  const skipped = items.length - toInsert.length

  if (!toInsert.length) {
    return Response.json({ created: 0, skipped })
  }

  const { error } = await supabase.from('inventory_items').insert(toInsert)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ created: toInsert.length, skipped })
}
