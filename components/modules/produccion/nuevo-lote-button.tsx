'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
import type { IndustryConfig, CustomField, ProductionBatch } from '@/types'

function getCompliance(value: string, field: CustomField): 'ok' | 'out' | null {
  if (!value || field.type !== 'number') return null
  const num = parseFloat(value)
  if (isNaN(num)) return null
  const hasMin = field.min_value !== undefined
  const hasMax = field.max_value !== undefined
  if (!hasMin && !hasMax) return null
  if ((hasMin && num < field.min_value!) || (hasMax && num > field.max_value!)) return 'out'
  return 'ok'
}

function generateBatchCode() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `LOT-${date}-${hh}${mm}`
}

interface NuevoLoteButtonProps {
  config: IndustryConfig
  batches?: ProductionBatch[]
  pendingOrders?: Map<string, number>
}

export function NuevoLoteButton({ config, batches = [], pendingOrders }: NuevoLoteButtonProps) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [form, setForm]       = useState({
    batch_code:     '',
    product_name:   '',
    quantity_kg:    '',
    input_quantity: '',
    start_date:     new Date().toISOString().split('T')[0],
    notes:          '',
    responsable:    '',
  })
  const [customData, setCustomData] = useState<Record<string, string>>({})
  const defaultResponsable = config.area_responsables?.produccion ?? ''

  const stages       = config.stages ?? []
  const [selectedStage, setSelectedStage] = useState(stages[0] ?? '')
  const inputLabel   = config.input_label  || 'Insumo principal'
  const outputLabel  = config.output_label || 'Producción (kg)'
  const productTypes = config.product_types ?? []
  const allFields    = config.custom_fields ?? []

  const visibleFields: CustomField[] = stages.length > 0
    ? allFields.filter(f => !f.hidden && (!f.stage || f.stage === selectedStage))
    : allFields.filter(f => !f.hidden)

  // Rendimiento en tiempo real
  const liveYield = useMemo(() => {
    const input  = parseFloat(form.input_quantity)
    const output = parseFloat(form.quantity_kg)
    if (!input || !output || input === 0) return null
    return ((output / input) * 100).toFixed(1)
  }, [form.input_quantity, form.quantity_kg])

  // Último lote del mismo producto como referencia
  const lastBatch = useMemo(() => {
    if (!form.product_name) return null
    return [...batches]
      .filter(b => b.product_name === form.product_name)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
  }, [batches, form.product_name])

  // Valores históricos únicos por campo (de todos los lotes del mismo producto)
  const historicalFieldValues = useMemo(() => {
    if (!form.product_name) return {} as Record<string, string[]>
    const result: Record<string, string[]> = {}
    const productBatches = batches.filter(b => b.product_name === form.product_name)
    for (const batch of productBatches) {
      const data = (batch.custom_data ?? {}) as Record<string, string>
      for (const [key, val] of Object.entries(data)) {
        if (!val || val === '' || key === 'etapa' || key === 'responsable') continue
        if (!result[key]) result[key] = []
        if (!result[key]!.includes(String(val))) result[key]!.push(String(val))
      }
    }
    return result
  }, [batches, form.product_name])

  function handleOpen() {
    setForm(prev => ({
      ...prev,
      batch_code: generateBatchCode(),
      responsable: defaultResponsable,
    }))
    setOpen(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'product_name' && value) {
      const template = config.product_templates?.[value]
      if (template) setCustomData({ ...template })
      else setCustomData({})
    }
  }

  function handleCustomChange(key: string, value: string) {
    setCustomData(prev => ({ ...prev, [key]: value }))
  }

  function resetForm() {
    setForm({ batch_code: '', product_name: '', quantity_kg: '', input_quantity: '', start_date: new Date().toISOString().split('T')[0], notes: '', responsable: '' })
    setCustomData({})
    setSelectedStage(stages[0] ?? '')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) { setLoading(false); return }

    const finalCustomData = {
      ...customData,
      ...(selectedStage ? { etapa: selectedStage } : {}),
      ...(form.responsable ? { responsable: form.responsable } : {}),
    }

    const qtyKg    = parseFloat(form.quantity_kg)    || 0
    const qtyInput = parseFloat(form.input_quantity) || 0
    const yieldPct = qtyInput > 0 ? (qtyKg / qtyInput) * 100 : 0

    const { error } = await supabase.from('production_batches').insert({
      organization_id:  profile.organization_id,
      batch_code:       form.batch_code,
      product_name:     form.product_name,
      product_type:     form.product_name,
      quantity_kg:      qtyKg,
      input_quantity:   qtyInput,
      yield_percentage: yieldPct,
      start_date:       form.start_date,
      notes:            form.notes || null,
      status:           'in_progress',
      custom_data:      finalCustomData,
      created_by:       user.id,
    })

    if (error) {
      setError('No se pudo guardar. Verificá que el código de lote no esté duplicado.')
      setLoading(false)
      return
    }

    setSaved(true)
    router.refresh()
    setTimeout(() => { setOpen(false); resetForm(); setSaved(false) }, 900)
    setLoading(false)
  }

  if (!open) {
    return (
      <Button onClick={handleOpen}>
        <Plus className="h-4 w-4 mr-2" />
        Nuevo lote
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Nuevo lote de producción</h2>
          <button onClick={() => { setOpen(false); resetForm() }}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* Código + Fecha */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch_code">Código de lote</Label>
                <Input id="batch_code" name="batch_code" value={form.batch_code} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha inicio</Label>
                <Input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
              </div>
            </div>

            {/* Responsable */}
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                name="responsable"
                placeholder="Encargado del lote"
                value={form.responsable}
                onChange={handleChange}
              />
            </div>

            {/* Producto + cantidades */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="product_name">Producto</Label>
                {productTypes.length > 0 ? (
                  <select
                    id="product_name" name="product_name"
                    value={form.product_name} onChange={handleChange} required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Seleccioná un producto...</option>
                    {productTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                ) : (
                  <Input id="product_name" name="product_name" placeholder="Ej: Gouda, Pan de molde..." value={form.product_name} onChange={handleChange} required />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="input_quantity">{inputLabel}</Label>
                <Input id="input_quantity" name="input_quantity" type="number" min="0" step="0.001" placeholder="0" value={form.input_quantity} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_kg" className="flex items-center gap-2">
                  {outputLabel}
                  {liveYield && (
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Rendimiento: {liveYield}%
                    </span>
                  )}
                </Label>
                <Input id="quantity_kg" name="quantity_kg" type="number" min="0" step="0.001" placeholder="0" value={form.quantity_kg} onChange={handleChange} required />
              </div>
            </div>

            {/* Hint: pedidos pendientes para este producto */}
            {form.product_name && pendingOrders?.get(form.product_name) ? (
              <p className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded px-3 py-2">
                Hay <span className="font-semibold">{pendingOrders.get(form.product_name)?.toFixed?.(1) ?? pendingOrders.get(form.product_name)}</span> unidades de <span className="font-semibold">{form.product_name}</span> en pedidos pendientes de entrega.
              </p>
            ) : null}

            {/* Referencia al lote anterior */}
            {lastBatch && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                Lote anterior de <span className="font-medium">{form.product_name}</span>: {lastBatch.input_quantity} → {lastBatch.quantity_kg} kg ({lastBatch.yield_percentage?.toFixed(1)}% rend.) — {new Date(lastBatch.start_date).toLocaleDateString('es-AR')}
              </p>
            )}

            {/* Selector de etapa */}
            {stages.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Etapa del proceso</p>
                <div className="flex flex-wrap gap-2">
                  {stages.map((stage, idx) => (
                    <button
                      key={stage} type="button" onClick={() => setSelectedStage(stage)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        selectedStage === stage
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background hover:bg-accent'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${selectedStage === stage ? 'bg-white/20' : 'bg-muted'}`}>
                        {idx + 1}
                      </span>
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campos dinámicos — grilla 2 columnas */}
            {visibleFields.length > 0 && (
              <div className={stages.length > 0 ? '' : 'border-t pt-4'}>
                {stages.length === 0 && (
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Campos adicionales</p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {visibleFields.map((field: CustomField) => (
                    <div key={field.key} className="space-y-1">
                      <Label htmlFor={field.key} className="text-xs">
                        {field.label}
                        {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>

                      {field.type === 'select' ? (
                        <select
                          id={field.key}
                          value={customData[field.key] ?? ''}
                          onChange={e => handleCustomChange(field.key, e.target.value)}
                          required={field.required}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">—</option>
                          {(field.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <div className="relative">
                          <Input
                            id={field.key}
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={customData[field.key] ?? ''}
                            onChange={e => handleCustomChange(field.key, e.target.value)}
                            required={field.required}
                            step={field.type === 'number' ? '0.01' : undefined}
                            className={`h-9 text-sm ${(() => {
                              const c = getCompliance(customData[field.key] ?? '', field)
                              return c === 'out' ? 'border-red-400 focus-visible:ring-red-400' : c === 'ok' ? 'border-green-400 focus-visible:ring-green-400' : ''
                            })()}`}
                          />
                          {(() => {
                            const c = getCompliance(customData[field.key] ?? '', field)
                            if (!c) return null
                            return (
                              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium ${c === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                                {c === 'ok' ? '✓' : '✗'}
                              </span>
                            )
                          })()}
                        </div>
                      )}

                      {/* Chips de valores históricos */}
                      {(historicalFieldValues[field.key]?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {historicalFieldValues[field.key]!.slice(0, 4).map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleCustomChange(field.key, val)}
                              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                customData[field.key] === val
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-muted/60 border-input text-muted-foreground hover:border-primary hover:text-primary'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      )}

                      {field.compliance_ref && customData[field.key] && (
                        <p className="text-[10px] text-muted-foreground leading-tight">{field.compliance_ref}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stages.length > 0 && visibleFields.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No hay campos específicos para esta etapa.</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input id="notes" name="notes" placeholder="Observaciones del lote..." value={form.notes} onChange={handleChange} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm() }}>Cancelar</Button>
            <Button type="submit" disabled={loading || saved}>
              {saved ? '¡Lote guardado!' : loading ? 'Guardando...' : 'Guardar lote'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
