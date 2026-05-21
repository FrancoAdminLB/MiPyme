'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

interface Item {
  id: string
  name: string
  unit: string
  current_stock: number
  min_stock: number
  supplier_id: string | null
}

interface Supplier {
  id: string
  name: string
}

interface NewOrderButtonProps {
  items: Item[]
  suppliers: Supplier[]
}

export function NewOrderButton({ items, suppliers }: NewOrderButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    item_id: '',
    supplier_id: '',
    quantity_requested: '',
    notes: '',
  })

  const selectedItem = items.find(i => i.id === form.item_id)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(p => ({
      ...p,
      [name]: value,
      // Preseleccionar proveedor del ítem
      ...(name === 'item_id' ? {
        supplier_id: items.find(i => i.id === value)?.supplier_id ?? '',
      } : {}),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const qty = parseFloat(form.quantity_requested)
    if (isNaN(qty) || qty <= 0) { setError('La cantidad debe ser mayor a 0.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) { setLoading(false); return }

    const { error } = await supabase.from('purchase_orders').insert({
      organization_id: profile.organization_id,
      item_id: form.item_id,
      supplier_id: form.supplier_id || null,
      quantity_requested: qty,
      status: 'pending',
      triggered_by: 'manual',
      stock_at_creation: selectedItem?.current_stock ?? null,
      min_stock_at_creation: selectedItem?.min_stock ?? null,
      notes: form.notes || null,
    })

    if (error) { setError(error.message); setLoading(false); return }

    setOpen(false)
    setForm({ item_id: '', supplier_id: '', quantity_requested: '', notes: '' })
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> Nueva orden
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Nueva orden de compra</h2>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Ítem *</Label>
                <select
                  name="item_id"
                  value={form.item_id}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seleccioná un ítem...</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} — stock: {i.current_stock} {i.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Proveedor</Label>
                <select
                  name="supplier_id"
                  value={form.supplier_id}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Sin proveedor asignado</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>
                  Cantidad a solicitar
                  {selectedItem && <span className="text-muted-foreground ml-1">({selectedItem.unit})</span>}
                </Label>
                <Input
                  name="quantity_requested"
                  type="number"
                  min="0.001"
                  step="0.001"
                  placeholder="0"
                  value={form.quantity_requested}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Observaciones para el proveedor..."
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear orden'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
