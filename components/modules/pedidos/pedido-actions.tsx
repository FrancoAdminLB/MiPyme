'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, ChevronRight, X } from 'lucide-react'

type Status = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

const NEXT_LABEL: Partial<Record<Status, string>> = {
  pending:   'Confirmar',
  confirmed: 'Iniciar preparación',
  preparing: 'Marcar listo',
  ready:     'Entregar',
}

interface PedidoActionsProps {
  orderId: string
  status: Status
  hasFiscalConfig: boolean
}

export function PedidoActions({ orderId, status, hasFiscalConfig }: PedidoActionsProps) {
  const router = useRouter()
  const [loadingNext, setLoadingNext] = useState(false)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [loadingCancel, setLoadingCancel] = useState(false)
  const [invoiceResult, setInvoiceResult] = useState<{ cae: string; numero: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const nextStatus = NEXT_STATUS[status]
  const nextLabel  = NEXT_LABEL[status]

  async function advanceStatus() {
    if (!nextStatus) return
    setLoadingNext(true)
    setError(null)

    // Entregar usa API route para descontar stock automáticamente
    if (nextStatus === 'delivered') {
      const res = await fetch('/api/pedidos/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales_order_id: orderId }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        setError(json.error ?? 'Error al entregar el pedido.')
        setLoadingNext(false)
        return
      }
      router.refresh()
      setLoadingNext(false)
      return
    }

    const supabase = createClient()
    const patch: Record<string, string> = { status: nextStatus }
    if (nextStatus === 'confirmed') patch.confirmed_at = new Date().toISOString()
    await supabase.from('sales_orders').update(patch).eq('id', orderId)
    router.refresh()
    setLoadingNext(false)
  }

  async function cancelOrder() {
    setLoadingCancel(true)
    setError(null)
    const supabase = createClient()
    await supabase.from('sales_orders').update({ status: 'cancelled' }).eq('id', orderId)
    router.refresh()
    setLoadingCancel(false)
  }

  async function emitInvoice() {
    setLoadingInvoice(true)
    setError(null)
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales_order_id: orderId }),
      })
      const json = await res.json() as { success?: boolean; cae?: string; numero?: string; error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Error al emitir la factura.')
      } else {
        setInvoiceResult({ cae: json.cae ?? '', numero: json.numero ?? '' })
        router.refresh()
      }
    } finally {
      setLoadingInvoice(false)
    }
  }

  if (status === 'cancelled' || status === 'delivered') {
    return (
      <div className="flex items-center gap-2">
        {status === 'delivered' && hasFiscalConfig && (
          <button
            onClick={emitInvoice}
            disabled={loadingInvoice}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" />
            {loadingInvoice ? 'Emitiendo...' : 'Emitir factura'}
          </button>
        )}
        {invoiceResult && (
          <span className="text-xs text-green-600 font-medium">
            CAE: {invoiceResult.cae.slice(-6)}
          </span>
        )}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {nextStatus && nextLabel && (
        <button
          onClick={advanceStatus}
          disabled={loadingNext}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          {loadingNext ? 'Guardando...' : nextLabel}
        </button>
      )}
      <button
        onClick={cancelOrder}
        disabled={loadingCancel}
        className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
        title="Cancelar pedido"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
