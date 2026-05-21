'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, ShieldAlert, X, Plus, Trash2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AlertResult } from '@/lib/alerts/engine'

interface AlertRule {
  id: string
  name: string
  module: string
  metric: string
  operator: string
  threshold: number
  active: boolean
  inventory_items?: { name: string } | null
}

interface InventoryItem {
  id: string
  name: string
}

interface AlertsPanelProps {
  alerts: AlertResult[]
  rules: AlertRule[]
  items: InventoryItem[]
}

const METRICS = [
  { value: 'yield_percentage',  label: 'Rendimiento de lote (%)',        module: 'produccion' },
  { value: 'days_in_progress',  label: 'Días en proceso (lote)',          module: 'produccion' },
  { value: 'stock_below_min',   label: 'Stock % del mínimo (inventario)', module: 'inventario' },
  { value: 'stock_absolute',    label: 'Stock absoluto (inventario)',      module: 'inventario' },
]

const OPERATORS = [
  { value: 'lt',  label: 'menor a' },
  { value: 'lte', label: 'menor o igual a' },
  { value: 'gt',  label: 'mayor a' },
  { value: 'gte', label: 'mayor o igual a' },
]

export function AlertsPanel({ alerts, rules, items }: AlertsPanelProps) {
  const router = useRouter()
  const [showConfig, setShowConfig] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', metric: 'yield_percentage', operator: 'lt', threshold: '', item_id: '',
  })

  const criticals = alerts.filter(a => a.severity === 'critical')
  const warnings  = alerts.filter(a => a.severity === 'warning')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const selectedMetric = METRICS.find(m => m.value === form.metric)
  const isInventoryMetric = selectedMetric?.module === 'inventario'

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const threshold = parseFloat(form.threshold)
    if (isNaN(threshold)) { setError('Ingresá un umbral numérico.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) { setLoading(false); return }

    const { error } = await supabase.from('alert_rules').insert({
      organization_id: profile.organization_id,
      name: form.name,
      module: selectedMetric?.module ?? 'produccion',
      metric: form.metric,
      operator: form.operator,
      threshold,
      item_id: (isInventoryMetric && form.item_id) ? form.item_id : null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setForm({ name: '', metric: 'yield_percentage', operator: 'lt', threshold: '', item_id: '' })
    router.refresh()
    setLoading(false)
  }

  async function deleteRule(id: string) {
    const supabase = createClient()
    await supabase.from('alert_rules').delete().eq('id', id)
    router.refresh()
  }

  async function toggleRule(id: string, active: boolean) {
    const supabase = createClient()
    await supabase.from('alert_rules').update({ active: !active }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Alertas operativas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {alerts.length === 0 ? 'Sin alertas activas' : `${criticals.length} críticas · ${warnings.length} advertencias`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowConfig(v => !v)}>
          <Settings2 className="h-3.5 w-3.5 mr-1.5" />
          {showConfig ? 'Cerrar' : 'Configurar reglas'}
        </Button>
      </div>

      {/* Alertas activas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {criticals.map((a, i) => (
            <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">{a.ruleName}</p>
                <p className="text-xs text-red-600 mt-0.5">{a.message}</p>
              </div>
            </div>
          ))}
          {warnings.map((a, i) => (
            <div key={i} className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-700">{a.ruleName}</p>
                <p className="text-xs text-yellow-600 mt-0.5">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && rules.length > 0 && (
        <div className="text-center py-4 text-sm text-green-600 font-medium">
          ✓ Todo dentro de los parámetros configurados
        </div>
      )}

      {/* Panel de configuración */}
      {showConfig && (
        <div className="border rounded-lg p-5 space-y-5 bg-muted/20">

          {/* Reglas existentes */}
          {rules.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reglas configuradas</p>
              <div className="space-y-1.5">
                {rules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between bg-card border rounded-md px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRule(rule.id, rule.active)}
                        className={`w-2 h-2 rounded-full shrink-0 transition-colors ${rule.active ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={rule.active ? 'Activa — click para pausar' : 'Pausada — click para activar'}
                      />
                      <span className="font-medium">{rule.name}</span>
                      {rule.inventory_items && (
                        <span className="text-xs text-muted-foreground">({rule.inventory_items.name})</span>
                      )}
                    </div>
                    <button onClick={() => deleteRule(rule.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario nueva regla */}
          <form onSubmit={handleAddRule} className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nueva regla</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre de la alerta</Label>
                <Input name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Rendimiento bajo" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Métrica</Label>
                <select name="metric" value={form.metric} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Condición</Label>
                <select name="operator" value={form.operator} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Umbral</Label>
                <Input name="threshold" type="number" step="0.01" value={form.threshold} onChange={handleChange} required placeholder="Ej: 8" />
              </div>
              {isInventoryMetric && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Ítem de inventario (opcional — vacío = todos)</Label>
                  <select name="item_id" value={form.item_id} onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Todos los ítems</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="sm" disabled={loading}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {loading ? 'Guardando...' : 'Agregar regla'}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
