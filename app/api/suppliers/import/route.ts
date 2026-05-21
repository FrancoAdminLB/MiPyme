import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/supabase/helpers'

interface ImportSupplier {
  name: string
  cuit?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  category?: string
  notes?: string
}

export async function POST(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { suppliers } = await req.json() as { suppliers: ImportSupplier[] }
  if (!suppliers?.length) return Response.json({ error: 'Sin proveedores' }, { status: 400 })

  const supabase = createClient()
  const orgId = ctx.organization.id

  const { data: existing } = await supabase
    .from('suppliers')
    .select('name')
    .eq('organization_id', orgId)

  const existingNames = new Set((existing ?? []).map((s) => s.name.toLowerCase().trim()))

  const toInsert = suppliers
    .filter((s) => s.name && !existingNames.has(s.name.toLowerCase().trim()))
    .map((s) => ({
      organization_id: orgId,
      name: s.name.trim(),
      cuit: s.cuit?.trim() || null,
      contact_name: s.contact_name?.trim() || null,
      contact_phone: s.contact_phone?.trim() || null,
      contact_email: s.contact_email?.trim() || null,
      category: s.category?.trim() || null,
      notes: s.notes?.trim() || null,
      active: true,
    }))

  const skipped = suppliers.length - toInsert.length
  if (!toInsert.length) return Response.json({ created: 0, skipped })

  const { error } = await supabase.from('suppliers').insert(toInsert)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ created: toInsert.length, skipped })
}
