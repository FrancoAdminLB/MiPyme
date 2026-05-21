import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { INDUSTRIES } from '@/lib/industries'
import type { Industry } from '@/types'

// Cliente admin con service_role — bypasea RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { orgName, fullName, email, password, industry = 'dairy' } = body

  // Validación de inputs
  if (!orgName || typeof orgName !== 'string' || orgName.trim().length < 2 || orgName.trim().length > 100)
    return NextResponse.json({ error: 'Nombre de empresa inválido (2–100 caracteres).' }, { status: 400 })
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100)
    return NextResponse.json({ error: 'Nombre completo inválido.' }, { status: 400 })
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
  if (!password || typeof password !== 'string' || password.length < 8)
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })

  const slug = orgName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const industryMeta = INDUSTRIES[industry as Industry]
  const industry_config = industryMeta?.defaultConfig ?? INDUSTRIES['dairy'].defaultConfig

  // 1. Crear organización con service_role (bypasea RLS)
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ name: orgName, slug, industry, plan: 'free', industry_config })
    .select('id')
    .single()

  if (orgError) {
    return NextResponse.json(
      { error: orgError.message },
      { status: 400 }
    )
  }

  // 2. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: org.id,
      role: 'admin',
    },
  })

  if (authError) {
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 3. Crear profile explícitamente (por si el trigger falla)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authData.user.id,
      organization_id: org.id,
      email,
      full_name: fullName,
      role: 'admin',
    })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ userId: authData.user.id, orgId: org.id })
}
