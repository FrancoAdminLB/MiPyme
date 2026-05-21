'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle } from 'lucide-react'

interface BatchStatusButtonProps {
  batchId: string
  currentStatus: string
  productName: string
  quantityKg: number
}

export function BatchStatusButton({ batchId, currentStatus, productName, quantityKg }: BatchStatusButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (currentStatus !== 'in_progress') return null

  async function update(newStatus: 'completed' | 'cancelled') {
    if (!confirm(newStatus === 'completed' ? '¿Marcás este lote como completado?' : '¿Cancelás este lote?')) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('production_batches')
      .update({ status: newStatus, end_date: new Date().toISOString().split('T')[0] })
      .eq('id', batchId)

    // Automatización: al completar, registrar el producto terminado en inventario
    if (newStatus === 'completed' && user) {
      const { data: profile } = await supabase
        .from('profiles').select('organization_id').eq('id', user.id).single()

      if (profile) {
        // Buscar ítem de producto terminado con ese nombre
        const { data: items } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('organization_id', profile.organization_id)
          .eq('category', 'producto_terminado')
          .ilike('name', productName)
          .limit(1)

        const itemId = items?.[0]?.id

        if (itemId) {
          // Existe: registrar entrada automática
          await supabase.from('inventory_movements').insert({
            organization_id: profile.organization_id,
            item_id: itemId,
            movement_type: 'entrada',
            quantity: quantityKg,
            reference: `LOTE-${batchId}`,
            notes: `Producción completada — ${productName}`,
            created_by: user.id,
          })
        } else {
          // No existe: crear el ítem y registrar la entrada
          const { data: newItem } = await supabase
            .from('inventory_items')
            .insert({
              organization_id: profile.organization_id,
              name: productName,
              category: 'producto_terminado',
              unit: 'kg',
              current_stock: 0,
              min_stock: 0,
            })
            .select('id')
            .single()

          if (newItem) {
            await supabase.from('inventory_movements').insert({
              organization_id: profile.organization_id,
              item_id: newItem.id,
              movement_type: 'entrada',
              quantity: quantityKg,
              reference: `LOTE-${batchId}`,
              notes: `Producción completada — ${productName}`,
              created_by: user.id,
            })
          }
        }
      }
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => update('completed')}
        disabled={loading}
        title="Completar lote"
        className="text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors"
      >
        <CheckCircle className="h-4 w-4" />
      </button>
      <button
        onClick={() => update('cancelled')}
        disabled={loading}
        title="Cancelar lote"
        className="text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  )
}
