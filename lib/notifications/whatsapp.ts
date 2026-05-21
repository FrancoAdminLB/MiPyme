import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken  = process.env.TWILIO_AUTH_TOKEN
const from       = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (!accountSid || !authToken) {
    console.warn('[WhatsApp] Twilio no configurado — TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN faltantes.')
    return
  }

  const phone = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  try {
    const client = twilio(accountSid, authToken)
    await client.messages.create({ from, to: phone, body: message })
  } catch (err) {
    console.error('[WhatsApp] Error al enviar mensaje:', err)
  }
}

export function stockAlertMessage(orgName: string, items: { name: string; stock: number; min: number; unit: string }[]): string {
  const lines = items.map(i => `• ${i.name}: ${i.stock} ${i.unit} (mínimo ${i.min} ${i.unit})`).join('\n')
  return `⚠️ *${orgName} — Stock crítico*\n\nLos siguientes ítems están bajo el mínimo:\n\n${lines}\n\nIngresá a MiPyme para ver las órdenes de reposición generadas.`
}
