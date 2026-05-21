import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatDate } from '@/lib/utils'
import { ShoppingCart, Zap, Printer } from 'lucide-react'
import { OrderActions } from '@/components/modules/ordenes/order-actions'
import { NewOrderButton } from '@/components/modules/ordenes/new-order-button'
import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending:   { label: 'Pendiente',  class: 'bg-yellow-100 text-yellow-700' },
  sent:      { label: 'Enviada',    class: 'bg-blue-100 text-blue-700' },
  received:  { label: 'Recibida',   class: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',  class: 'bg-gray-100 text-gray-500' },
}

export default async function OrdenesPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id

  const [ordersRes, itemsRes, suppliersRes] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('*, inventory_items(name, unit, current_stock, min_stock), suppliers(name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('inventory_items')
      .select('id, name, unit, current_stock, min_stock, supplier_id')
      .eq('organization_id', orgId)
      .order('name'),
    supabase
      .from('suppliers')
      .select('id, name')
      .eq('organization_id', orgId)
      .eq('active', true)
      .order('name'),
  ])

  const orders    = ordersRes.data ?? []
  const items     = itemsRes.data ?? []
  const suppliers = suppliersRes.data ?? []

  const pending  = orders.filter(o => o.status === 'pending')
  const sent     = orders.filter(o => o.status === 'sent')
  const received = orders.filter(o => o.status === 'received')

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de compra</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reposición automática y manual de inventario
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ordenes/print" target="_blank">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-2 transition-colors">
              <Printer className="h-4 w-4" /> Imprimir órdenes
            </button>
          </Link>
          <NewOrderButton items={items as never} suppliers={suppliers as never} />
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes',  count: pending.length,  color: 'text-yellow-600' },
          { label: 'Enviadas',    count: sent.length,     color: 'text-blue-600' },
          { label: 'Recibidas',   count: received.length, color: 'text-green-600' },
        ].map(({ label, count, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla de órdenes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas las órdenes</CardTitle>
        </CardHeader>
        <CardContent>
          {!orders.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Sin órdenes registradas. Se generan automáticamente cuando el stock baja del mínimo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left pb-3 pr-4 font-medium">Ítem</th>
                    <th className="text-left pb-3 pr-4 font-medium">Proveedor</th>
                    <th className="text-right pb-3 pr-4 font-medium">Cantidad</th>
                    <th className="text-right pb-3 pr-4 font-medium">Stock al crear</th>
                    <th className="text-left pb-3 pr-4 font-medium">Origen</th>
                    <th className="text-left pb-3 pr-4 font-medium">Estado</th>
                    <th className="text-left pb-3 pr-4 font-medium">Fecha</th>
                    <th className="text-left pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((o) => {
                    const item     = o.inventory_items as { name: string; unit: string; current_stock: number; min_stock: number } | null
                    const supplier = o.suppliers as { name: string } | null
                    const status   = STATUS_LABELS[o.status] ?? STATUS_LABELS['pending']!
                    return (
                      <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-medium">{item?.name ?? '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{supplier?.name ?? '—'}</td>
                        <td className="py-3 pr-4 text-right">
                          {formatNumber(o.quantity_requested, 1)} {item?.unit}
                        </td>
                        <td className="py-3 pr-4 text-right text-muted-foreground">
                          {o.stock_at_creation != null
                            ? `${formatNumber(o.stock_at_creation, 1)} / ${formatNumber(o.min_stock_at_creation, 1)} ${item?.unit}`
                            : '—'}
                        </td>
                        <td className="py-3 pr-4">
                          {o.triggered_by === 'auto' ? (
                            <span className="flex items-center gap-1 text-xs text-purple-600">
                              <Zap className="h-3 w-3" /> Auto
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ShoppingCart className="h-3 w-3" /> Manual
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatDate(o.created_at)}
                        </td>
                        <td className="py-3">
                          <OrderActions
                            orderId={o.id}
                            itemId={o.item_id}
                            itemName={item?.name ?? ''}
                            itemUnit={item?.unit ?? 'u'}
                            quantityRequested={o.quantity_requested}
                            status={o.status}
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
