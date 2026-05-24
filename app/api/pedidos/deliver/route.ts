import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/supabase/helpers'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/pedidos/deliver
 * Marca un pedido como entregado y descuenta stock de los ítems vinculados.
 */
export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { sales_order_id } = await req.json() as { sales_order_id: string }
  if (!sales_order_id) return NextResponse.json({ error: 'sales_order_id requerido' }, { status: 400 })

  const orgId = ctx.organization.id

  // Traer el pedido con sus ítems
  const { data: order } = await supabaseAdmin
    .from('sales_orders')
    .select('id, status, order_number, sales_order_items(id, item_id, product_name, quantity, unit)')
    .eq('id', sales_order_id)
    .eq('organization_id', orgId)
    .single()

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  if (order.status === 'delivered') return NextResponse.json({ error: 'El pedido ya está entregado' }, { status: 409 })

  const items = order.sales_order_items as {
    id: string
    item_id: string | null
    product_name: string
    quantity: number
    unit: string
  }[]

  // 1. Marcar como entregado
  await supabaseAdmin
    .from('sales_orders')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', sales_order_id)

  // 2. Descontar stock de los ítems vinculados
  const itemsWithLink = items.filter(i => i.item_id)
  if (itemsWithLink.length > 0) {
    await Promise.all(
      itemsWithLink.map(i =>
        supabaseAdmin.from('inventory_movements').insert({
          organization_id: orgId,
          item_id:         i.item_id,
          movement_type:   'salida',
          quantity:        i.quantity,
          reference:       `PED-${order.order_number}`,
          notes:           `Entrega — ${i.product_name}`,
          created_by:      ctx.profile.id,
        })
      )
    )
  }

  return NextResponse.json({
    success: true,
    stock_updated: itemsWithLink.length,
    skipped: items.length - itemsWithLink.length,
  })
}
