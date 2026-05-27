'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { INDUSTRIES, INDUSTRY_GROUPS } from '@/lib/industries'
import type { Organization, Profile, Industry, CompanySize } from '@/types'
import { CheckCircle, ChevronRight, Plus, Trash2 } from 'lucide-react'

interface SupplierInput {
  name: string
  cuit: string
  category: string
  contact_name: string
  notes: string
}

interface InventoryItem {
  name: string
  unit: string
  current_stock: string
  min_stock: string
  category: string
  supplier_name: string
}

const STEPS = ['Producción', 'Proveedores', 'Inventario', 'Listo']

const SUPPLIER_CATEGORIES = [
  { value: 'materia_prima', label: 'Materia prima' },
  { value: 'insumo',        label: 'Insumos' },
  { value: 'empaque',       label: 'Empaque / packaging' },
  { value: 'servicios',     label: 'Servicios' },
  { value: 'otros',         label: 'Otros' },
]

export function OnboardingWizard({
  organization,
  profile,
}: {
  organization: Organization
  profile: Profile
}) {
  const router = useRouter()
  const industryMeta = INDUSTRIES[organization.industry as Industry]
  const defaultConfig = organization.industry_config ?? industryMeta?.defaultConfig

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tamaño de empresa (SEPYME)
  const [companySize, setCompanySize] = useState<CompanySize>(organization.company_size ?? 'small')

  // Industria seleccionada (puede cambiar en el wizard)
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(organization.industry as Industry)

  function handleIndustryChange(value: Industry) {
    setSelectedIndustry(value)
    const meta = INDUSTRIES[value]
    if (meta) {
      setInputLabel(meta.defaultConfig.input_label)
      setOutputLabel(meta.defaultConfig.output_label)
      setProductTypes(meta.defaultConfig.product_types.length ? meta.defaultConfig.product_types : [''])
      setItems([])
    }
  }

  // ── Paso 0 — Producción ──────────────────────────────────────────
  const [inputLabel, setInputLabel] = useState(defaultConfig?.input_label ?? '')
  const [outputLabel, setOutputLabel] = useState(defaultConfig?.output_label ?? '')
  const [productTypes, setProductTypes] = useState<string[]>(
    defaultConfig?.product_types?.length ? defaultConfig.product_types : ['']
  )
  const [responsableProduccion, setResponsableProduccion] = useState(
    organization.industry_config?.area_responsables?.produccion ?? ''
  )
  const [notificationPhone, setNotificationPhone] = useState('')

  function addProductType() { setProductTypes(p => [...p, '']) }
  function updateProductType(i: number, val: string) {
    setProductTypes(p => p.map((v, idx) => (idx === i ? val : v)))
  }
  function removeProductType(i: number) {
    setProductTypes(p => p.filter((_, idx) => idx !== i))
  }

  // ── Paso 1 — Proveedores ─────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<SupplierInput[]>([])

  function addSupplier() {
    setSuppliers(p => [...p, { name: '', cuit: '', category: 'materia_prima', contact_name: '', notes: '' }])
  }
  function updateSupplier(i: number, field: keyof SupplierInput, val: string) {
    setSuppliers(p => p.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)))
  }
  function removeSupplier(i: number) {
    setSuppliers(p => p.filter((_, idx) => idx !== i))
  }

  // ── Paso 2 — Inventario ──────────────────────────────────────────
  const [items, setItems] = useState<InventoryItem[]>([])

  function addSuggestedItem(s: { name: string; unit: string; category: string; min_stock: number }) {
    setItems(prev => [...prev, {
      name: s.name, unit: s.unit,
      current_stock: '', min_stock: String(s.min_stock),
      category: s.category, supplier_name: '',
    }])
  }
  function isSuggestionAdded(name: string) { return items.some(i => i.name === name) }

  function addItem() {
    setItems(p => [...p, { name: '', unit: '', current_stock: '', min_stock: '', category: 'insumo', supplier_name: '' }])
  }
  function updateItem(i: number, field: keyof InventoryItem, val: string) {
    setItems(p => p.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)))
  }
  function removeItem(i: number) {
    setItems(p => p.filter((_, idx) => idx !== i))
  }

  // ── handleComplete ───────────────────────────────────────────────
  async function handleComplete() {
    setLoading(true)
    setError(null)

    const industryConfig = {
      ...(defaultConfig ?? {}),
      input_label: inputLabel,
      output_label: outputLabel,
      product_types: productTypes.filter(t => t.trim()),
      custom_fields: INDUSTRIES[selectedIndustry]?.defaultConfig.custom_fields ?? defaultConfig?.custom_fields ?? [],
      area_responsables: {
        ...(defaultConfig?.area_responsables ?? {}),
        ...(responsableProduccion.trim() ? { produccion: responsableProduccion.trim() } : {}),
      },
    }

    const initialItems    = items.filter(i => i.name.trim())
    const initialSuppliers = suppliers.filter(s => s.name.trim())

    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        industryConfig,
        initialItems,
        initialSuppliers,
        industry: selectedIndustry,
        company_size: companySize,
        notification_phone: notificationPhone || undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al guardar configuración')
      setLoading(false)
      return
    }

    setStep(3)
    setLoading(false)
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Configuración inicial</p>
        <h1 className="text-2xl font-bold">
          Bienvenido{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground text-sm">
          {organization.name} · {industryMeta?.label ?? organization.industry}
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
              i < step ? 'bg-primary text-primary-foreground' :
              i === step ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs ${i === step ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* ── Paso 0 — Producción ── */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Cómo se llaman tus insumos y productos?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tamaño de empresa SEPYME */}
            <div className="space-y-2">
              <Label>Tamaño de empresa</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'micro',   label: 'Microempresa',      desc: 'Hasta 10 empleados' },
                  { value: 'small',   label: 'Pequeña empresa',   desc: '11 a 50 empleados' },
                  { value: 'medium',  label: 'Mediana (tramo 1)', desc: '51 a 200 empleados' },
                  { value: 'medium2', label: 'Mediana (tramo 2)', desc: '201 a 590 empleados' },
                ] as { value: CompanySize; label: string; desc: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCompanySize(opt.value)}
                    className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                      companySize === opt.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium block">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Clasificación oficial SEPYME — adapta la complejidad del sistema</p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de empresa</Label>
              <select
                value={selectedIndustry}
                onChange={e => handleIndustryChange(e.target.value as Industry)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {INDUSTRY_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map(value => (
                      <option key={value} value={value}>{INDUSTRIES[value].label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">El asistente IA y los campos se adaptan a tu industria</p>
            </div>

            <div className="space-y-2">
              <Label>Responsable de producción</Label>
              <Input
                placeholder="Nombre del encargado de producción"
                value={responsableProduccion}
                onChange={e => setResponsableProduccion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Se pre-carga automáticamente al registrar cada lote</p>
            </div>

            <div className="space-y-2">
              <Label>Teléfono para alertas WhatsApp</Label>
              <Input
                placeholder="+5491123456789"
                value={notificationPhone}
                onChange={e => setNotificationPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Recibís notificaciones de stock bajo y alertas críticas (opcional)</p>
            </div>

            <div className="space-y-2">
              <Label>Insumo principal</Label>
              <Input
                placeholder={industryMeta?.inputLabel ?? 'Ej: Litros de leche'}
                value={inputLabel}
                onChange={e => setInputLabel(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Lo que usás para producir (materia prima principal)</p>
            </div>

            <div className="space-y-2">
              <Label>Producto final</Label>
              <Input
                placeholder={industryMeta?.outputLabel ?? 'Ej: Kg producidos'}
                value={outputLabel}
                onChange={e => setOutputLabel(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Lo que producís o vendés</p>
            </div>

            <div className="space-y-2">
              <Label>Tipos de producto</Label>
              <div className="space-y-2">
                {productTypes.map((pt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={industryMeta?.productExamples?.[i] ?? `Tipo ${i + 1}`}
                      value={pt}
                      onChange={e => updateProductType(i, e.target.value)}
                    />
                    {productTypes.length > 1 && (
                      <button type="button" onClick={() => removeProductType(i)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addProductType}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar tipo
              </button>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => setStep(1)}>
              Continuar <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── Paso 1 — Proveedores ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proveedores</CardTitle>
            <p className="text-sm text-muted-foreground">
              Registrá tus proveedores habituales. Podés saltear este paso y cargarlos después desde Inventario.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {suppliers.length > 0 && (
              <div className="space-y-3">
                {suppliers.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nombre del proveedor *"
                        value={s.name}
                        onChange={e => updateSupplier(i, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <button type="button" onClick={() => removeSupplier(i)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={s.category}
                        onChange={e => updateSupplier(i, 'category', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {SUPPLIER_CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <Input
                        placeholder="CUIT (opcional)"
                        value={s.cuit}
                        onChange={e => updateSupplier(i, 'cuit', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Contacto (opcional)"
                        value={s.contact_name}
                        onChange={e => updateSupplier(i, 'contact_name', e.target.value)}
                      />
                      <Input
                        placeholder="Notas (opcional)"
                        value={s.notes}
                        onChange={e => updateSupplier(i, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suppliers.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                Todavía no agregaste proveedores.
              </div>
            )}

            <button
              type="button"
              onClick={addSupplier}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar proveedor
            </button>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              Volver
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Saltear
              </Button>
              <Button onClick={() => setStep(2)}>
                Continuar <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* ── Paso 2 — Inventario ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventario inicial</CardTitle>
            <p className="text-sm text-muted-foreground">
              Agregá los insumos que maneja tu empresa. Podés saltear este paso y cargarlo después.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Sugeridos */}
            {(INDUSTRIES[selectedIndustry]?.suggestedInventory ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Típicos en {INDUSTRIES[selectedIndustry]?.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(INDUSTRIES[selectedIndustry]?.suggestedInventory ?? []).map(s => {
                    const added = isSuggestionAdded(s.name)
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => !added && addSuggestedItem(s)}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          added
                            ? 'bg-primary/10 border-primary/30 text-primary cursor-default'
                            : 'bg-background border-border hover:border-primary hover:text-primary cursor-pointer'
                        }`}
                      >
                        {added ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        {s.name}
                        <span className="text-xs text-muted-foreground">({s.unit})</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ítems */}
            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tu inventario</p>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nombre del ítem"
                          value={item.name}
                          onChange={e => updateItem(i, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Unidad (kg, L, u)"
                          value={item.unit}
                          onChange={e => updateItem(i, 'unit', e.target.value)}
                        />
                        <select
                          value={item.category}
                          onChange={e => updateItem(i, 'category', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="materia_prima">Materia prima</option>
                          <option value="insumo">Insumo</option>
                          <option value="material_empaque">Empaque</option>
                          <option value="producto_terminado">Prod. terminado</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Stock actual"
                          value={item.current_stock}
                          onChange={e => updateItem(i, 'current_stock', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Stock mínimo"
                          value={item.min_stock}
                          onChange={e => updateItem(i, 'min_stock', e.target.value)}
                        />
                      </div>
                      {/* Proveedor vinculado */}
                      {suppliers.filter(s => s.name.trim()).length > 0 && (
                        <select
                          value={item.supplier_name}
                          onChange={e => updateItem(i, 'supplier_name', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Sin proveedor</option>
                          {suppliers.filter(s => s.name.trim()).map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar ítem propio
            </button>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Volver
              </Button>
              <Button variant="ghost" onClick={handleComplete} disabled={loading}>
                Saltear
              </Button>
            </div>
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? 'Guardando...' : 'Finalizar configuración'}
            </Button>
          </CardFooter>
          {error && <p className="text-sm text-destructive px-6 pb-4">{error}</p>}
        </Card>
      )}

      {/* ── Paso 3 — Listo ── */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">¡Todo listo!</h2>
              <p className="text-muted-foreground text-sm">
                {organization.name} está configurado y listo para operar.
              </p>
            </div>
            <div className="text-left bg-muted/40 rounded-lg p-4 space-y-1 text-sm">
              <p className="font-medium mb-2">Configurado:</p>
              <p>✓ Tamaño: <span className="font-medium">{{
                micro: 'Microempresa', small: 'Pequeña empresa',
                medium: 'Mediana (tramo 1)', medium2: 'Mediana (tramo 2)',
              }[companySize]}</span></p>
              <p>✓ Industria: <span className="font-medium">{INDUSTRIES[selectedIndustry]?.label}</span></p>
              <p>✓ Insumo: <span className="font-medium">{inputLabel || industryMeta?.inputLabel}</span></p>
              <p>✓ Producto: <span className="font-medium">{outputLabel || industryMeta?.outputLabel}</span></p>
              {productTypes.filter(t => t.trim()).length > 0 && (
                <p>✓ Tipos: <span className="font-medium">{productTypes.filter(t => t.trim()).join(', ')}</span></p>
              )}
              {responsableProduccion.trim() && (
                <p>✓ Responsable: <span className="font-medium">{responsableProduccion.trim()}</span></p>
              )}
              {notificationPhone.trim() && (
                <p>✓ Alertas WhatsApp: <span className="font-medium">{notificationPhone.trim()}</span></p>
              )}
              {suppliers.filter(s => s.name.trim()).length > 0 && (
                <p>✓ {suppliers.filter(s => s.name.trim()).length} proveedor{suppliers.filter(s => s.name.trim()).length !== 1 ? 'es' : ''} cargado{suppliers.filter(s => s.name.trim()).length !== 1 ? 's' : ''}</p>
              )}
              {items.filter(i => i.name.trim()).length > 0 && (
                <p>✓ {items.filter(i => i.name.trim()).length} ítems de inventario cargados</p>
              )}
            </div>
            <Button className="w-full" onClick={() => router.push('/inicio')}>
              Ir al dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
