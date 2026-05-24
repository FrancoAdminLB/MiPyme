'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Receipt } from 'lucide-react'
import type { FiscalConfig } from '@/lib/integrations/tusfacturas'

interface FiscalConfigFormProps {
  orgId: string
  initialConfig: Partial<FiscalConfig>
}

export function FiscalConfigForm({ initialConfig }: FiscalConfigFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<Partial<FiscalConfig>>({
    tipo_comprobante_default: 'B',
    condicion_iva: 'RI',
    punto_venta: 1,
    ...initialConfig,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setConfig(p => ({ ...p, [name]: name === 'punto_venta' ? parseInt(value, 10) : value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/organizations/fiscal-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      router.refresh()
    } else {
      const json = await res.json() as { error?: string }
      setError(json.error ?? 'Error al guardar.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Facturación AFIP
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Credenciales de TusFacturasAPP para emitir comprobantes electrónicos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">CUIT emisor</Label>
            <Input
              name="cuit"
              value={config.cuit ?? ''}
              onChange={handleChange}
              placeholder="20-12345678-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Razón social</Label>
            <Input
              name="razon_social"
              value={config.razon_social ?? ''}
              onChange={handleChange}
              placeholder="La Blanqueada S.R.L."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Punto de venta</Label>
            <Input
              name="punto_venta"
              type="number"
              min="1"
              value={config.punto_venta ?? 1}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de comprobante por defecto</Label>
            <select
              name="tipo_comprobante_default"
              value={config.tipo_comprobante_default ?? 'B'}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="B">Factura B (Consumidor Final)</option>
              <option value="A">Factura A (Responsable Inscripto)</option>
              <option value="C">Factura C (Exento / Monotributista)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Condición IVA (emisor)</Label>
            <select
              name="condicion_iva"
              value={config.condicion_iva ?? 'RI'}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="RI">Responsable Inscripto</option>
              <option value="MT">Monotributista</option>
              <option value="EX">Exento</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Credenciales TusFacturasAPP
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">API Key</Label>
              <Input
                name="tusfacturas_apikey"
                type="password"
                value={config.tusfacturas_apikey ?? ''}
                onChange={handleChange}
                placeholder="••••••••••••"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">User Token</Label>
              <Input
                name="tusfacturas_usertoken"
                type="password"
                value={config.tusfacturas_usertoken ?? ''}
                onChange={handleChange}
                placeholder="••••••••••••"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">API Key Empresas</Label>
              <Input
                name="tusfacturas_apikey_empresas"
                type="password"
                value={config.tusfacturas_apikey_empresas ?? ''}
                onChange={handleChange}
                placeholder="••••••••••••"
                autoComplete="off"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Obtené tus credenciales en{' '}
            <span className="font-mono">tusfacturas.app</span> → Mi cuenta → API.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
