import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatDate, formatCurrency } from '@/lib/utils'
import { NuevoPedidoButton } from '@/components/modules/pedidos/nuevo-pedido-button'
import { PedidoActions } from '@/components/modules/pedidos/pedido-actions'
import { ShoppingBag, Clock, PackageCheck, Truck } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending:   { label: 'Pendiente',   class: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado',  class: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparando', class: 'bg-purple-100 text-purple-700' },
  ready:     { label: 'Listo',       class: 'bg-emerald-100 text-emerald-700' },
  delivered: { label: 'Entregado',   class: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado',   class: 'bg-gray-100 text-gray-500' },
}

export default async function PedidosPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id

  // Leer fiscal_config via admin (tiene campos sensibles)
  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: orgData } = await supabaseAdmin
    .from('organizations')
    .select('fiscal_config')
    .eq('id', orgId)
    .single()

  const hasFiscalConfig = !!(
    orgData?.fiscal_config?.tusfacturas_apikey &&
    orgData?.fiscal_config?.tusfacturas_usertoken &&
    orgData?.fiscal_config?.tusfacturas_apikey_empresas
  )

  const [{ data: orders }, { data: inventoryProducts }] = await Promise.all([
    supabase
      .from('sales_orders')
      .select('*, sales_order_items(product_name, quantity, unit, unit_price, subtotal)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('inventory_items')
      .select('id, name, unit, current_stock')
      .eq('organization_id', orgId)
      .eq('category', 'producto_terminado')
      .order('name'),
  ])

  const all = orders ?? []
  const pending   = all.filter(o => o.status === 'pending').length
  const active    = all.filter(o => ['confirmed', 'preparing'].includes(o.status)).length
  const ready     = all.filter(o => o.status === 'ready').length
  const delivered = all.filter(o => o.status === 'delivered').length

  const productTypes = ctx.organization.industry_config?.product_types ?? []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos de clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro y seguimiento de órdenes de venta
          </p>
        </div>
        <NuevoPedidoButton
          productTypes={productTypes}
          inventoryProducts={inventoryProducts ?? []}
        />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pendientes',  count: pending,   icon: Clock,        color: 'text-yellow-600' },
          { label: 'En proceso',  count: active,    icon: ShoppingBag,  color: 'text-blue-600' },
          { label: 'Listos',      count: ready,     icon: PackageCheck, color: 'text-emerald-600' },
          { label: 'Entregados',  count: delivered, icon: Truck,        color: 'text-green-600' },
        ].map(({ label, count, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color} shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos los pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {!all.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin pedidos registrados. Creá el primero con el botón de arriba.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left pb-3 pr-4 font-medium">N° Pedido</th>
                    <th className="text-left pb-3 pr-4 font-medium">Cliente</th>
                    <th className="text-left pb-3 pr-4 font-medium">Productos</th>
                    <th className="text-right pb-3 pr-4 font-medium">Total</th>
                    <th className="text-left pb-3 pr-4 font-medium">Entrega</th>
                    <th className="text-left pb-3 pr-4 font-medium">Estado</th>
                    <th className="text-left pb-3 pr-4 font-medium">Fecha</th>
                    <th className="text-left pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {all.map(order => {
                    const status = STATUS_LABELS[order.status] ?? STATUS_LABELS['pending']!
                    const items = order.sales_order_items as {
                      product_name: string
                      quantity: number
                      unit: string
                    }[] | null
                    const itemsSummary = items?.slice(0, 2).map(i =>
                      `${i.product_name} ${formatNumber(i.quantity, 1)} ${i.unit}`
                    ).join(', ') ?? '—'
                    const hasMore = (items?.length ?? 0) > 2

                    return (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-mono text-xs font-medium">
                          {order.order_number}
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{order.client_name}</p>
                          {order.client_cuit && (
                            <p className="text-xs text-muted-foreground">{order.client_cuit}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs max-w-[200px]">
                          {itemsSummary}{hasMore && ` +${(items?.length ?? 0) - 2} más`}
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {order.delivery_date ? formatDate(order.delivery_date) : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3">
                          <PedidoActions
                            orderId={order.id}
                            status={order.status}
                            hasFiscalConfig={hasFiscalConfig}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
