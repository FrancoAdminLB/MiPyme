'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Save, GripVertical, Globe, Users } from 'lucide-react'
import type { IndustryConfig, CustomField, AreaResponsables } from '@/types'

const AREAS: { key: keyof AreaResponsables; label: string }[] = [
  { key: 'produccion', label: 'Producción' },
  { key: 'inventario', label: 'Inventario / Stock' },
  { key: 'calidad',    label: 'Calidad' },
  { key: 'pedidos',    label: 'Pedidos / Ventas' },
  { key: 'compras',    label: 'Compras' },
]

const LANGUAGES = [
  { value: 'es_AR', label: '🇦🇷 Español (Argentina)' },
  { value: 'en',    label: '🇺🇸 English' },
]

interface ConfigPanelProps {
  orgId: string
  orgName: string
  initialConfig: IndustryConfig
}

const FIELD_TYPES = [
  { value: 'number', label: 'Número' },
  { value: 'text',   label: 'Texto' },
  { value: 'date',   label: 'Fecha' },
  { value: 'select', label: 'Lista de opciones' },
]

export function ConfigPanel({ initialConfig }: ConfigPanelProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [config, setConfig] = useState<IndustryConfig>({
    currency: 'ARS',
    language: 'es_AR',
    input_label: 'Insumo principal',
    output_label: 'Producción (kg)',
    product_types: [],
    custom_fields: [],
    features: ['production', 'inventory', 'reports', 'ai_assistant'],
    ...initialConfig,
  })

  // ── Producción labels ─────────────────────────────────────────
  function setInputLabel(val: string) {
    setConfig((c) => ({ ...c, input_label: val }))
  }
  function setOutputLabel(val: string) {
    setConfig((c) => ({ ...c, output_label: val }))
  }

  // ── Tipos de producto ─────────────────────────────────────────
  function addProductType() {
    setConfig((c) => ({ ...c, product_types: [...(c.product_types ?? []), ''] }))
  }
  function updateProductType(i: number, val: string) {
    setConfig((c) => {
      const arr = [...(c.product_types ?? [])]
      arr[i] = val
      return { ...c, product_types: arr }
    })
  }
  function removeProductType(i: number) {
    setConfig((c) => ({ ...c, product_types: (c.product_types ?? []).filter((_, idx) => idx !== i) }))
  }

  // ── Custom fields ─────────────────────────────────────────────
  function addField() {
    const newField: CustomField = {
      key: `campo_${Date.now()}`,
      label: '',
      type: 'number',
      required: false,
    }
    setConfig((c) => ({ ...c, custom_fields: [...(c.custom_fields ?? []), newField] }))
  }

  function updateField(i: number, patch: Partial<CustomField>) {
    setConfig((c) => {
      const fields = [...(c.custom_fields ?? [])]
      fields[i] = { ...fields[i]!, ...patch }
      // Auto-generar key desde el label
      if (patch.label !== undefined) {
        fields[i]!.key = patch.label
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
      }
      return { ...c, custom_fields: fields }
    })
  }

  function removeField(i: number) {
    setConfig((c) => ({ ...c, custom_fields: (c.custom_fields ?? []).filter((_, idx) => idx !== i) }))
  }

  function updateFieldOptions(i: number, raw: string) {
    const options = raw.split(',').map((s) => s.trim()).filter(Boolean)
    updateField(i, { options })
  }

  // ── Guardar ───────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/organizations/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Producción ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas de producción</CardTitle>
          <p className="text-sm text-muted-foreground">
            Definí cómo se llaman el insumo principal y el producto de salida en tu empresa.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Insumo principal (entrada)</Label>
            <Input
              placeholder="Ej: Litros de leche, Kg de harina, Horas de servicio"
              value={config.input_label ?? ''}
              onChange={(e) => setInputLabel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Lo que consumís para producir</p>
          </div>
          <div className="space-y-2">
            <Label>Producción (salida)</Label>
            <Input
              placeholder="Ej: Kg producidos, Unidades, Servicios realizados"
              value={config.output_label ?? ''}
              onChange={(e) => setOutputLabel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Lo que generás al final del proceso</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Tipos de producto ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipos de producto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Los productos que elabora tu empresa. Aparecen como opciones en el formulario de producción.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(config.product_types ?? []).map((pt, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Ej: Gouda, Pan de molde, Consulta médica"
                value={pt}
                onChange={(e) => updateProductType(i, e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeProductType(i)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addProductType}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar producto
          </Button>
        </CardContent>
      </Card>

      {/* ── Campos custom ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campos adicionales por lote</CardTitle>
          <p className="text-sm text-muted-foreground">
            Datos extra que querés registrar en cada lote de producción. Ej: temperatura, turno, operario, lote de materia prima.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(config.custom_fields ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sin campos adicionales todavía.</p>
          )}

          {(config.custom_fields ?? []).map((field, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-xs font-mono">{field.key || '—'}</span>
                </div>
                <button
                  onClick={() => removeField(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre del campo</Label>
                  <Input
                    placeholder="Ej: Temperatura de corte"
                    value={field.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(i, { type: e.target.value as CustomField['type'] })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unidad (opcional)</Label>
                  <Input
                    placeholder="Ej: °C, kg, horas"
                    value={field.unit ?? ''}
                    onChange={(e) => updateField(i, { unit: e.target.value })}
                  />
                </div>
              </div>

              {field.type === 'select' && (
                <div className="space-y-1">
                  <Label className="text-xs">Opciones (separadas por coma)</Label>
                  <Input
                    placeholder="Ej: Mañana, Tarde, Noche"
                    value={(field.options ?? []).join(', ')}
                    onChange={(e) => updateFieldOptions(i, e.target.value)}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required ?? false}
                  onChange={(e) => updateField(i, { required: e.target.checked })}
                  className="rounded"
                />
                Campo obligatorio
              </label>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar campo
          </Button>
        </CardContent>
      </Card>

      {/* ── Responsables por área ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Responsables por área
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            El encargado de cada área se pre-completa automáticamente en los formularios. Podés cambiarlo por lote/movimiento.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AREAS.map(area => (
            <div key={area.key} className="space-y-1.5">
              <Label className="text-xs">{area.label}</Label>
              <Input
                placeholder="Nombre y apellido"
                value={config.area_responsables?.[area.key] ?? ''}
                onChange={e => setConfig(c => ({
                  ...c,
                  area_responsables: { ...(c.area_responsables ?? {}), [area.key]: e.target.value },
                }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Idioma ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Idioma de la interfaz
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            El idioma que ven todos los usuarios de tu organización.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                type="button"
                onClick={() => setConfig(c => ({ ...c, language: lang.value as 'es_AR' | 'en' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  (config.language ?? 'es_AR') === lang.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang.label}
                {lang.value === 'en' && (
                  <span className="text-xs text-muted-foreground ml-1">(próximamente)</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Guardar ── */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  )
}
