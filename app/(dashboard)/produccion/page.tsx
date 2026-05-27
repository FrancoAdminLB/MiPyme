import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NuevoLoteButton } from '@/components/modules/produccion/nuevo-lote-button'
import { ImportProduccionButton } from '@/components/modules/produccion/import-produccion-button'
import { ProductTemplatesWizard } from '@/components/modules/produccion/product-templates-wizard'
import { BatchesTable } from '@/components/modules/produccion/batches-table'
import { AreaSetupBanner } from '@/components/modules/configuracion/area-setup-banner'
import Link from 'next/link'
import { Printer } from 'lucide-react'

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
      .limit(200),
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

  const productTypes      = config.product_types ?? []
  const hasTemplates      = Object.keys(config.product_templates ?? {}).length > 0
  const showTemplatesBanner = productTypes.length > 0 && !hasTemplates

  return (
    <div className="p-8 space-y-6">

      {/* Banner encargado de área */}
      <AreaSetupBanner
        area="produccion"
        areaLabel="Producción"
        orgId={orgId}
        currentConfig={config}
      />

      {/* Banner primera vez — configurar plantillas */}
      {showTemplatesBanner && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
          <div>
            <p className="text-sm font-medium">Agilizá el trabajo de tus operarios</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configurá los valores típicos por producto (marca de fermento, cuajo, cantidades, etc.) y se pre-cargarán automáticamente al crear cada lote.
            </p>
          </div>
          <ProductTemplatesWizard config={config} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Producción</h1>
          <p className="text-muted-foreground text-sm mt-1">Registro de lotes y trazabilidad</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/produccion/imprimir`}
            target="_blank"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors"
          >
            <Printer className="h-4 w-4" /> Imprimir turno
          </Link>
          <ImportProduccionButton />
          <NuevoLoteButton config={config} batches={batches as never} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lotes registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchesTable
            batches={batches as never}
            items={items as never}
            inputs={inputs as never}
            config={config}
            inputLabel={inputLabel}
            outputLabel={outputLabel}
          />
        </CardContent>
      </Card>
    </div>
  )
}
