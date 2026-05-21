import { createClient } from '@/lib/supabase/server'
import { getSystemPrompt } from '@/lib/ai/prompts'
import Anthropic from '@anthropic-ai/sdk'
import type { Industry } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('No autorizado', { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organizations(industry)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return new Response('Perfil no encontrado', { status: 404 })
  }

  const orgId   = profile.organization_id
  const industry = ((profile.organizations as unknown as { industry: Industry } | null)?.industry) ?? 'dairy'

  // Cargar contexto operativo en tiempo real
  const [batchesRes, ordersRes, stockRes, alertsRes] = await Promise.all([
    supabase
      .from('production_batches')
      .select('batch_code, product_name, status, quantity_kg, yield_percentage, start_date')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('purchase_orders')
      .select('quantity_requested, status, inventory_items(name, unit)')
      .eq('organization_id', orgId)
      .in('status', ['pending', 'sent'])
      .limit(10),
    supabase
      .from('inventory_items')
      .select('name, current_stock, min_stock, unit')
      .eq('organization_id', orgId)
      .order('current_stock')
      .limit(20),
    supabase
      .from('alert_rules')
      .select('name, metric, operator, threshold, active')
      .eq('organization_id', orgId)
      .eq('active', true),
  ])

  const batches = batchesRes.data ?? []
  const orders  = ordersRes.data ?? []
  const stock   = stockRes.data ?? []
  const alertRules = alertsRes.data ?? []
  const stockCritical = stock.filter(i => i.current_stock < i.min_stock)

  const liveContext = `
DATOS EN TIEMPO REAL (hoy):

Lotes recientes (${batches.length}):
${batches.map(b => `- ${b.batch_code}: ${b.product_name} | ${b.status === 'in_progress' ? 'En proceso' : b.status === 'completed' ? 'Completado' : 'Cancelado'} | ${b.quantity_kg} kg | Rendimiento: ${b.yield_percentage ?? 'N/A'}%`).join('\n') || '- Sin lotes registrados'}

Órdenes de compra pendientes (${orders.length}):
${orders.map(o => `- ${(o.inventory_items as unknown as {name:string;unit:string}|null)?.name ?? '?'}: ${o.quantity_requested} ${(o.inventory_items as unknown as {name:string;unit:string}|null)?.unit ?? ''} — ${o.status}`).join('\n') || '- Sin órdenes pendientes'}

Stock crítico bajo mínimo (${stockCritical.length}):
${stockCritical.map(i => `- ${i.name}: ${i.current_stock} / mínimo ${i.min_stock} ${i.unit}`).join('\n') || '- Todo el inventario sobre el mínimo'}

Reglas de alerta activas (${alertRules.length}):
${alertRules.map(r => `- ${r.name}: ${r.metric} ${r.operator} ${r.threshold}`).join('\n') || '- Sin reglas configuradas'}
`

  const basePrompt = getSystemPrompt(industry)
  const systemPrompt = `${basePrompt}\n\n${liveContext}`

  const { messages } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  if (!Array.isArray(messages) || messages.length > 40)
    return new Response('Demasiados mensajes en el contexto.', { status: 400 })

  // Truncar mensajes largos para evitar abuso
  const sanitizedMessages = messages.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content.slice(0, 4000) : '',
  }))

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: sanitizedMessages,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
