import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/supabase/helpers'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (ctx.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden modificar la configuración fiscal.' }, { status: 403 })
  }

  const body = await req.json()

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({ fiscal_config: body })
    .eq('id', ctx.organization.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
