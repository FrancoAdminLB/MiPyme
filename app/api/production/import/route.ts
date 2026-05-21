import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/supabase/helpers'

interface ImportBatch {
  batch_code: string
  product_name: string
  quantity_kg: number
  start_date: string | null
  end_date: string | null
  status: string
  notes: string
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { batches } = await req.json() as { batches: ImportBatch[] }
  if (!Array.isArray(batches) || !batches.length) return Response.json({ error: 'Sin lotes' }, { status: 400 })
  if (batches.length > 500) return Response.json({ error: 'Máximo 500 lotes por importación.' }, { status: 400 })

  const supabase = createClient()
  const orgId = ctx.organization.id
  const today = new Date().toISOString().split('T')[0]!

  const { data: existing } = await supabase
    .from('production_batches')
    .select('batch_code')
    .eq('organization_id', orgId)

  const existingCodes = new Set((existing ?? []).map((b) => b.batch_code.toLowerCase().trim()))

  const toInsert = batches
    .filter((b) => b.batch_code && b.product_name && !existingCodes.has(b.batch_code.toLowerCase().trim()))
    .map((b) => ({
      organization_id: orgId,
      batch_code: b.batch_code.trim(),
      product_name: b.product_name.trim(),
      product_type: b.product_name.trim(),
      quantity_kg: b.quantity_kg ?? 0,
      milk_liters_used: 0,
      start_date: b.start_date ?? today,
      end_date: b.end_date ?? null,
      status: b.status ?? 'completed',
      notes: b.notes?.trim() || null,
      created_by: ctx.profile.id,
    }))

  const skipped = batches.length - toInsert.length
  if (!toInsert.length) return Response.json({ created: 0, skipped })

  const { error } = await supabase.from('production_batches').insert(toInsert)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ created: toInsert.length, skipped })
}
