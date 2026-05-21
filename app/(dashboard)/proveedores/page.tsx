import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProveedoresTable } from '@/components/modules/proveedores/proveedores-table'

export default async function ProveedoresPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', ctx.organization.id)
    .eq('active', true)
    .order('name')

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de proveedores y trazabilidad de insumos
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {suppliers?.length ?? 0} proveedores activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProveedoresTable suppliers={suppliers ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
