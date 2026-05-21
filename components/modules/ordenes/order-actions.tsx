'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, PackageCheck, X, Plus } from 'lucide-react'

interface OrderActionsProps {
  orderId: string
  itemId: string
  itemName: string
  itemUnit: string
  quantityRequested: number
  status: string
}

export function OrderActions({ orderId, itemId, itemName, itemUnit, quantityRequested, status }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [quantityReceived, setQuantityReceived] = useState(String(quantityRequested))

  async function markSent() {
    if (!confirm('¿Marcar la orden como enviada al proveedor?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('purchase_orders')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', orderId)
    router.refresh()
    setLoading(false)
  }

  async function markReceived() {
    const qty = parseFloat(quantityReceived)
    if (isNaN(qty) || qty <= 0) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) { setLoading(false); return }

    // 1. Actualizar estado de la orden
    await supabase
      .from('purchase_orders')
      .update({ status: 'received', received_at: new Date().toISOString() })
      .eq('id', orderId)

    // 2. Automatización: registrar entrada en inventario
    await supabase.from('inventory_movements').insert({
      organization_id: profile.organization_id,
      item_id: itemId,
      movement_type: 'entrada',
      quantity: qty,
      reference: `OC-${orderId.slice(0, 8).toUpperCase()}`,
      notes: `Recepción de orden de compra — ${itemName}`,
      created_by: user.id,
    })

    setShowReceiveModal(false)
    router.refresh()
    setLoading(false)
  }

  async function cancel() {
    if (!confirm('¿Cancelar esta orden?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('purchase_orders').update({ status: 'cancelled' }).eq('id', orderId)
    router.refresh()
    setLoading(false)
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={markSent}
          disabled={loading}
          title="Marcar como enviada"
          className="text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
        <button
          onClick={cancel}
          disabled={loading}
          title="Cancelar orden"
          className="text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <>
        <button
          onClick={() => setShowReceiveModal(true)}
          disabled={loading}
          title="Registrar recepción"
          className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50 transition-colors"
        >
          <PackageCheck className="h-4 w-4" />
          Recibir
        </button>

        {showReceiveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-lg w-full max-w-sm">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-base font-semibold">Registrar recepción</h2>
                <button onClick={() => setShowReceiveModal(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Ítem: </span>
                  <span className="font-medium">{itemName}</span>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad recibida ({itemUnit})</Label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={quantityReceived}
                    onChange={e => setQuantityReceived(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se agregará automáticamente al stock de inventario.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowReceiveModal(false)}>Cancelar</Button>
                  <Button onClick={markReceived} disabled={loading}>
                    {loading ? 'Guardando...' : (
                      <><Plus className="h-4 w-4 mr-1.5" /> Confirmar recepción</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return null
}
