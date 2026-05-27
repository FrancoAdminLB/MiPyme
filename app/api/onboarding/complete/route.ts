import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  const initialItems: unknown[] = Array.isArray(body.initialItems) ? body.initialItems.slice(0, 50) : []

  if (!industryConfig || typeof industryConfig !== 'object') {
    return NextResponse.json({ error: 'Configuración inválida' }, { status: 400 })
  }

  const VALID_SIZES = ['micro', 'small', 'medium', 'medium2']

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

  // Insertar ítems iniciales de inventario si se proporcionaron
  if (initialItems.length > 0) {
    const VALID_CATEGORIES = ['materia_prima', 'insumo', 'material_empaque', 'producto_terminado']
    const itemsToInsert = (initialItems as Record<string, unknown>[])
      .filter(i => typeof i.name === 'string' && i.name.trim())
      .map(i => ({
        organization_id: profile.organization_id,
        name: String(i.name).trim().slice(0, 120),
        unit: typeof i.unit === 'string' ? i.unit.slice(0, 20) : 'unidad',
        current_stock: Math.max(0, Math.min(Number(i.current_stock) || 0, 999_999_999)),
        min_stock: Math.max(0, Math.min(Number(i.min_stock) || 0, 999_999_999)),
        category: VALID_CATEGORIES.includes(String(i.category)) ? String(i.category) : 'insumo',
      }))

    if (itemsToInsert.length > 0) {
      await supabaseAdmin.from('inventory_items').insert(itemsToInsert)
    }
  }

  return NextResponse.json({ ok: true })
}
