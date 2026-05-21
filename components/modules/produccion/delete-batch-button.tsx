'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

interface DeleteBatchButtonProps {
  batchId: string
  batchCode: string
}

export function DeleteBatchButton({ batchId, batchCode }: DeleteBatchButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar el lote ${batchCode}? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('production_batches').delete().eq('id', batchId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Eliminar lote"
      className="text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
