import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { evaluateAlerts } from '@/lib/alerts/engine'
import { sendWhatsApp, stockAlertMessage } from '@/lib/notifications/whatsapp'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/alertas/notify
 * Invocado por el cron de Vercel cada 6 horas.
 * Evalúa alertas de todas las orgs y envía notificaciones WhatsApp si hay críticas.
 */
export async function GET(req: Request) {
  // Verificar que viene del cron de Vercel (o que es una llamada interna)
  const authHeader = req.headers.get('authorization')
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: orgs } = await supabaseAdmin
    .from('organizations')
    .select('id, name, notification_phone')

  if (!orgs?.length) return NextResponse.json({ processed: 0 })

  let notified = 0

  for (const org of orgs) {
    if (!org.notification_phone) continue

    const alerts = await evaluateAlerts(org.id)
    const criticals = alerts.filter(a => a.severity === 'critical')

    if (!criticals.length) continue

    // Agrupar alertas de stock para el mensaje
    const stockItems = criticals
      .filter(a => a.module === 'inventario')
      .map(a => ({
        name:  a.ruleName,
        stock: a.value,
        min:   a.threshold,
        unit:  '',
      }))

    const message = stockItems.length
      ? stockAlertMessage(org.name, stockItems)
      : `⚠️ *${org.name} — Alertas críticas*\n\n${criticals.map(a => `• ${a.message}`).join('\n')}\n\nIngresá a MiPyme para revisar.`

    await sendWhatsApp(org.notification_phone, message)
    notified++
  }

  return NextResponse.json({ processed: orgs.length, notified })
}
