'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
import type { IndustryConfig, CustomField } from '@/types'

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

interface NuevoLoteButtonProps {
  config: IndustryConfig
}

export function NuevoLoteButton({ config }: NuevoLoteButtonProps) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [form, setForm]     = useState({
    batch_code:        '',
    product_name:      '',
    quantity_kg:       '',
    input_quantity:  '',
    start_date:        new Date().toISOString().split('T')[0],
    notes:             '',
  })
  const [customData, setCustomData]     = useState<Record<string, string>>({})

  const stages       = config.stages ?? []
  const [selectedStage, setSelectedStage] = useState(stages[0] ?? '')

  const inputLabel   = config.input_label  || 'Insumo principal'
  const outputLabel  = config.output_label || 'Producción (kg)'
  const productTypes = config.product_types ?? []
  const allFields    = config.custom_fields ?? []

  // Si hay etapas, mostramos solo los campos de la etapa seleccionada.
  // Si no hay etapas, mostramos todos.
  const visibleFields: CustomField[] = stages.length > 0
    ? allFields.filter(f => !f.stage || f.stage === selectedStage)
    : allFields

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleCustomChange(key: string, value: string) {
    setCustomData(prev => ({ ...prev, [key]: value }))
  }

  function resetForm() {
    setForm({ batch_code: '', product_name: '', quantity_kg: '', input_quantity: '', start_date: new Date().toISOString().split('T')[0], notes: '' })
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
    }

    const { error } = await supabase.from('production_batches').insert({
      organization_id:  profile.organization_id,
      batch_code:       form.batch_code,
      product_name:     form.product_name,
      product_type:     form.product_name,
      quantity_kg:      parseFloat(form.quantity_kg)      || 0,
      input_quantity: parseFloat(form.input_quantity) || 0,
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
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nuevo lote
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg my-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Nuevo lote de producción</h2>
          <button onClick={() => { setOpen(false); resetForm() }}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Campos core */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch_code">Código de lote</Label>
              <Input id="batch_code" name="batch_code" placeholder="LOT-001" value={form.batch_code} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha inicio</Label>
              <Input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_name">Producto</Label>
            {productTypes.length > 0 ? (
              <select
                id="product_name"
                name="product_name"
                value={form.product_name}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Seleccioná un producto...</option>
                {productTypes.map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            ) : (
              <Input id="product_name" name="product_name" placeholder="Ej: Gouda, Pan de molde..." value={form.product_name} onChange={handleChange} required />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="input_quantity">{inputLabel}</Label>
              <Input id="input_quantity" name="input_quantity" type="number" min="0" step="0.001" placeholder="0" value={form.input_quantity} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_kg">{outputLabel}</Label>
              <Input id="quantity_kg" name="quantity_kg" type="number" min="0" step="0.001" placeholder="0" value={form.quantity_kg} onChange={handleChange} required />
            </div>
          </div>

          {/* Selector de etapa */}
          {stages.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Etapa del proceso</p>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage, idx) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setSelectedStage(stage)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      selectedStage === stage
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      selectedStage === stage ? 'bg-white/20' : 'bg-muted'
                    }`}>{idx + 1}</span>
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campos dinámicos de la etapa seleccionada */}
          {visibleFields.length > 0 && (
            <div className={`space-y-3 ${stages.length > 0 ? '' : 'border-t pt-4'}`}>
              {stages.length === 0 && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Campos adicionales</p>
              )}
              {visibleFields.map((field: CustomField) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Seleccioná...</option>
                      {(field.options ?? []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
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
                        className={(() => {
                          const c = getCompliance(customData[field.key] ?? '', field)
                          return c === 'out' ? 'border-red-400 focus-visible:ring-red-400' : c === 'ok' ? 'border-green-400 focus-visible:ring-green-400' : ''
                        })()}
                      />
                      {(() => {
                        const c = getCompliance(customData[field.key] ?? '', field)
                        if (!c) return null
                        return (
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${c === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                            {c === 'ok' ? '✓ OK' : '✗ Fuera de norma'}
                          </span>
                        )
                      })()}
                    </div>
                  )}
                  {field.compliance_ref && customData[field.key] && (
                    <p className="text-[11px] text-muted-foreground">
                      Norma: {field.compliance_ref}
                      {field.min_value !== undefined && field.max_value !== undefined && ` — rango: ${field.min_value}–${field.max_value} ${field.unit ?? ''}`}
                      {field.min_value !== undefined && field.max_value === undefined && ` — mínimo: ${field.min_value} ${field.unit ?? ''}`}
                      {field.max_value !== undefined && field.min_value === undefined && ` — máximo: ${field.max_value} ${field.unit ?? ''}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {stages.length > 0 && visibleFields.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No hay campos específicos para esta etapa.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Observaciones del lote..." value={form.notes} onChange={handleChange} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
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
