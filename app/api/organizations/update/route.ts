import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { INDUSTRIES } from '@/lib/industries'
import type { Industry } from '@/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: Request) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden editar la organización' }, { status: 403 })
  }

  const { name, industry, language, notification_phone } = await req.json()

  // Obtener org actual para preservar config existente
  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('industry, industry_config')
    .eq('id', profile.organization_id)
    .single()

  const updates: Record<string, unknown> = {
    name,
    industry,
    notification_phone: notification_phone?.trim() || null,
  }

  if (currentOrg && currentOrg.industry !== industry) {
    // Cambio de industria: aplicar defaultConfig preservando el idioma actual
    const industryMeta = INDUSTRIES[industry as Industry]
    if (industryMeta) {
      updates.industry_config = {
        ...industryMeta.defaultConfig,
        language: language ?? currentOrg.industry_config?.language ?? 'es_AR',
      }
    }
  } else if (language) {
    // Solo cambio de idioma: actualizar dentro del config existente
    updates.industry_config = {
      ...(currentOrg?.industry_config ?? {}),
      language,
    }
  }

  const { error } = await supabaseAdmin
    .from('organizations')
    .update(updates)
    .eq('id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
