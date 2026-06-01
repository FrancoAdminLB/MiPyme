import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react'
import { MargenChart } from '@/components/modules/finanzas/margen-chart'

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function FinanzasPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id

  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [batchesRes, batchInputsRes, salesOrdersRes, salesItemsRes, pendingOrdersRes] = await Promise.all([
    // Lotes completados — últimos 50 para histórico
    supabase
      .from('production_batches')
      .select('id, batch_code, product_name, quantity_kg, end_date')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .order('end_date', { ascending: false })
      .limit(50),
    // Insumos de lotes con costo unitario
    supabase
      .from('production_batch_inputs')
      .select('batch_id, quantity_used, inventory_items(name, unit_cost)')
      .eq('organization_id', orgId),
    // Pedidos de clientes
    supabase
      .from('sales_orders')
      .select('id, order_number, client_name, status, total_amount, delivered_at')
      .eq('organization_id', orgId)
      .order('delivered_at', { ascending: false }),
    // Items de pedidos entregados (para precio de venta por producto)
    supabase
      .from('sales_order_items')
      .select('order_id, product_name, unit_price, quantity, subtotal')
      .eq('organization_id', orgId),
    // Órdenes de compra activas (para egresos proyectados)
    supabase
      .from('purchase_orders')
      .select('id, status')
      .eq('organization_id', orgId)
      .in('status', ['pending', 'sent']),
  ])

  const batches       = batchesRes.data ?? []
  const batchInputs   = batchInputsRes.data ?? []
  const salesOrders   = salesOrdersRes.data ?? []
  const salesItems    = salesItemsRes.data ?? []
  const pendingOrders = pendingOrdersRes.data ?? []

  // ─── Costo por lote ───────────────────────────────────────────────
  const batchCosts = batches.map(batch => {
    const inputs = batchInputs.filter(i => i.batch_id === batch.id)
    const hasInputs = inputs.length > 0
    const allHaveCost = hasInputs && inputs.every(i => (i.inventory_items as unknown as { unit_cost: number | null } | null)?.unit_cost != null)
    const costo_total = inputs.reduce((acc, i) => {
      const cost = (i.inventory_items as unknown as { unit_cost: number | null } | null)?.unit_cost ?? 0
      return acc + i.quantity_used * cost
    }, 0)
    const costo_unitario = batch.quantity_kg > 0 ? costo_total / batch.quantity_kg : 0
    return { ...batch, costo_total, costo_unitario, hasInputs, allHaveCost }
  })

  // ─── KPIs del mes ─────────────────────────────────────────────────
  const deliveredThisMonth = salesOrders.filter(
    o => o.status === 'delivered' && o.delivered_at?.startsWith(currentYearMonth)
  )
  const ingresosDelMes = deliveredThisMonth.reduce((acc, o) => acc + (o.total_amount ?? 0), 0)

  const completedThisMonth = batchCosts.filter(b => b.end_date?.startsWith(currentYearMonth))
  const costosDelMes = completedThisMonth.reduce((acc, b) => acc + b.costo_total, 0)

  const margenDelMes = ingresosDelMes > 0
    ? ((ingresosDelMes - costosDelMes) / ingresosDelMes) * 100
    : null

  // ─── Proyección ───────────────────────────────────────────────────
  const activeOrders = salesOrders.filter(o =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  )
  const ingresosProyectados = activeOrders.reduce((acc, o) => acc + (o.total_amount ?? 0), 0)

  // ─── Rentabilidad por producto ────────────────────────────────────
  const deliveredIds = new Set(salesOrders.filter(o => o.status === 'delivered').map(o => o.id))

  const productCost: Record<string, { totalCost: number; totalQty: number; count: number }> = {}
  for (const b of batchCosts) {
    if (!b.allHaveCost) continue
    if (!productCost[b.product_name]) productCost[b.product_name] = { totalCost: 0, totalQty: 0, count: 0 }
    productCost[b.product_name]!.totalCost += b.costo_total
    productCost[b.product_name]!.totalQty  += b.quantity_kg
    productCost[b.product_name]!.count     += 1
  }

  const productRevenue: Record<string, { totalRevenue: number; totalQty: number }> = {}
  for (const item of salesItems) {
    if (!deliveredIds.has(item.order_id)) continue
    if (!productRevenue[item.product_name]) productRevenue[item.product_name] = { totalRevenue: 0, totalQty: 0 }
    productRevenue[item.product_name]!.totalRevenue += item.subtotal ?? 0
    productRevenue[item.product_name]!.totalQty     += item.quantity ?? 0
  }

  const rentabilidad = Object.keys({ ...productCost, ...productRevenue })
    .map(name => {
      const cost    = productCost[name]
      const revenue = productRevenue[name]
      const avgCostPerUnit    = cost    && cost.totalQty    > 0 ? cost.totalCost       / cost.totalQty    : null
      const avgPricePerUnit   = revenue && revenue.totalQty > 0 ? revenue.totalRevenue / revenue.totalQty : null
      const margen = avgCostPerUnit != null && avgPricePerUnit != null && avgPricePerUnit > 0
        ? ((avgPricePerUnit - avgCostPerUnit) / avgPricePerUnit) * 100
        : null
      return { name, avgCostPerUnit, avgPricePerUnit, margen }
    })
    .sort((a, b) => (b.margen ?? -999) - (a.margen ?? -999))

  const margenChartData = rentabilidad
    .filter(p => p.margen != null)
    .map(p => ({ name: p.name, margen: Math.max(0, p.margen!) }))

  // Items sin costo configurado
  const batchesWithoutFullCost = batchCosts.filter(b => b.hasInputs && !b.allHaveCost)
  const hasMissingCosts = batchesWithoutFullCost.length > 0

  // ─── Render ───────────────────────────────────────────────────────
  const kpis = [
    {
      title: 'Ingresos del mes',
      value: formatARS(ingresosDelMes),
      sub: `${deliveredThisMonth.length} pedidos entregados`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Costos de producción',
      value: costosDelMes > 0 ? formatARS(costosDelMes) : '—',
      sub: `${completedThisMonth.filter(b => b.allHaveCost).length} lotes con costo calculado`,
      icon: TrendingDown,
      color: 'text-red-500',
    },
    {
      title: 'Margen bruto del mes',
      value: margenDelMes != null ? `${formatNumber(margenDelMes, 1)}%` : '—',
      sub: margenDelMes != null
        ? margenDelMes >= 30 ? 'Saludable' : margenDelMes >= 15 ? 'Aceptable' : 'Bajo — revisar costos'
        : 'Completá costos unitarios en inventario',
      icon: TrendingUp,
      color: margenDelMes == null ? 'text-muted-foreground' : margenDelMes >= 30 ? 'text-green-600' : margenDelMes >= 15 ? 'text-amber-600' : 'text-red-500',
    },
    {
      title: 'Ingresos proyectados',
      value: formatARS(ingresosProyectados),
      sub: `${activeOrders.length} pedidos activos + ${pendingOrders.length} órdenes de compra abiertas`,
      icon: DollarSign,
      color: 'text-blue-600',
    },
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Costos de producción, márgenes y flujo proyectado de {ctx.organization.name}
        </p>
      </div>

      {/* Aviso si faltan costos unitarios */}
      {hasMissingCosts && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3 text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Costos incompletos — los márgenes pueden ser inexactos</p>
                <p className="text-amber-700 mt-0.5">
                  {batchesWithoutFullCost.length} lote{batchesWithoutFullCost.length > 1 ? 's tienen' : ' tiene'} insumos sin costo unitario.
                  Ingresá el costo en cada ítem de inventario desde <strong>Inventario → editar ítem</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Costo por lote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Costo por lote — últimos 20 completados</CardTitle>
        </CardHeader>
        <CardContent>
          {batchCosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin lotes completados todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-3 pr-4 font-medium">Lote</th>
                  <th className="text-left pb-3 pr-4 font-medium">Producto</th>
                  <th className="text-right pb-3 pr-4 font-medium">Producción</th>
                  <th className="text-right pb-3 pr-4 font-medium">Costo total</th>
                  <th className="text-right pb-3 font-medium">Costo / unidad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batchCosts.slice(0, 20).map(b => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{b.batch_code}</td>
                    <td className="py-2.5 pr-4 font-medium">{b.product_name}</td>
                    <td className="py-2.5 pr-4 text-right">{formatNumber(b.quantity_kg, 1)} kg</td>
                    <td className="py-2.5 pr-4 text-right">
                      {b.allHaveCost
                        ? <span className="font-semibold">{formatARS(b.costo_total)}</span>
                        : <span className="text-muted-foreground flex items-center justify-end gap-1">
                            <Info className="h-3 w-3" /> Sin datos
                          </span>
                      }
                    </td>
                    <td className="py-2.5 text-right">
                      {b.allHaveCost && b.costo_unitario > 0
                        ? formatARS(b.costo_unitario)
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Rentabilidad por producto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rentabilidad por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {rentabilidad.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin datos suficientes. Completá costos unitarios en inventario y registrá pedidos entregados.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left pb-3 pr-4 font-medium">Producto</th>
                    <th className="text-right pb-3 pr-4 font-medium">Costo / u.</th>
                    <th className="text-right pb-3 pr-4 font-medium">Precio / u.</th>
                    <th className="text-right pb-3 font-medium">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rentabilidad.map(p => (
                    <tr key={p.name} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                      <td className="py-2.5 pr-4 text-right text-muted-foreground">
                        {p.avgCostPerUnit != null ? formatARS(p.avgCostPerUnit) : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-muted-foreground">
                        {p.avgPricePerUnit != null ? formatARS(p.avgPricePerUnit) : '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        {p.margen != null ? (
                          <span className={`font-semibold ${
                            p.margen >= 30 ? 'text-green-600' :
                            p.margen >= 15 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {formatNumber(p.margen, 1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de márgenes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Margen bruto por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {margenChartData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                Sin datos para graficar
              </div>
            ) : (
              <MargenChart data={margenChartData} />
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600 inline-block" /> ≥30% saludable</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600 inline-block" /> 15–30% aceptable</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;15% revisar</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos activos (ingresos proyectados) */}
      {activeOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos activos — ingresos proyectados</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-3 pr-4 font-medium">N° pedido</th>
                  <th className="text-left pb-3 pr-4 font-medium">Cliente</th>
                  <th className="text-left pb-3 pr-4 font-medium">Estado</th>
                  <th className="text-right pb-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeOrders.map(o => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{o.order_number}</td>
                    <td className="py-2.5 pr-4 font-medium">{o.client_name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === 'pending'    ? 'bg-yellow-100 text-yellow-700' :
                        o.status === 'confirmed'  ? 'bg-blue-100 text-blue-700' :
                        o.status === 'preparing'  ? 'bg-purple-100 text-purple-700' :
                                                    'bg-green-100 text-green-700'
                      }`}>
                        {o.status === 'pending'   ? 'Pendiente' :
                         o.status === 'confirmed' ? 'Confirmado' :
                         o.status === 'preparing' ? 'Preparando' : 'Listo'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold">{formatARS(o.total_amount ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={3} className="pt-3 text-sm font-medium text-muted-foreground">Total proyectado</td>
                  <td className="pt-3 text-right text-base font-bold">{formatARS(ingresosProyectados)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
