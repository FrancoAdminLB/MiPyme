'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, X, Plus } from 'lucide-react'
import type { InventoryItem, Supplier } from '@/types'

interface EditItemFormProps {
  item?: InventoryItem
  suppliers: Supplier[]
  mode: 'edit' | 'new'
}

const CATEGORIES = [
  { value: 'materia_prima',    label: 'Materia prima' },
  { value: 'producto_terminado', label: 'Producto terminado' },
  { value: 'material_empaque', label: 'Material de empaque' },
  { value: 'insumo',           label: 'Insumo' },
]

export function EditItemForm({ item, suppliers, mode }: EditItemFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name:          item?.name          ?? '',
    sku:           item?.sku           ?? '',
    category:      item?.category      ?? 'materia_prima',
    unit:          item?.unit          ?? 'kg',
    min_stock:     String(item?.min_stock  ?? 0),
    max_stock:     item?.max_stock != null ? String(item.max_stock) : '',
    supplier_id:   item?.supplier_id   ?? '',
    lot_number:    item?.lot_number    ?? '',
    expiry_date:   item?.expiry_date   ?? '',
    received_date: item?.received_date ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) { setLoading(false); return }

    const payload = {
      organization_id: profile.organization_id,
      name:          form.name,
      sku:           form.sku  || null,
      category:      form.category,
      unit:          form.unit,
      min_stock:     parseFloat(form.min_stock) || 0,
      max_stock:     form.max_stock ? parseFloat(form.max_stock) : null,
      supplier_id:   form.supplier_id || null,
      lot_number:    form.lot_number  || null,
      expiry_date:   form.expiry_date   || null,
      received_date: form.received_date || null,
    }

    const { error } = mode === 'edit' && item
      ? await supabase.from('inventory_items').update(payload).eq('id', item.id)
      : await supabase.from('inventory_items').insert(payload)

    if (error) { setError(error.message); setLoading(false); return }
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      {mode === 'new' ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo ítem
        </Button>
      ) : (
        <button onClick={() => setOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-lg my-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {mode === 'new' ? 'Nuevo ítem de inventario' : `Editar — ${item?.name}`}
              </h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Leche cruda" />
                </div>
                <div className="space-y-2">
                  <Label>SKU / Código</Label>
                  <Input name="sku" value={form.sku} onChange={handleChange} placeholder="MP-001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Unidad *</Label>
                  <Input name="unit" value={form.unit} onChange={handleChange} required placeholder="kg, litros, unidades..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stock mínimo</Label>
                  <Input name="min_stock" type="number" min="0" step="0.001" value={form.min_stock} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Stock máximo</Label>
                  <Input name="max_stock" type="number" min="0" step="0.001" value={form.max_stock} onChange={handleChange} placeholder="Opcional" />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trazabilidad</p>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <select name="supplier_id" value={form.supplier_id} onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Sin proveedor asignado</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lote del proveedor</Label>
                    <Input name="lot_number" value={form.lot_number} onChange={handleChange} placeholder="Ej: L-2026-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de recepción</Label>
                    <Input name="received_date" type="date" value={form.received_date} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de vencimiento</Label>
                  <Input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : mode === 'new' ? 'Crear ítem' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
