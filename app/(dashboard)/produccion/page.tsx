import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NuevoLoteButton } from '@/components/modules/produccion/nuevo-lote-button'
import { ImportProduccionButton } from '@/components/modules/produccion/import-produccion-button'
import { ProductTemplatesWizard } from '@/components/modules/produccion/product-templates-wizard'
import { BatchesTable } from '@/components/modules/produccion/batches-table'
import { AreaSetupBanner } from '@/components/modules/configuracion/area-setup-banner'
import Link from 'next/link'
import { Printer, AlertCircle, PackageSearch } from 'lucide-react'

export default async function ProduccionPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id

  const [batchesRes, itemsRes, inputsRes, pedidosRes] = await Promise.all([
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
    supabase
      .from('sales_orders')
      .select('id, sales_order_items(product_name, quantity, unit)')
      .eq('organization_id', orgId)
      .in('status', ['pending', 'confirmed', 'preparing']),
  ])

  const batches = batchesRes.data ?? []
  const items   = itemsRes.data ?? []
  const inputs  = inputsRes.data ?? []
  const pedidos = pedidosRes.data ?? []

  const config      = ctx.organization.industry_config ?? {}
  const inputLabel  = config.input_label  || 'Insumo principal'
  const outputLabel = config.output_label || 'Producción (kg)'

  const productTypes      = config.product_types ?? []
  const hasTemplates      = Object.keys(config.product_templates ?? {}).length > 0
  const showTemplatesBanner = productTypes.length > 0 && !hasTemplates

  // Automatización 1: productos con pedidos pendientes sin lote activo
  const activeBatchProducts = new Set(
    batches.filter(b => b.status === 'in_progress').map(b => b.product_name.toLowerCase())
  )
  const pendingByProduct = new Map<string, number>()
  for (const pedido of pedidos) {
    const orderItems = pedido.sales_order_items as { product_name: string; quantity: number; unit: string }[] | null
    for (const item of orderItems ?? []) {
      const key = item.product_name
      pendingByProduct.set(key, (pendingByProduct.get(key) ?? 0) + item.quantity)
    }
  }
  const productosAPlanificar = Array.from(pendingByProduct.entries())
    .filter(([name]) => !activeBatchProducts.has(name.toLowerCase()))
    .sort((a, b) => b[1] - a[1])

  // Automatización 2: lotes en proceso sin insumos registrados
  const batchesConInputs = new Set(inputs.map(i => i.batch_id))
  const lotesSinInsumos = batches.filter(
    b => b.status === 'in_progress' && !batchesConInputs.has(b.id)
  )

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
              Configurá los valores típicos por producto y se pre-cargarán automáticamente al crear cada lote.
            </p>
          </div>
          <ProductTemplatesWizard config={config} />
        </div>
      )}

      {/* Automatización 1: qué producir según pedidos pendientes */}
      {productosAPlanificar.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">
              Productos con pedidos pendientes sin lote activo
            </p>
            <div className="flex flex-wrap gap-2">
              {productosAPlanificar.map(([product, qty]) => (
                <span
                  key={product}
                  className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-full font-medium"
                >
                  {product} — {qty % 1 === 0 ? qty : qty.toFixed(1)} unid. pendientes
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automatización 2: lotes sin insumos registrados */}
      {lotesSinInsumos.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-1.5">
              <PackageSearch className="h-4 w-4" />
              {lotesSinInsumos.length === 1
                ? '1 lote en proceso sin insumos registrados'
                : `${lotesSinInsumos.length} lotes en proceso sin insumos registrados`}
            </p>
            <div className="flex flex-wrap gap-2">
              {lotesSinInsumos.map(b => (
                <span
                  key={b.id}
                  className="text-xs bg-white border border-orange-200 text-orange-700 px-3 py-1 rounded-full font-mono"
                >
                  {b.batch_code} · {b.product_name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
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
          <NuevoLoteButton config={config} batches={batches as never} pendingOrders={pendingByProduct as never} />
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
