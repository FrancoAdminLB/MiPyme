import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { formatNumber, formatDate } from '@/lib/utils'
import { PrintButton } from '@/components/modules/ordenes/print-button'
import type { IndustryConfig, CustomField } from '@/types'

export default async function ImprimirProduccionPage({
  searchParams,
}: {
  searchParams: { fecha?: string; status?: string }
}) {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id
  const fecha = searchParams.fecha ?? new Date().toISOString().split('T')[0]
  const status = searchParams.status

  let query = supabase
    .from('production_batches')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  } else {
    // Por defecto: lotes del día (iniciados o completados hoy)
    query = query.or(`start_date.eq.${fecha},end_date.eq.${fecha}`)
  }

  const { data: batches } = await query

  const { data: inputsData } = await supabase
    .from('production_batch_inputs')
    .select('*, inventory_items(name, unit)')
    .eq('organization_id', orgId)

  if (!batches?.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        Sin lotes para imprimir el {formatDate(fecha)}.
      </div>
    )
  }

  const config: IndustryConfig = ctx.organization.industry_config ?? {}
  const stages = config.stages ?? []
  const fields: CustomField[] = config.custom_fields ?? []
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const fechaLabel = new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Roles para firma — si hay etapas, usarlas; sino, firmas genéricas
  const firmaRoles = stages.length > 0
    ? stages
    : ['Operario responsable', 'Supervisor de turno', 'Control de calidad']

  return (
    <>
      <PrintButton />
      <div className="max-w-4xl mx-auto p-8 font-sans text-gray-900 print:p-4">

        {/* Header empresa */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
          <div>
            <h1 className="text-2xl font-bold">{ctx.organization.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Resumen de producción — {fechaLabel}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Impreso: {today}</p>
            <p className="mt-1">{batches.length} lote{batches.length !== 1 ? 's' : ''}</p>
            <p className="mt-1 font-semibold text-gray-700">
              Total: {formatNumber(batches.reduce((s, b) => s + (b.quantity_kg ?? 0), 0), 1)} kg
            </p>
          </div>
        </div>

        {/* Resumen tabla */}
        <table className="w-full text-sm mb-10 border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600 border-b border-gray-200">Código</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 border-b border-gray-200">Producto</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 border-b border-gray-200">
                {config.input_label || 'Entrada'}
              </th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 border-b border-gray-200">
                {config.output_label || 'Producción (kg)'}
              </th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 border-b border-gray-200">Rend.</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 border-b border-gray-200">Estado</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id} className="border-b border-gray-100">
                <td className="px-3 py-2 font-mono text-xs">{b.batch_code}</td>
                <td className="px-3 py-2 font-medium">{b.product_name}</td>
                <td className="px-3 py-2 text-right">{formatNumber(b.input_quantity, 0)}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatNumber(b.quantity_kg, 1)} kg</td>
                <td className="px-3 py-2 text-right">{formatNumber(b.yield_percentage, 2)}%</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'completed'   ? 'bg-green-100 text-green-700' :
                    b.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                 'bg-gray-100 text-gray-600'
                  }`}>
                    {b.status === 'completed' ? 'Completado' : b.status === 'in_progress' ? 'En proceso' : 'Cancelado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Detalle por lote */}
        <div className="space-y-10">
          {batches.map((b) => {
            const customData = (b.custom_data ?? {}) as Record<string, unknown>
            const batchInputs = (inputsData ?? []).filter(i => i.batch_id === b.id)

            // Agrupar campos por etapa
            const fieldsByStage: Record<string, CustomField[]> = {}
            for (const f of fields) {
              const stage = f.stage ?? 'General'
              if (!fieldsByStage[stage]) fieldsByStage[stage] = []
              fieldsByStage[stage].push(f)
            }

            return (
              <div key={b.id} className="border border-gray-200 rounded-lg p-6 print:break-inside-avoid">
                {/* Cabecera del lote */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">{b.batch_code}</p>
                    <h2 className="text-xl font-bold mt-0.5">{b.product_name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Inicio: {formatDate(b.start_date)}
                      {b.end_date && ` · Fin: ${formatDate(b.end_date)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(b.quantity_kg, 1)} <span className="text-base font-normal text-gray-400">kg</span></p>
                    <p className="text-sm text-gray-500">Rendimiento: {formatNumber(b.yield_percentage, 2)}%</p>
                    {b.notes && <p className="text-xs text-gray-400 mt-1 max-w-48 text-right">{b.notes}</p>}
                  </div>
                </div>

                {/* Insumos usados */}
                {batchInputs.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Insumos utilizados</p>
                    <div className="grid grid-cols-3 gap-2">
                      {batchInputs.map(inp => {
                        const item = inp.inventory_items as { name: string; unit: string } | null
                        return (
                          <div key={inp.id} className="bg-gray-50 rounded px-3 py-2">
                            <p className="text-xs font-medium">{item?.name ?? inp.item_id}</p>
                            <p className="text-sm font-semibold">{formatNumber(inp.quantity_used, 2)} {item?.unit ?? ''}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Campos custom por etapa */}
                {Object.keys(fieldsByStage).length > 0 && (
                  <div className="space-y-4">
                    {Object.entries(fieldsByStage).map(([stage, stageFields]) => {
                      const filledFields = stageFields.filter(f => customData[f.key] !== undefined && customData[f.key] !== null && customData[f.key] !== '')
                      if (filledFields.length === 0) return null
                      return (
                        <div key={stage}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">
                            {stage}
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {filledFields.map(f => (
                              <div key={f.key}>
                                <p className="text-xs text-gray-400">{f.label}</p>
                                <p className="text-sm font-semibold">
                                  {String(customData[f.key] ?? '—')}
                                  {f.unit ? ` ${f.unit}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Sección de firmas */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Firmas y conformidades</p>
                  <div className={`grid gap-8 ${firmaRoles.length <= 2 ? 'grid-cols-2' : firmaRoles.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {firmaRoles.map(role => (
                      <div key={role}>
                        <div className="border-b-2 border-gray-400 mb-2 h-10" />
                        <p className="text-xs text-gray-500 font-medium">{role}</p>
                        <p className="text-xs text-gray-300 mt-0.5">Aclaración: ___________________</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          {ctx.organization.name} · Resumen de producción {fechaLabel} · Generado con MiPyme
        </div>
      </div>
    </>
  )
}
