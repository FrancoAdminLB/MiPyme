'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react'
import type { IndustryConfig, CustomField } from '@/types'

interface ProductTemplatesWizardProps {
  config: IndustryConfig
}

export function ProductTemplatesWizard({ config }: ProductTemplatesWizardProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const productTypes = config.product_types ?? []
  const allFields = config.custom_fields ?? []

  // templates[productName][fieldKey] = valor por defecto
  const [templates, setTemplates] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {}
    productTypes.forEach(p => { initial[p] = { ...(config.product_templates?.[p] ?? {}) } })
    return initial
  })

  function handleFieldChange(product: string, key: string, value: string) {
    setTemplates(prev => ({
      ...prev,
      [product]: { ...prev[product], [key]: value },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const newConfig: IndustryConfig = { ...config, product_templates: templates }
    await fetch('/api/organizations/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    })
    setSaving(false)
    setDone(true)
    router.refresh()
    setTimeout(() => { setOpen(false); setDone(false) }, 1200)
  }

  const currentProduct = productTypes[step]
  const isLast = step === productTypes.length - 1

  if (!open) {
    return (
      <button
        onClick={() => { setStep(0); setOpen(true) }}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <Sparkles className="h-4 w-4" />
        Configurar plantillas de producción
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Plantillas de producción</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Definí los valores típicos por producto. El operario los verá pre-cargados al crear un lote.
            </p>
          </div>
          <button onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">
              Producto {step + 1} de {productTypes.length}
            </span>
            <span className="text-xs font-medium text-foreground">— {currentProduct}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${((step + 1) / productTypes.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Fields */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {allFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay campos configurados para esta industria.</p>
          ) : (
            <div className="space-y-6">
              {/* Agrupar por etapa */}
              {(config.stages ?? []).map(stage => {
                const stageFields = allFields.filter(f => f.stage === stage)
                if (!stageFields.length) return null
                return (
                  <div key={stage}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      {stage}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {stageFields.map((field: CustomField) => (
                        <div key={field.key} className="space-y-1">
                          <Label htmlFor={`${currentProduct}-${field.key}`} className="text-xs">
                            {field.label}
                            {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                          </Label>
                          {field.type === 'select' ? (
                            <select
                              id={`${currentProduct}-${field.key}`}
                              value={templates[currentProduct]?.[field.key] ?? ''}
                              onChange={e => handleFieldChange(currentProduct, field.key, e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="">— sin valor por defecto —</option>
                              {(field.options ?? []).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id={`${currentProduct}-${field.key}`}
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              placeholder="Valor típico (opcional)"
                              value={templates[currentProduct]?.[field.key] ?? ''}
                              onChange={e => handleFieldChange(currentProduct, field.key, e.target.value)}
                              step={field.type === 'number' ? '0.01' : undefined}
                              className="h-9 text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Campos sin etapa */}
              {(() => {
                const noStageFields = allFields.filter(f => !f.stage)
                if (!noStageFields.length) return null
                return (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Otros campos
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {noStageFields.map((field: CustomField) => (
                        <div key={field.key} className="space-y-1">
                          <Label htmlFor={`${currentProduct}-${field.key}`} className="text-xs">
                            {field.label}
                            {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                          </Label>
                          {field.type === 'select' ? (
                            <select
                              id={`${currentProduct}-${field.key}`}
                              value={templates[currentProduct]?.[field.key] ?? ''}
                              onChange={e => handleFieldChange(currentProduct, field.key, e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="">— sin valor por defecto —</option>
                              {(field.options ?? []).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id={`${currentProduct}-${field.key}`}
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              placeholder="Valor típico (opcional)"
                              value={templates[currentProduct]?.[field.key] ?? ''}
                              onChange={e => handleFieldChange(currentProduct, field.key, e.target.value)}
                              step={field.type === 'number' ? '0.01' : undefined}
                              className="h-9 text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>

          <span className="text-xs text-muted-foreground">
            Podés dejar campos vacíos — el operario los completa al crear el lote
          </span>

          {isLast ? (
            <Button onClick={handleSave} disabled={saving || done}>
              {done ? (
                <><Check className="h-4 w-4 mr-1" /> Guardado</>
              ) : saving ? 'Guardando...' : (
                <><Check className="h-4 w-4 mr-1" /> Guardar plantillas</>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={() => setStep(s => s + 1)}>
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
