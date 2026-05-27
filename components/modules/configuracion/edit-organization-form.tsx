'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, X, Save, MessageCircle } from 'lucide-react'
import type { Organization, CompanySize } from '@/types'
import { INDUSTRY_GROUPS, INDUSTRIES } from '@/lib/industries'

const COMPANY_SIZES: { value: CompanySize; label: string; desc: string }[] = [
  { value: 'micro',   label: 'Microempresa',       desc: 'Hasta 10 empleados' },
  { value: 'small',   label: 'Pequeña empresa',    desc: '11 a 50 empleados' },
  { value: 'medium',  label: 'Mediana (tramo 1)',   desc: '51 a 200 empleados' },
  { value: 'medium2', label: 'Mediana (tramo 2)',   desc: '201 a 590 empleados' },
]

export function EditOrganizationForm({ organization }: { organization: Organization }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name:               organization.name,
    industry:           organization.industry,
    language:           organization.industry_config?.language ?? 'es_AR',
    notification_phone: (organization as Organization & { notification_phone?: string }).notification_phone ?? '',
    company_size:       (organization.company_size ?? 'small') as CompanySize,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/organizations/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <Pencil className="h-3.5 w-3.5" /> Editar
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Editar organización</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la empresa *</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de empresa *</Label>
                <select
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
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
                  <p className="text-xs text-muted-foreground">
                  Cambiá el rubro y el asistente IA se adapta automáticamente.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tamaño de empresa (SEPYME)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_SIZES.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, company_size: opt.value }))}
                      className={`text-left p-2.5 rounded-lg border text-sm transition-colors ${
                        form.company_size === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium block">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="es_AR">🇦🇷 Español (Argentina)</option>
                  <option value="en">🇺🇸 English (próximamente)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                  WhatsApp para alertas
                </Label>
                <Input
                  name="notification_phone"
                  value={form.notification_phone}
                  onChange={handleChange}
                  placeholder="+54 9 11 1234 5678"
                />
                <p className="text-xs text-muted-foreground">
                  Recibís un mensaje cuando el stock baja del mínimo. Formato internacional: +54 9 11...
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
