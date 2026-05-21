'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react'
import type { InventoryItem } from '@/types'

interface MovimientoFormProps {
  items: InventoryItem[]
  preselectedItem?: InventoryItem
}

const MOVEMENT_TYPES = [
  { value: 'entrada', label: 'Entrada', icon: ArrowDownCircle, color: 'text-green-600' },
  { value: 'salida',  label: 'Salida',  icon: ArrowUpCircle,   color: 'text-red-600' },
  { value: 'ajuste',  label: 'Ajuste',  icon: RefreshCw,       color: 'text-blue-600' },
]

export function MovimientoForm({ items, preselectedItem }: MovimientoFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    item_id: preselectedItem?.id ?? '',
    movement_type: 'entrada',
    quantity: '',
    reference: '',
    notes: '',
  })

  const selectedItem = items.find(i => i.id === form.item_id)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  function reset() {
    setForm({ item_id: preselectedItem?.id ?? '', movement_type: 'entrada', quantity: '', reference: '', notes: '' })
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
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) { setLoading(false); return }

    const qty = parseFloat(form.quantity)
    if (isNaN(qty) || qty <= 0) {
      setError('La cantidad debe ser mayor a 0.')
      setLoading(false)
      return
    }

    // Verificar stock suficiente en salidas
    if (form.movement_type === 'salida' && selectedItem && qty > selectedItem.current_stock) {
      setError(`Stock insuficiente. Disponible: ${selectedItem.current_stock} ${selectedItem.unit}`)
      setLoading(false)
      return
    }

    const { error } = await supabase.from('inventory_movements').insert({
      organization_id: profile.organization_id,
      item_id: form.item_id,
      movement_type: form.movement_type,
      quantity: qty,
      reference: form.reference || null,
      notes: form.notes || null,
      created_by: user.id,
    })

    if (error) { setError(error.message); setLoading(false); return }

    router.refresh()
    setTimeout(() => { setOpen(false); reset() }, 900)
    setLoading(false)
  }

  const trigger = preselectedItem ? (
    <button
      onClick={() => setOpen(true)}
      className="text-xs text-primary hover:underline"
    >
      + Movimiento
    </button>
  ) : (
    <Button onClick={() => setOpen(true)}>
      <Plus className="h-4 w-4 mr-2" /> Registrar movimiento
    </Button>
  )

  return (
    <>
      {trigger}

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Registrar movimiento</h2>
              <button onClick={() => { setOpen(false); reset() }}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo de movimiento */}
              <div className="grid grid-cols-3 gap-2">
                {MOVEMENT_TYPES.map(mt => {
                  const Icon = mt.icon
                  const active = form.movement_type === mt.value
                  return (
                    <button
                      key={mt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, movement_type: mt.value }))}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        active ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? mt.color : 'text-muted-foreground'}`} />
                      {mt.label}
                    </button>
                  )
                })}
              </div>

              {/* Ítem */}
              {preselectedItem ? (
                <div className="space-y-1">
                  <Label>Ítem</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted/30 text-sm flex items-center">
                    {preselectedItem.name}
                    <span className="ml-auto text-muted-foreground text-xs">
                      Stock actual: {preselectedItem.current_stock} {preselectedItem.unit}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>Ítem *</Label>
                  <select
                    name="item_id"
                    value={form.item_id}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Seleccioná un ítem...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.current_stock} {item.unit}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cantidad */}
              <div className="space-y-1">
                <Label>
                  {form.movement_type === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
                  {selectedItem && <span className="text-muted-foreground ml-1">({selectedItem.unit})</span>}
                </Label>
                <Input
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
                {form.movement_type === 'ajuste' && (
                  <p className="text-xs text-muted-foreground">
                    El stock se va a ajustar a este valor exacto
                  </p>
                )}
              </div>

              {/* Referencia */}
              <div className="space-y-1">
                <Label>Referencia (opcional)</Label>
                <Input
                  name="reference"
                  value={form.reference}
                  onChange={handleChange}
                  placeholder="Ej: Remito 001, Lote proveedor, OC-123"
                />
              </div>

              <div className="space-y-1">
                <Label>Notas (opcional)</Label>
                <Input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Observaciones..."
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : '✓ Registrar movimiento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
