import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatDate } from '@/lib/utils'
import { FlaskConical, TrendingUp, Clock } from 'lucide-react'
import { ReportesCharts } from '@/components/modules/reportes/reportes-charts'
import { AlertsPanel } from '@/components/modules/reportes/alerts-panel'
import { evaluateAlerts } from '@/lib/alerts/engine'

export default async function ReportesPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id

  const in30days  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
  const ago30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!

  const [batchesRes, , alertsRes, expiryRes, chartBatchesRes, allBatchesRes, rulesRes, inventoryItemsRes] = await Promise.all([
    // KPI: lotes completados últimos 30 días
    supabase
      .from('production_batches')
      .select('quantity_kg, input_quantity, yield_percentage')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .gte('end_date', ago30days),
    supabase
      .from('inventory_items')
      .select('current_stock, min_stock')
      .eq('organization_id', orgId),
    supabase
      .from('inventory_items')
      .select('id')
      .eq('organization_id', orgId)
      .filter('current_stock', 'lt', 'min_stock'),
    supabase
      .from('inventory_items')
      .select('name, expiry_date')
      .eq('organization_id', orgId)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', in30days)
      .order('expiry_date'),
    // Gráfico: producción por día (últimos 30 días)
    supabase
      .from('production_batches')
      .select('start_date, quantity_kg')
      .eq('organization_id', orgId)
      .gte('start_date', ago30days)
      .order('start_date'),
    // Gráfico: rendimiento por producto (todos los completados)
    supabase
      .from('production_batches')
      .select('product_name, yield_percentage')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .not('yield_percentage', 'is', null),
    // Reglas de alertas configuradas
    supabase
      .from('alert_rules')
      .select('*, inventory_items(name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
    // Ítems para el configurador
    supabase
      .from('inventory_items')
      .select('id, name')
      .eq('organization_id', orgId)
      .order('name'),
  ])

  const config      = ctx.organization.industry_config ?? {}
  const inputLabel  = config.input_label  ?? 'Insumo principal'
  const outputLabel = config.output_label ?? 'Producción (kg)'

  const batches = batchesRes.data ?? []
  const totalKgProduced  = batches.reduce((acc, b) => acc + (b.quantity_kg ?? 0), 0)
  const totalInputUsed   = batches.reduce((acc, b) => acc + (b.input_quantity ?? 0), 0)
  const avgYield = batches.length > 0
    ? batches.reduce((acc, b) => acc + (b.yield_percentage ?? 0), 0) / batches.length
    : 0
  const stockAlerts  = alertsRes.data?.length ?? 0
  const expiryAlerts = expiryRes.data ?? []

  const alertRules   = rulesRes?.data ?? []
  const inventoryItems = inventoryItemsRes?.data ?? []
  const activeAlerts = await evaluateAlerts(orgId)

  // Datos para gráficos
  const chartBatches = chartBatchesRes.data ?? []
  const productionByDay = (() => {
    const map: Record<string, number> = {}
    for (const b of chartBatches) {
      if (!b.start_date) continue
      const day = b.start_date.slice(0, 10)
      map[day] = (map[day] ?? 0) + (b.quantity_kg ?? 0)
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, kg]) => ({
        date: date.slice(5), // MM-DD
        kg: Math.round(kg * 10) / 10,
      }))
  })()

  const yieldByProduct = (() => {
    const map: Record<string, { total: number; count: number }> = {}
    for (const b of allBatchesRes.data ?? []) {
      if (!b.product_name || b.yield_percentage == null) continue
      if (!map[b.product_name]) map[b.product_name] = { total: 0, count: 0 }
      map[b.product_name]!.total += b.yield_percentage
      map[b.product_name]!.count += 1
    }
    return Object.entries(map)
      .map(([product, { total, count }]) => ({
        product: product.length > 12 ? product.slice(0, 12) + '…' : product,
        yield: Math.round((total / count) * 10) / 10,
        batches: count,
      }))
      .sort((a, b) => b.yield - a.yield)
      .slice(0, 8)
  })()

  const kpis = [
    {
      title: 'Producción últimos 30 días',
      value: `${formatNumber(totalKgProduced)} kg`,
      sub: `${batches.length} lotes completados`,
      icon: FlaskConical,
      color: 'text-blue-600',
    },
    {
      title: inputLabel,
      value: formatNumber(totalInputUsed),
      sub: 'Últimos 30 días',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Rendimiento promedio',
      value: `${formatNumber(avgYield, 1)}%`,
      sub: 'Salida / entrada × 100',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Lotes completados',
      value: String(batches.length),
      sub: 'Últimos 30 días',
      icon: FlaskConical,
      color: 'text-indigo-600',
    },
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen operativo de {ctx.organization.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
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

      {expiryAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <Clock className="h-4 w-4" />
              {expiryAlerts.length} ítem{expiryAlerts.length > 1 ? 's' : ''} por vencer en 30 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {expiryAlerts.map((item) => (
                <div key={item.name} className="flex justify-between text-sm text-orange-700">
                  <span className="font-medium">{item.name}</span>
                  <span>Vence: {formatDate(item.expiry_date!)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motor de alertas */}
      <Card>
        <CardContent className="pt-6">
          <AlertsPanel
            alerts={activeAlerts}
            rules={alertRules as never}
            items={inventoryItems as never}
          />
        </CardContent>
      </Card>

      {/* Gráficos — planes pagos */}
      <ReportesCharts
        plan={ctx.organization.plan}
        productionByDay={productionByDay}
        yieldByProduct={yieldByProduct}
        outputLabel={outputLabel}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos lotes completados</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentBatches orgId={orgId} />
        </CardContent>
      </Card>
    </div>
  )
}

async function RecentBatches({ orgId }: { orgId: string }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('production_batches')
    .select('batch_code, product_name, quantity_kg, status, start_date')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!data?.length) {
    return <p className="text-sm text-muted-foreground">Sin lotes registrados todavía.</p>
  }

  return (
    <div className="space-y-2">
      {data.map((b) => (
        <div key={b.batch_code} className="flex items-center justify-between text-sm">
          <div>
            <span className="font-medium">{b.batch_code}</span>
            <span className="text-muted-foreground ml-2">{b.product_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{formatNumber(b.quantity_kg, 1)} kg</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              b.status === 'completed' ? 'bg-green-100 text-green-700' :
              b.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {b.status === 'completed' ? 'Completado' :
               b.status === 'in_progress' ? 'En proceso' : 'Cancelado'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

