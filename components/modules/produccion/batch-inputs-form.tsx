'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X, PackageSearch } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import type { InventoryItem, ProductionBatchInput } from '@/types'

interface BatchInputsFormProps {
  batchId: string
  batchCode: string
  items: InventoryItem[]
  existingInputs: ProductionBatchInput[]
}

interface InputRow {
  item_id: string
  quantity_used: string
  lot_number: string
}

export function BatchInputsForm({ batchId, batchCode, items, existingInputs }: BatchInputsFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<InputRow[]>([
    { item_id: '', quantity_used: '', lot_number: '' }
  ])

  const materiasPrimas = items.filter(i => i.category === 'materia_prima' || i.category === 'insumo')

  function addRow() {
    setRows(r => [...r, { item_id: '', quantity_used: '', lot_number: '' }])
  }

  function removeRow(i: number) {
    setRows(r => r.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: keyof InputRow, value: string) {
    setRows(r => { const n = [...r]; n[i] = { ...n[i]!, [field]: value }; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const valid = rows.filter(r => r.item_id && parseFloat(r.quantity_used) > 0)
    if (!valid.length) { setError('Agregá al menos un insumo con cantidad.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) { setLoading(false); return }

    const orgId = profile.organization_id

    // 1. Registrar insumos del lote
    const inserts = valid.map(r => ({
      organization_id: orgId,
      batch_id: batchId,
      item_id: r.item_id,
      quantity_used: parseFloat(r.quantity_used),
      lot_number: r.lot_number || null,
    }))

    const { error: inputsError } = await supabase.from('production_batch_inputs').insert(inserts)
    if (inputsError) { setError(inputsError.message); setLoading(false); return }

    // 2. Automatización: descontar del inventario (el trigger de DB actualiza current_stock)
    const movements = valid.map(r => ({
      organization_id: orgId,
      item_id: r.item_id,
      movement_type: 'salida',
      quantity: parseFloat(r.quantity_used),
      reference: `LOTE-${batchCode}`,
      notes: `Consumo automático — lote ${batchCode}`,
      created_by: user.id,
    }))

    await supabase.from('inventory_movements').insert(movements)

    // Automatización: verificar si algún ítem quedó bajo mínimo y crear órdenes de reposición
    const itemIds = valid.map(r => r.item_id).filter((id, i, arr) => arr.indexOf(id) === i)
    fetch('/api/inventory/check-reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds }),
    })

    setOpen(false)
    setRows([{ item_id: '', quantity_used: '', lot_number: '' }])
    router.refresh()
    setLoading(false)
  }

  async function deleteInput(id: string, itemId: string, quantityUsed: number) {
    const supabase = createClient()

    // Eliminar el insumo del lote
    await supabase.from('production_batch_inputs').delete().eq('id', id)

    // Revertir el movimiento de inventario correspondiente
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select('id')
      .eq('item_id', itemId)
      .eq('reference', `LOTE-${batchCode}`)
      .eq('movement_type', 'salida')
      .eq('quantity', quantityUsed)
      .limit(1)

    if (movements?.length) {
      await supabase.from('inventory_movements').delete().eq('id', movements[0]!.id)
    }

    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <PackageSearch className="h-4 w-4" />
        {existingInputs.length > 0
          ? `${existingInputs.length} insumo${existingInputs.length > 1 ? 's' : ''} registrado${existingInputs.length > 1 ? 's' : ''}`
          : 'Registrar insumos'}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-card">
              <div>
                <h2 className="text-lg font-semibold">Insumos del lote</h2>
                <p className="text-sm text-muted-foreground">{batchCode}</p>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Insumos ya registrados */}
              {existingInputs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Insumos registrados
                  </p>
                  <div className="border rounded-lg divide-y">
                    {existingInputs.map((inp) => (
                      <div key={inp.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <div>
                          <span className="font-medium">{inp.inventory_items?.name ?? '—'}</span>
                          {inp.lot_number && (
                            <span className="ml-2 text-xs text-muted-foreground font-mono">
                              Lote: {inp.lot_number}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            {formatNumber(inp.quantity_used, 2)} {inp.inventory_items?.unit}
                          </span>
                          <button
                            onClick={() => deleteInput(inp.id, inp.item_id, inp.quantity_used)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agregar nuevos insumos */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Agregar insumos
                </p>

                {rows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_140px_140px_auto] gap-3 items-end">
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs">Insumo / Materia prima</Label>}
                      <select
                        value={row.item_id}
                        onChange={(e) => updateRow(i, 'item_id', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Seleccioná...</option>
                        {materiasPrimas.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({formatNumber(item.current_stock, 1)} {item.unit} disponibles)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs">Cantidad usada</Label>}
                      <Input
                        type="number" min="0" step="0.001"
                        placeholder="0"
                        value={row.quantity_used}
                        onChange={(e) => updateRow(i, 'quantity_used', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs">Lote proveedor</Label>}
                      <Input
                        placeholder="Opcional"
                        value={row.lot_number}
                        onChange={(e) => updateRow(i, 'lot_number', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-muted-foreground hover:text-destructive mb-0.5"
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                  <Plus className="h-4 w-4 mr-2" /> Agregar insumo
                </Button>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-end gap-3 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cerrar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar insumos'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
