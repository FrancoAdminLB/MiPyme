import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const { itemIds }: { itemIds: string[] } = await req.json()
  if (!Array.isArray(itemIds) || !itemIds.length) return NextResponse.json({ created: 0 })

  const orgId = profile.organization_id

  // Traer los ítems afectados con su stock actual y proveedor
  const { data: items } = await supabaseAdmin
    .from('inventory_items')
    .select('id, name, current_stock, min_stock, supplier_id')
    .eq('organization_id', orgId)
    .in('id', itemIds)

  if (!items?.length) return NextResponse.json({ created: 0 })

  // Filtrar los que están bajo el mínimo
  const belowMin = items.filter(i => i.current_stock < i.min_stock)
  if (!belowMin.length) return NextResponse.json({ created: 0 })

  // Evitar duplicados: no crear si ya hay una orden pending o sent para ese ítem
  const { data: existing } = await supabaseAdmin
    .from('purchase_orders')
    .select('item_id')
    .eq('organization_id', orgId)
    .in('status', ['pending', 'sent'])
    .in('item_id', belowMin.map(i => i.id))

  const existingItemIds = new Set((existing ?? []).map(o => o.item_id))
  const toCreate = belowMin.filter(i => !existingItemIds.has(i.id))

  if (!toCreate.length) return NextResponse.json({ created: 0 })

  const orders = toCreate.map(item => ({
    organization_id: orgId,
    item_id: item.id,
    supplier_id: item.supplier_id ?? null,
    // Solicitar suficiente para llegar al doble del mínimo
    quantity_requested: Math.max(item.min_stock * 2 - item.current_stock, item.min_stock),
    status: 'pending',
    triggered_by: 'auto',
    stock_at_creation: item.current_stock,
    min_stock_at_creation: item.min_stock,
    notes: `Stock bajo mínimo: ${item.current_stock} < ${item.min_stock}`,
  }))

  const { error } = await supabaseAdmin.from('purchase_orders').insert(orders)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ created: orders.length, items: toCreate.map(i => i.name) })
}
