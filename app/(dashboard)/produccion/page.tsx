import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatDate } from '@/lib/utils'
import { NuevoLoteButton } from '@/components/modules/produccion/nuevo-lote-button'
import { ImportProduccionButton } from '@/components/modules/produccion/import-produccion-button'
import { BatchInputsForm } from '@/components/modules/produccion/batch-inputs-form'
import { BatchStatusButton } from '@/components/modules/produccion/batch-status-button'
import { EditBatchForm } from '@/components/modules/produccion/edit-batch-form'
import { BatchDetailButton } from '@/components/modules/produccion/batch-detail-button'
import { DeleteBatchButton } from '@/components/modules/produccion/delete-batch-button'
import type { CustomField, IndustryConfig } from '@/types'

function getComplianceBadge(customData: Record<string, unknown> | null, config: IndustryConfig) {
  const fields: CustomField[] = config.custom_fields ?? []
  const required = fields.filter(f => f.required)
  if (required.length === 0) return null

  const data = customData ?? {}
  const missing = required.filter(f => data[f.key] === undefined || data[f.key] === null || data[f.key] === '')
  const outOfRange = fields
    .filter(f => f.compliance_ref && f.type === 'number' && (f.min_value !== undefined || f.max_value !== undefined))
    .filter(f => {
      const val = parseFloat(String(data[f.key] ?? ''))
      if (isNaN(val)) return false
      if (f.min_value !== undefined && val < f.min_value) return true
      if (f.max_value !== undefined && val > f.max_value) return true
      return false
    })

  if (outOfRange.length > 0) return { status: 'error', text: 'Fuera de norma', color: 'text-red-600' }
  if (missing.length > 0) return { status: 'warn', text: `${missing.length} campo${missing.length > 1 ? 's' : ''} pendiente${missing.length > 1 ? 's' : ''}`, color: 'text-amber-600' }
  return { status: 'ok', text: 'Normativa OK', color: 'text-green-600' }
}

export default async function ProduccionPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id

  const [batchesRes, itemsRes, inputsRes] = await Promise.all([
    supabase
      .from('production_batches')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('inventory_items')
      .select('*')
      .eq('organization_id', orgId)
      .eq('category', 'materia_prima'),
    supabase
      .from('production_batch_inputs')
      .select('*, inventory_items(name, unit)')
      .eq('organization_id', orgId),
  ])

  const batches = batchesRes.data ?? []
  const items   = itemsRes.data ?? []
  const inputs  = inputsRes.data ?? []

  const config      = ctx.organization.industry_config ?? {}
  const inputLabel  = config.input_label  || 'Insumo principal'
  const outputLabel = config.output_label || 'Producción (kg)'

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Producción</h1>
          <p className="text-muted-foreground text-sm mt-1">Registro de lotes y trazabilidad</p>
        </div>
        <div className="flex gap-2">
          <ImportProduccionButton />
          <NuevoLoteButton config={config} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lotes registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {!batches.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay lotes registrados. ¡Creá el primero!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left pb-3 pr-4 font-medium">Código</th>
                    <th className="text-left pb-3 pr-4 font-medium">Producto</th>
                    <th className="text-right pb-3 pr-4 font-medium">{outputLabel}</th>
                    <th className="text-right pb-3 pr-4 font-medium">{inputLabel}</th>
                    <th className="text-right pb-3 pr-4 font-medium">Rendimiento</th>
                    <th className="text-left pb-3 pr-4 font-medium">Inicio</th>
                    <th className="text-left pb-3 pr-4 font-medium">Insumos</th>
                    <th className="text-left pb-3 pr-4 font-medium">Estado</th>
                    <th className="text-left pb-3 pr-4 font-medium">Normativa</th>
                    <th className="text-left pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b) => {
                    const batchInputs = inputs.filter(i => i.batch_id === b.id)
                    const compBadge = b.status === 'in_progress' ? getComplianceBadge(b.custom_data as Record<string, unknown> | null, config) : null
                    return (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-mono text-xs">{b.batch_code}</td>
                        <td className="py-3 pr-4 font-medium">{b.product_name}</td>
                        <td className="py-3 pr-4 text-right">{formatNumber(b.quantity_kg, 1)}</td>
                        <td className="py-3 pr-4 text-right">{formatNumber(b.input_quantity, 0)}</td>
                        <td className="py-3 pr-4 text-right font-medium">{formatNumber(b.yield_percentage, 2)}%</td>
                        <td className="py-3 pr-4">{formatDate(b.start_date)}</td>
                        <td className="py-3 pr-4">
                          <BatchInputsForm
                            batchId={b.id}
                            batchCode={b.batch_code}
                            items={items as never}
                            existingInputs={batchInputs as never}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            b.status === 'completed'   ? 'bg-green-100 text-green-700' :
                            b.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                         'bg-gray-100 text-gray-600'
                          }`}>
                            {b.status === 'completed'   ? 'Completado' :
                             b.status === 'in_progress' ? 'En proceso' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {compBadge && (
                            <span className={`text-xs font-medium ${compBadge.color}`} title={compBadge.text}>
                              {compBadge.status === 'ok' && '✓ '}
                              {compBadge.status === 'warn' && '⚠ '}
                              {compBadge.status === 'error' && '✕ '}
                              {compBadge.text}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <BatchDetailButton batch={b as never} config={config} />
                            <EditBatchForm batch={b} config={config} />
                            <BatchStatusButton
                              batchId={b.id}
                              currentStatus={b.status}
                              productName={b.product_name}
                              quantityKg={b.quantity_kg}
                              customData={b.custom_data as Record<string, unknown> | undefined}
                              config={config}
                            />
                            <DeleteBatchButton batchId={b.id} batchCode={b.batch_code} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
