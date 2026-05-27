import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_SIZES          = ['micro', 'small', 'medium', 'medium2']
const VALID_ITEM_CATS      = ['materia_prima', 'insumo', 'material_empaque', 'producto_terminado']
const VALID_SUPPLIER_CATS  = ['materia_prima', 'insumo', 'empaque', 'servicios', 'otros']

export async function POST(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const body = await req.json()
  const { industryConfig, industry, company_size, notification_phone } = body

  const initialItems:     unknown[] = Array.isArray(body.initialItems)     ? body.initialItems.slice(0, 50)     : []
  const initialSuppliers: unknown[] = Array.isArray(body.initialSuppliers) ? body.initialSuppliers.slice(0, 30) : []

  if (!industryConfig || typeof industryConfig !== 'object') {
    return NextResponse.json({ error: 'Configuración inválida' }, { status: 400 })
  }

  // Guardar config de la industria y marcar onboarding como completo
  const updates: Record<string, unknown> = {
    industry_config: industryConfig,
    onboarding_completed: true,
  }
  if (industry) updates.industry = industry
  if (company_size && VALID_SIZES.includes(String(company_size))) updates.company_size = company_size
  if (notification_phone && typeof notification_phone === 'string') {
    updates.notification_phone = notification_phone.trim().slice(0, 30)
  }

  const { error: orgError } = await supabaseAdmin
    .from('organizations')
    .update(updates)
    .eq('id', profile.organization_id)

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 400 })

  // Insertar proveedores y construir mapa nombre → id
  const supplierNameToId = new Map<string, string>()

  if (initialSuppliers.length > 0) {
    const suppliersToInsert = (initialSuppliers as Record<string, unknown>[])
      .filter(s => typeof s.name === 'string' && s.name.trim())
      .map(s => ({
        organization_id: profile.organization_id,
        name:         String(s.name).trim().slice(0, 120),
        cuit:         typeof s.cuit === 'string' && s.cuit.trim() ? s.cuit.trim().slice(0, 20) : null,
        category:     VALID_SUPPLIER_CATS.includes(String(s.category)) ? String(s.category) : 'otros',
        contact_name: typeof s.contact_name === 'string' && s.contact_name.trim() ? s.contact_name.trim().slice(0, 80) : null,
        notes:        typeof s.notes === 'string' && s.notes.trim() ? s.notes.trim().slice(0, 300) : null,
        active:       true,
      }))

    if (suppliersToInsert.length > 0) {
      const { data: insertedSuppliers } = await supabaseAdmin
        .from('suppliers')
        .insert(suppliersToInsert)
        .select('id, name')

      if (insertedSuppliers) {
        for (const s of insertedSuppliers as { id: string; name: string }[]) {
          supplierNameToId.set(s.name, s.id)
        }
      }
    }
  }

  // Insertar ítems iniciales de inventario
  if (initialItems.length > 0) {
    const itemsToInsert = (initialItems as Record<string, unknown>[])
      .filter(i => typeof i.name === 'string' && i.name.trim())
      .map(i => {
        const supplierName = typeof i.supplier_name === 'string' ? i.supplier_name.trim() : ''
        const supplierId   = supplierName ? (supplierNameToId.get(supplierName) ?? null) : null
        return {
          organization_id: profile.organization_id,
          name:          String(i.name).trim().slice(0, 120),
          unit:          typeof i.unit === 'string' ? i.unit.slice(0, 20) : 'unidad',
          current_stock: Math.max(0, Math.min(Number(i.current_stock) || 0, 999_999_999)),
          min_stock:     Math.max(0, Math.min(Number(i.min_stock) || 0, 999_999_999)),
          category:      VALID_ITEM_CATS.includes(String(i.category)) ? String(i.category) : 'insumo',
          supplier_id:   supplierId,
        }
      })

    if (itemsToInsert.length > 0) {
      await supabaseAdmin.from('inventory_items').insert(itemsToInsert)
    }
  }

  return NextResponse.json({ ok: true })
}
