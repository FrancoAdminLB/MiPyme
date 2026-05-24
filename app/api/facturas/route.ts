import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/supabase/helpers'
import { emitirFactura, type FiscalConfig, type InvoiceItem } from '@/lib/integrations/tusfacturas'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const orgId = ctx.organization.id

  // Leer fiscal_config de la org (via admin para incluir campos sensibles)
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('fiscal_config')
    .eq('id', orgId)
    .single()

  const fiscalConfig = org?.fiscal_config as FiscalConfig | undefined

  if (
    !fiscalConfig?.tusfacturas_apikey ||
    !fiscalConfig?.tusfacturas_usertoken ||
    !fiscalConfig?.tusfacturas_apikey_empresas
  ) {
    return NextResponse.json(
      { error: 'Configuración fiscal incompleta. Completá los datos en Configuración > Facturación.' },
      { status: 422 }
    )
  }

  const body = await req.json() as {
    sales_order_id: string
    tipo_comprobante?: 'A' | 'B' | 'C'
  }

  if (!body.sales_order_id) {
    return NextResponse.json({ error: 'sales_order_id requerido' }, { status: 400 })
  }

  // Traer el pedido con items
  const { data: order } = await supabaseAdmin
    .from('sales_orders')
    .select('*, sales_order_items(*)')
    .eq('id', body.sales_order_id)
    .eq('organization_id', orgId)
    .single()

  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  // Verificar que no tenga factura ya emitida
  const { data: existing } = await supabaseAdmin
    .from('invoices')
    .select('id, status')
    .eq('sales_order_id', body.sales_order_id)
    .eq('status', 'issued')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'El pedido ya tiene una factura emitida.' }, { status: 409 })
  }

  const items: InvoiceItem[] = (order.sales_order_items ?? []).map((i: {
    product_name: string
    quantity: number
    unit_price: number
    unit: string
  }) => ({
    product_name: i.product_name,
    quantity: i.quantity,
    unit_price_con_iva: i.unit_price,
    unit: i.unit,
  }))

  if (!items.length) {
    return NextResponse.json({ error: 'El pedido no tiene ítems.' }, { status: 422 })
  }

  // Crear registro en estado pending
  const { data: invoice, error: insertErr } = await supabaseAdmin
    .from('invoices')
    .insert({
      organization_id:  orgId,
      sales_order_id:   body.sales_order_id,
      tipo_comprobante: body.tipo_comprobante ?? fiscalConfig.tipo_comprobante_default ?? 'B',
      punto_venta:      fiscalConfig.punto_venta,
      cuit_receptor:    order.client_cuit ?? null,
      razon_social:     order.client_name,
      total_amount:     order.total_amount,
      status:           'pending',
    })
    .select()
    .single()

  if (insertErr || !invoice) {
    return NextResponse.json({ error: 'Error al crear el registro de factura.' }, { status: 500 })
  }

  // Llamar a TusFacturasAPP
  try {
    const result = await emitirFactura({
      fiscalConfig,
      tipoComprobante: body.tipo_comprobante ?? fiscalConfig.tipo_comprobante_default ?? 'B',
      clientCuit:     order.client_cuit ?? null,
      clientRazonSocial: order.client_name,
      items,
    })

    await supabaseAdmin
      .from('invoices')
      .update({
        status:          'issued',
        cae:             result.cae,
        cae_vencimiento: result.cae_vencimiento
          ? `${result.cae_vencimiento.slice(0, 4)}-${result.cae_vencimiento.slice(4, 6)}-${result.cae_vencimiento.slice(6, 8)}`
          : null,
        numero:          parseInt(result.comprobante_nro ?? '0', 10),
        issued_at:       new Date().toISOString(),
        raw_response:    result as unknown as Record<string, unknown>,
      })
      .eq('id', invoice.id)

    return NextResponse.json({ success: true, cae: result.cae, numero: result.comprobante_nro })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'

    await supabaseAdmin
      .from('invoices')
      .update({ status: 'error', error_message: msg })
      .eq('id', invoice.id)

    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
