import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AlertResult {
  ruleId: string
  ruleName: string
  module: string
  metric: string
  message: string
  severity: 'warning' | 'critical'
  value: number
  threshold: number
}

const OPERATOR_FN: Record<string, (a: number, b: number) => boolean> = {
  lt:  (a, b) => a < b,
  lte: (a, b) => a <= b,
  gt:  (a, b) => a > b,
  gte: (a, b) => a >= b,
}

const METRIC_LABELS: Record<string, string> = {
  yield_percentage:  'Rendimiento',
  days_in_progress:  'Días en proceso',
  stock_below_min:   'Stock bajo mínimo',
  stock_absolute:    'Stock actual',
}

const OPERATOR_LABELS: Record<string, string> = {
  lt:  'menor a',
  lte: 'menor o igual a',
  gt:  'mayor a',
  gte: 'mayor o igual a',
}

export async function evaluateAlerts(orgId: string): Promise<AlertResult[]> {
  const { data: rules } = await supabaseAdmin
    .from('alert_rules')
    .select('*, inventory_items(name, unit)')
    .eq('organization_id', orgId)
    .eq('active', true)

  if (!rules?.length) return []

  const results: AlertResult[] = []

  for (const rule of rules) {
    const check = OPERATOR_FN[rule.operator]
    if (!check) continue

    if (rule.module === 'produccion') {
      if (rule.metric === 'yield_percentage') {
        // Lotes completados en los últimos 30 días con rendimiento fuera de rango
        const { data: batches } = await supabaseAdmin
          .from('production_batches')
          .select('batch_code, product_name, yield_percentage')
          .eq('organization_id', orgId)
          .eq('status', 'completed')
          .gte('end_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .not('yield_percentage', 'is', null)

        for (const b of batches ?? []) {
          if (check(b.yield_percentage, rule.threshold)) {
            results.push({
              ruleId: rule.id,
              ruleName: rule.name,
              module: 'produccion',
              metric: rule.metric,
              message: `Lote ${b.batch_code} (${b.product_name}): rendimiento ${b.yield_percentage}% — ${OPERATOR_LABELS[rule.operator]} ${rule.threshold}%`,
              severity: b.yield_percentage < rule.threshold * 0.8 ? 'critical' : 'warning',
              value: b.yield_percentage,
              threshold: rule.threshold,
            })
          }
        }
      }

      if (rule.metric === 'days_in_progress') {
        const { data: batches } = await supabaseAdmin
          .from('production_batches')
          .select('batch_code, product_name, start_date')
          .eq('organization_id', orgId)
          .eq('status', 'in_progress')

        for (const b of batches ?? []) {
          const days = Math.floor((Date.now() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24))
          if (check(days, rule.threshold)) {
            results.push({
              ruleId: rule.id,
              ruleName: rule.name,
              module: 'produccion',
              metric: rule.metric,
              message: `Lote ${b.batch_code} (${b.product_name}) lleva ${days} días en proceso`,
              severity: days > rule.threshold * 1.5 ? 'critical' : 'warning',
              value: days,
              threshold: rule.threshold,
            })
          }
        }
      }
    }

    if (rule.module === 'inventario') {
      const itemQuery = supabaseAdmin
        .from('inventory_items')
        .select('id, name, unit, current_stock, min_stock')
        .eq('organization_id', orgId)

      const { data: items } = rule.item_id
        ? await itemQuery.eq('id', rule.item_id)
        : await itemQuery

      for (const item of items ?? []) {
        if (rule.metric === 'stock_below_min') {
          const ratio = item.min_stock > 0 ? (item.current_stock / item.min_stock) * 100 : 100
          if (check(ratio, rule.threshold)) {
            results.push({
              ruleId: rule.id,
              ruleName: rule.name,
              module: 'inventario',
              metric: rule.metric,
              message: `${item.name}: stock al ${ratio.toFixed(0)}% del mínimo (${item.current_stock} / ${item.min_stock} ${item.unit})`,
              severity: ratio < rule.threshold * 0.5 ? 'critical' : 'warning',
              value: ratio,
              threshold: rule.threshold,
            })
          }
        }

        if (rule.metric === 'stock_absolute') {
          if (check(item.current_stock, rule.threshold)) {
            results.push({
              ruleId: rule.id,
              ruleName: rule.name,
              module: 'inventario',
              metric: rule.metric,
              message: `${item.name}: stock actual ${item.current_stock} ${item.unit} — ${OPERATOR_LABELS[rule.operator]} ${rule.threshold} ${item.unit}`,
              severity: item.current_stock < rule.threshold * 0.5 ? 'critical' : 'warning',
              value: item.current_stock,
              threshold: rule.threshold,
            })
          }
        }
      }
    }
  }

  // Deduplicar por ruleId + message
  const seen = new Set<string>()
  return results.filter(r => {
    const key = `${r.ruleId}:${r.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export { METRIC_LABELS, OPERATOR_LABELS }
