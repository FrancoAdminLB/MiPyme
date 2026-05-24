'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, X } from 'lucide-react'
import type { ProductionBatch } from '@/types'

function generateBatchCode() {
  const now  = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const hh   = String(now.getHours()).padStart(2, '0')
  const mm   = String(now.getMinutes()).padStart(2, '0')
  return `LOT-${date}-${hh}${mm}`
}

interface DuplicateBatchButtonProps {
  batch: ProductionBatch
}

export function DuplicateBatchButton({ batch }: DuplicateBatchButtonProps) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [newCode, setNewCode] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])

  function handleOpen() {
    setNewCode(generateBatchCode())
    setNewDate(new Date().toISOString().split('T')[0])
    setError(null)
    setSaved(false)
    setOpen(true)
  }

  async function handleDuplicate() {
    if (!newCode.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) { setLoading(false); return }

    const { error } = await supabase.from('production_batches').insert({
      organization_id: profile.organization_id,
      batch_code:      newCode.trim(),
      product_name:    batch.product_name,
      product_type:    batch.product_type,
      quantity_kg:     batch.quantity_kg,
      input_quantity:  batch.input_quantity,
      start_date:      newDate,
      notes:           batch.notes,
      status:          'in_progress',
      custom_data:     batch.custom_data,
      created_by:      user.id,
    })

    if (error) {
      setError('Código de lote duplicado o error al guardar.')
      setLoading(false)
      return
    }

    setSaved(true)
    router.refresh()
    setTimeout(() => setOpen(false), 900)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        title="Duplicar lote"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Copy className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold">Duplicar lote</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{batch.product_name} · {batch.input_quantity} → {batch.quantity_kg} kg</p>
          </div>
          <button onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dup-code">Nuevo código de lote</Label>
            <Input
              id="dup-code"
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dup-date">Fecha inicio</Label>
            <Input
              id="dup-date"
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Se copian producto, cantidades, insumos y todos los campos del lote original. El estado se inicia en <span className="font-medium">En proceso</span>.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleDuplicate} disabled={loading || saved}>
            {saved ? '¡Duplicado!' : loading ? 'Guardando...' : 'Duplicar lote'}
          </Button>
        </div>
      </div>
    </div>
  )
}
