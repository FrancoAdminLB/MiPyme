'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, X } from 'lucide-react'
import type { IndustryConfig } from '@/types'

interface Batch {
  id: string
  batch_code: string
  product_name: string
  product_type: string
  quantity_kg: number
  input_quantity: number
  start_date: string
  end_date: string | null
  notes: string | null
  status: string
}

interface EditBatchFormProps {
  batch: Batch
  config: IndustryConfig
}

export function EditBatchForm({ batch, config }: EditBatchFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    batch_code:       batch.batch_code,
    product_name:     batch.product_name,
    quantity_kg:      String(batch.quantity_kg),
    input_quantity: String(batch.input_quantity),
    start_date:       batch.start_date,
    end_date:         batch.end_date ?? '',
    notes:            batch.notes ?? '',
  })

  const inputLabel  = config.input_label  || 'Insumo principal'
  const outputLabel = config.output_label || 'Producción (kg)'
  const productTypes = config.product_types ?? []

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('production_batches')
      .update({
        batch_code:       form.batch_code,
        product_name:     form.product_name,
        quantity_kg:      parseFloat(form.quantity_kg) || 0,
        input_quantity: parseFloat(form.input_quantity) || 0,
        start_date:       form.start_date,
        end_date:         form.end_date || null,
        notes:            form.notes    || null,
      })
      .eq('id', batch.id)

    if (error) { setError(error.message); setLoading(false); return }
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Editar lote"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-lg my-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Editar lote — {batch.batch_code}</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código de lote *</Label>
                  <Input name="batch_code" value={form.batch_code} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Fecha inicio *</Label>
                  <Input name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Producto *</Label>
                {productTypes.length > 0 ? (
                  <select name="product_name" value={form.product_name} onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Seleccioná...</option>
                    {productTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                ) : (
                  <Input name="product_name" value={form.product_name} onChange={handleChange} required />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{inputLabel}</Label>
                  <Input name="input_quantity" type="number" min="0" step="0.001" value={form.input_quantity} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>{outputLabel}</Label>
                  <Input name="quantity_kg" type="number" min="0" step="0.001" value={form.quantity_kg} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input name="end_date" type="date" value={form.end_date} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Input name="notes" value={form.notes} onChange={handleChange} placeholder="Observaciones..." />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
