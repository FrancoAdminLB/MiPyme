'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle } from 'lucide-react'
import type { IndustryConfig, CustomField } from '@/types'

interface BatchInput {
  item_id: string
  quantity_used: number
  inventory_items?: { name: string; unit: string } | null
}

interface BatchStatusButtonProps {
  batchId: string
  currentStatus: string
  productName: string
  quantityKg: number
  customData?: Record<string, unknown>
  config?: IndustryConfig
  batchInputs?: BatchInput[]
}

function getMissingRequiredFields(customData: Record<string, unknown>, config: IndustryConfig): string[] {
  const fields: CustomField[] = config.custom_fields ?? []
  return fields
    .filter(f => f.required && (customData[f.key] === undefined || customData[f.key] === null || customData[f.key] === ''))
    .map(f => f.label)
}

function getOutOfRangeFields(customData: Record<string, unknown>, config: IndustryConfig): string[] {
  const fields: CustomField[] = config.custom_fields ?? []
  return fields
    .filter(f => f.compliance_ref && f.type === 'number' && (f.min_value !== undefined || f.max_value !== undefined))
    .filter(f => {
      const val = parseFloat(String(customData[f.key] ?? ''))
      if (isNaN(val)) return false
      if (f.min_value !== undefined && val < f.min_value) return true
      if (f.max_value !== undefined && val > f.max_value) return true
      return false
    })
    .map(f => f.label)
}

export function BatchStatusButton({ batchId, currentStatus, productName, quantityKg, customData, config, batchInputs }: BatchStatusButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (currentStatus !== 'in_progress') return null

  async function update(newStatus: 'completed' | 'cancelled') {
    if (newStatus === 'completed' && customData && config) {
      const missing = getMissingRequiredFields(customData, config)
      const outOfRange = getOutOfRangeFields(customData, config)
      if (missing.length > 0 || outOfRange.length > 0) {
        const lines: string[] = []
        if (missing.length > 0) lines.push(`Campos requeridos sin completar:\n• ${missing.join('\n• ')}`)
        if (outOfRange.length > 0) lines.push(`Parámetros fuera de norma:\n• ${outOfRange.join('\n• ')}`)
        const proceed = confirm(
          `⚠️ ADVERTENCIA — Incumplimiento normativo\n\n${lines.join('\n\n')}\n\n¿Querés completar el lote de todas formas?`
        )
        if (!proceed) return
      } else {
        if (!confirm('¿Marcás este lote como completado?')) return
      }
    } else {
      if (!confirm(newStatus === 'completed' ? '¿Marcás este lote como completado?' : '¿Cancelás este lote?')) return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('production_batches')
      .update({ status: newStatus, end_date: new Date().toISOString().split('T')[0] })
      .eq('id', batchId)

    // Automatización: al completar, registrar movimientos de inventario
    if (newStatus === 'completed' && user) {
      const { data: profile } = await supabase
        .from('profiles').select('organization_id').eq('id', user.id).single()

      if (profile) {
        const orgId = profile.organization_id

        // Los insumos ya se descontaron al registrarlos en batch-inputs-form.
        // Al completar solo se registra la entrada del producto terminado.

        // Registrar movimientos de producto terminado
        const esPorcionado = customData?.tipo_presentacion === 'Porcionado'

        if (esPorcionado) {
          // 2a. Salida del entero (si existe en stock)
          const { data: enteroItems } = await supabase
            .from('inventory_items')
            .select('id')
            .eq('organization_id', orgId)
            .eq('category', 'producto_terminado')
            .ilike('name', productName)
            .limit(1)

          if (enteroItems?.[0]?.id) {
            const cantidadMoldes = Number(customData?.cantidad_moldes ?? 0)
            if (cantidadMoldes > 0) {
              await supabase.from('inventory_movements').insert({
                organization_id: orgId,
                item_id: enteroItems[0].id,
                movement_type: 'salida',
                quantity: cantidadMoldes,
                reference: `LOTE-${batchId}`,
                notes: `Porcionado — ${productName}`,
                created_by: user.id,
              })
            }
          }

          // 2b. Entrada de porciones
          const cantidadPorciones = Number(customData?.cantidad_porciones ?? 0)
          const nombrePorcionado = `${productName} — porcionado`

          if (cantidadPorciones > 0) {
            const { data: porcionItems } = await supabase
              .from('inventory_items')
              .select('id')
              .eq('organization_id', orgId)
              .eq('category', 'producto_terminado')
              .ilike('name', nombrePorcionado)
              .limit(1)

            const porcionId = porcionItems?.[0]?.id ?? (await supabase
              .from('inventory_items')
              .insert({
                organization_id: orgId,
                name: nombrePorcionado,
                category: 'producto_terminado',
                unit: 'u',
                current_stock: 0,
                min_stock: 0,
              })
              .select('id')
              .single()
            ).data?.id

            if (porcionId) {
              await supabase.from('inventory_movements').insert({
                organization_id: orgId,
                item_id: porcionId,
                movement_type: 'entrada',
                quantity: cantidadPorciones,
                reference: `LOTE-${batchId}`,
                notes: `Porcionado completado — ${productName}`,
                created_by: user.id,
              })
            }
          }

        } else {
          // Flujo normal: entrada de producto entero en kg
          const { data: items } = await supabase
            .from('inventory_items')
            .select('id')
            .eq('organization_id', orgId)
            .eq('category', 'producto_terminado')
            .ilike('name', productName)
            .limit(1)

          const itemId = items?.[0]?.id

          if (itemId) {
            await supabase.from('inventory_movements').insert({
              organization_id: orgId,
              item_id: itemId,
              movement_type: 'entrada',
              quantity: quantityKg,
              reference: `LOTE-${batchId}`,
              notes: `Producción completada — ${productName}`,
              created_by: user.id,
            })
          } else {
            const { data: newItem } = await supabase
              .from('inventory_items')
              .insert({
                organization_id: orgId,
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
                organization_id: orgId,
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
