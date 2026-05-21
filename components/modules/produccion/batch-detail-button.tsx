'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react'
import type { IndustryConfig, CustomField } from '@/types'

function checkCompliance(value: unknown, field: CustomField): 'ok' | 'out' | null {
  if (value === undefined || value === null || value === '') return null
  if (field.type !== 'number') return null
  const num = parseFloat(String(value))
  if (isNaN(num)) return null
  const hasMin = field.min_value !== undefined
  const hasMax = field.max_value !== undefined
  if (!hasMin && !hasMax) return null
  if ((hasMin && num < field.min_value!) || (hasMax && num > field.max_value!)) return 'out'
  return 'ok'
}

interface Batch {
  id: string
  batch_code: string
  product_name: string
  status: string
  custom_data: Record<string, unknown> | null
}

interface BatchDetailButtonProps {
  batch: Batch
  config: IndustryConfig
}

export function BatchDetailButton({ batch, config }: BatchDetailButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'view' | 'advance'>('view')
  const [stageForm, setStageForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const stages = config.stages ?? []
  const allFields = config.custom_fields ?? []
  const customData = batch.custom_data ?? {}
  const currentStage = (customData.etapa as string) ?? stages[0] ?? ''
  const currentIdx = stages.indexOf(currentStage)
  const nextStage = currentIdx >= 0 && currentIdx < stages.length - 1
    ? stages[currentIdx + 1]!
    : null

  // Campos del detalle: agrupados por etapa
  const fieldsByStage: Record<string, { field: CustomField; value: unknown }[]> = {}
  for (const stage of stages) {
    const stageFields = allFields.filter(f => f.stage === stage)
    const withValues = stageFields
      .map(f => ({ field: f, value: customData[f.key] }))
      .filter(({ value }) => value !== undefined && value !== '' && value !== null)
    if (withValues.length > 0) fieldsByStage[stage] = withValues
  }

  // Campos del formulario de la próxima etapa
  const nextStageFields = nextStage
    ? allFields.filter(f => f.stage === nextStage)
    : []

  function openAdvance() {
    setStageForm({})
    setMode('advance')
  }

  function handleFormChange(key: string, value: string) {
    setStageForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleAdvanceSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nextStage) return
    setLoading(true)

    const newCustomData = {
      ...customData,
      ...stageForm,
      etapa: nextStage,
    }

    const supabase = createClient()
    await supabase
      .from('production_batches')
      .update({ custom_data: newCustomData })
      .eq('id', batch.id)

    router.refresh()
    setLoading(false)
    setOpen(false)
    setMode('view')
  }

  // Avance directo si no hay campos en la próxima etapa
  async function advanceDirect() {
    if (!nextStage) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('production_batches')
      .update({ custom_data: { ...customData, etapa: nextStage } })
      .eq('id', batch.id)
    router.refresh()
    setLoading(false)
    setOpen(false)
  }

  function handleClose() {
    setOpen(false)
    setMode('view')
    setStageForm({})
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-primary hover:underline"
      >
        Ver detalle
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-lg my-auto">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">{batch.batch_code}</h2>
                <p className="text-sm text-muted-foreground">
                  {mode === 'advance' ? `Registrar datos — ${nextStage}` : batch.product_name}
                </p>
              </div>
              <button onClick={handleClose}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* ─── MODO VER DETALLE ─── */}
            {mode === 'view' && (
              <div className="p-6 space-y-5">

                {/* Progreso de etapas */}
                {stages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Etapa actual</p>
                    <div className="flex flex-wrap gap-2">
                      {stages.map((stage, idx) => {
                        const isPast = idx < currentIdx
                        const isCurrent = stage === currentStage
                        return (
                          <span
                            key={stage}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground border-primary'
                                : isPast
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-muted text-muted-foreground border-transparent'
                            }`}
                          >
                            <span>{idx + 1}.</span> {stage}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Datos registrados por etapa */}
                {Object.keys(fieldsByStage).length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Datos registrados</p>
                    {stages.filter(s => fieldsByStage[s]).map(stage => (
                      <div key={stage}>
                        <p className="text-xs font-semibold text-foreground mb-1.5">{stage}</p>
                        <div className="bg-muted/30 rounded-md divide-y">
                          {fieldsByStage[stage]!.map(({ field, value }) => {
                            const c = checkCompliance(value, field)
                            return (
                              <div key={field.key} className="flex justify-between items-center px-3 py-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">{field.label}</span>
                                  {field.compliance_ref && (
                                    <span className="text-[10px] text-muted-foreground ml-1.5">({field.compliance_ref})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {String(value)}{field.unit ? ` ${field.unit}` : ''}
                                  </span>
                                  {c === 'ok' && <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                                  {c === 'out' && <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-2">
                    No hay datos de proceso registrados todavía.
                  </p>
                )}

                {/* Botón avanzar etapa */}
                {nextStage && batch.status === 'in_progress' && (
                  <div className="border-t pt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Siguiente: <span className="font-medium text-foreground">{nextStage}</span>
                    </p>
                    <Button
                      size="sm"
                      onClick={nextStageFields.length > 0 ? openAdvance : advanceDirect}
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : (
                        <>
                          {nextStageFields.length > 0 ? 'Registrar y avanzar' : 'Avanzar'}
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!nextStage && stages.length > 0 && batch.status === 'in_progress' && (
                  <p className="text-sm text-green-600 font-medium text-center border-t pt-4">
                    Lote en la última etapa del proceso.
                  </p>
                )}
              </div>
            )}

            {/* ─── MODO REGISTRAR DATOS DE ETAPA ─── */}
            {mode === 'advance' && nextStage && (
              <form onSubmit={handleAdvanceSubmit} className="p-6 space-y-4">
                <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
                  Registrá los parámetros de <span className="font-semibold">{nextStage}</span> antes de avanzar.
                  Los campos sin completar se pueden agregar después.
                </div>

                {nextStageFields.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No hay campos configurados para esta etapa.</p>
                )}

                {nextStageFields.map(field => {
                  const c = checkCompliance(stageForm[field.key] ?? '', field)
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={`adv-${field.key}`}>
                        {field.label}
                        {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>

                      {field.type === 'select' ? (
                        <select
                          id={`adv-${field.key}`}
                          value={stageForm[field.key] ?? ''}
                          onChange={e => handleFormChange(field.key, e.target.value)}
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
                            id={`adv-${field.key}`}
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={stageForm[field.key] ?? ''}
                            onChange={e => handleFormChange(field.key, e.target.value)}
                            required={field.required}
                            step={field.type === 'number' ? '0.01' : undefined}
                            placeholder={field.min_value !== undefined && field.max_value !== undefined
                              ? `${field.min_value} – ${field.max_value} ${field.unit ?? ''}`
                              : undefined
                            }
                            className={
                              c === 'out' ? 'border-red-400 focus-visible:ring-red-400 pr-32' :
                              c === 'ok'  ? 'border-green-400 focus-visible:ring-green-400 pr-20' : ''
                            }
                          />
                          {c && (
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium flex items-center gap-1 ${
                              c === 'ok' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {c === 'ok'
                                ? <><ShieldCheck className="h-3 w-3" /> OK</>
                                : <><ShieldAlert className="h-3 w-3" /> Fuera de norma</>
                              }
                            </span>
                          )}
                        </div>
                      )}

                      {field.compliance_ref && (
                        <p className="text-[11px] text-muted-foreground">
                          Norma: {field.compliance_ref}
                          {field.min_value !== undefined && field.max_value !== undefined && ` — rango: ${field.min_value}–${field.max_value} ${field.unit ?? ''}`}
                          {field.min_value !== undefined && field.max_value === undefined && ` — mínimo: ${field.min_value} ${field.unit ?? ''}`}
                          {field.max_value !== undefined && field.min_value === undefined && ` — máximo: ${field.max_value} ${field.unit ?? ''}`}
                        </p>
                      )}
                    </div>
                  )
                })}

                <div className="flex justify-end gap-3 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setMode('view')}>
                    Volver
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : `Guardar y pasar a ${nextStage}`}
                  </Button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  )
}
