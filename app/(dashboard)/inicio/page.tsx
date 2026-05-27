import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { formatNumber, formatDate } from '@/lib/utils'
import {
  FlaskConical, Package, ShoppingCart, ShoppingBag,
  ArrowRight, CheckCircle2, Clock, CheckCheck,
  ListChecks,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

function greeting(name: string | null) {
  const h = new Date().getHours()
  const saludo = h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
  return name ? `${saludo}, ${name.split(' ')[0]}` : saludo
}

export default async function InicioPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id
  const today = new Date().toISOString().split('T')[0]

  const [
    batchesRes,
    completedTodayRes,
    ordersRes,
    stockAlertsRes,
    recentMovementsRes,
    pedidosRes,
  ] = await Promise.all([
    supabase
      .from('production_batches')
      .select('id, batch_code, product_name, status, quantity_kg, start_date, yield_percentage')
      .eq('organization_id', orgId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false }),
    supabase
      .from('production_batches')
      .select('id, product_name, quantity_kg')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .eq('end_date', today),
    supabase
      .from('purchase_orders')
      .select('id, status, inventory_items(name, unit), quantity_requested')
      .eq('organization_id', orgId)
      .in('status', ['pending', 'sent'])
      .order('created_at', { ascending: false }),
    supabase
      .from('inventory_items')
      .select('id, name, current_stock, min_stock, unit')
      .eq('organization_id', orgId)
      .filter('current_stock', 'lt', 'min_stock')
      .order('current_stock'),
    supabase
      .from('inventory_movements')
      .select('id, movement_type, quantity, reference, created_at, inventory_items(name, unit)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('sales_orders')
      .select('id, order_number, client_name, total_amount, status, delivery_date, sales_order_items(product_name, quantity, unit)')
      .eq('organization_id', orgId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const isNewAccount = !batchesRes.data?.length && !recentMovementsRes.data?.length

  const batches         = batchesRes.data ?? []
  const completedToday  = completedTodayRes.data ?? []
  const orders          = ordersRes.data ?? []
  const stockAlerts     = stockAlertsRes.data ?? []
  const recentMovements = recentMovementsRes.data ?? []
  const pedidos         = pedidosRes.data ?? []
  const kgHoy = completedToday.reduce((sum, b) => sum + (b.quantity_kg ?? 0), 0)
  const systemStatus: 'ok' | 'warning' = (stockAlerts.length > 0 || orders.length > 0 || pedidos.length > 0) ? 'warning' : 'ok'

  const STATUS_COLORS = {
    ok:      { dot: 'bg-green-500', text: 'text-green-600', label: 'Todo en orden' },
    warning: { dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'Requiere atención' },
  }
  const status = STATUS_COLORS[systemStatus]

  const kpis = [
    {
      label: 'Lotes en proceso',
      value: batches.length,
      icon: FlaskConical,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/produccion',
      sub: batches.length === 0 ? 'Sin lotes activos' : `${batches.map(b => b.product_name).slice(0, 2).join(', ')}${batches.length > 2 ? '...' : ''}`,
    },
    {
      label: 'Órdenes pendientes',
      value: orders.length,
      icon: ShoppingCart,
      color: orders.length > 0 ? 'text-orange-600' : 'text-green-600',
      bg: orders.length > 0 ? 'bg-orange-50' : 'bg-green-50',
      href: '/ordenes',
      sub: orders.length === 0 ? 'Sin órdenes activas' : `${orders.filter(o => o.status === 'pending').length} pendientes · ${orders.filter(o => o.status === 'sent').length} enviadas`,
    },
    {
      label: 'Stock bajo mínimo',
      value: stockAlerts.length,
      icon: Package,
      color: stockAlerts.length > 0 ? 'text-red-600' : 'text-green-600',
      bg: stockAlerts.length > 0 ? 'bg-red-50' : 'bg-green-50',
      href: '/inventario',
      sub: stockAlerts.length === 0 ? 'Inventario OK' : stockAlerts.slice(0, 2).map(i => i.name).join(', '),
    },
    {
      label: 'Completados hoy',
      value: completedToday.length,
      icon: CheckCheck,
      color: completedToday.length > 0 ? 'text-emerald-600' : 'text-muted-foreground',
      bg: completedToday.length > 0 ? 'bg-emerald-50' : 'bg-muted',
      href: '/produccion',
      sub: completedToday.length === 0 ? 'Sin completar hoy' : `${formatNumber(kgHoy, 1)} kg totales`,
    },
    {
      label: 'Pedidos activos',
      value: pedidos.length,
      icon: ShoppingBag,
      color: pedidos.length > 0 ? 'text-orange-600' : 'text-green-600',
      bg: pedidos.length > 0 ? 'bg-orange-50' : 'bg-green-50',
      href: '/pedidos',
      sub: pedidos.length === 0 ? 'Sin pedidos pendientes' : `${pedidos.filter(p => p.status === 'pending').length} sin confirmar`,
    },
  ]

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting(ctx.profile.full_name)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ctx.organization.name} · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          systemStatus === 'ok' ? 'bg-green-50 border-green-200' :
          systemStatus === 'warning' ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
          <span className={status.text}>{status.label}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link key={kpi.label} href={kpi.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs font-medium mt-0.5">{kpi.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{kpi.sub}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Primeros pasos — solo se muestra en cuentas nuevas sin actividad */}
      {isNewAccount && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-semibold flex items-center gap-2 mb-4">
              <ListChecks className="h-4 w-4 text-primary" />
              Primeros pasos para empezar a operar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  step: '1',
                  title: 'Cargá tu inventario',
                  desc: 'Agregá tus materias primas y productos terminados con sus stocks iniciales.',
                  href: '/inventario',
                  cta: 'Ir a Inventario',
                },
                {
                  step: '2',
                  title: 'Registrá tu primera producción',
                  desc: 'Creá un lote de producción y vinculalo a los insumos que usaste.',
                  href: '/produccion',
                  cta: 'Ir a Producción',
                },
                {
                  step: '3',
                  title: 'Cargá un pedido de cliente',
                  desc: 'Registrá un pedido y hacé seguimiento hasta la entrega.',
                  href: '/pedidos',
                  cta: 'Ir a Pedidos',
                },
              ].map(({ step, title, desc, href, cta }) => (
                <Link key={step} href={href} className="group block rounded-lg border bg-background p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                      {step}
                    </span>
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{desc}</p>
                  <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:underline">
                    {cta} <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Lotes en proceso */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Producción activa</p>
              <Link href="/produccion" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {batches.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No hay lotes en proceso.</p>
                <Link href="/produccion" className="text-xs text-primary hover:underline mt-1 block">
                  Crear nuevo lote
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {batches.slice(0, 4).map(b => {
                  const days = Math.floor((Date.now() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{b.product_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{b.batch_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatNumber(b.quantity_kg, 1)} kg</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" /> {days === 0 ? 'Hoy' : `${days}d`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Actividad reciente</p>
              <Link href="/inventario" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver inventario <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin movimientos recientes.</p>
            ) : (
              <div className="space-y-2">
                {recentMovements.map(m => {
                  const item = m.inventory_items as unknown as { name: string; unit: string } | null
                  return (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          m.movement_type === 'entrada' ? 'bg-green-500' :
                          m.movement_type === 'salida'  ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{item?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{m.reference ?? formatDate(m.created_at)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${
                        m.movement_type === 'entrada' ? 'text-green-600' :
                        m.movement_type === 'salida'  ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {m.movement_type === 'entrada' ? '+' : m.movement_type === 'salida' ? '−' : '='}
                        {formatNumber(m.quantity, 1)} {item?.unit}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Pedidos de clientes activos */}
      {pedidos.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Pedidos activos
              </p>
              <Link href="/pedidos" className="text-xs text-orange-700 font-medium hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-1.5">
              {pedidos.map(p => {
                const items = p.sales_order_items as { product_name: string; quantity: number; unit: string }[] | null
                const STATUS: Record<string, string> = { pending: 'Sin confirmar', confirmed: 'Confirmado', preparing: 'Preparando', ready: 'Listo' }
                return (
                  <div key={p.id} className="flex items-center justify-between text-xs text-orange-800">
                    <div>
                      <span className="font-medium">{p.client_name}</span>
                      <span className="text-orange-600 ml-2">
                        {items?.slice(0, 2).map(i => `${i.product_name} ${formatNumber(i.quantity, 1)}${i.unit}`).join(', ')}
                      </span>
                    </div>
                    <span className="text-orange-600">{STATUS[p.status] ?? p.status}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Órdenes que necesitan atención */}
      {orders.filter(o => o.status === 'sent').length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Órdenes esperando recepción
            </p>
            <div className="space-y-1">
              {orders.filter(o => o.status === 'sent').map(o => {
                const item = o.inventory_items as unknown as { name: string; unit: string } | null
                return (
                  <p key={o.id} className="text-xs text-blue-700">
                    {item?.name ?? '—'} — {formatNumber(o.quantity_requested, 1)} {item?.unit}
                  </p>
                )
              })}
            </div>
            <Link href="/ordenes" className="text-xs text-blue-700 font-medium hover:underline mt-3 block">
              Registrar recepción →
            </Link>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
