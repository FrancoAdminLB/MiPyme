import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatDate } from '@/lib/utils'
import { AlertTriangle, Clock } from 'lucide-react'
import { MovimientoForm } from '@/components/modules/inventario/movimiento-form'
import { EditItemForm } from '@/components/modules/inventario/edit-item-form'

const CATEGORY_LABELS: Record<string, string> = {
  materia_prima:    'Materias Primas',
  producto_terminado: 'Productos Terminados',
  material_empaque: 'Materiales de Empaque',
  insumo:           'Insumos',
}

export default async function InventarioPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id

  const today = new Date()
  const in30days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!

  const [itemsRes, movementsRes, suppliersRes] = await Promise.all([
    supabase.from('inventory_items').select('*, suppliers(name)').eq('organization_id', orgId).order('category'),
    supabase
      .from('inventory_movements')
      .select('*, inventory_items(name, unit)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('suppliers').select('*').eq('organization_id', orgId).eq('active', true).order('name'),
  ])

  const items     = itemsRes.data ?? []
  const movements = movementsRes.data ?? []
  const suppliers = suppliersRes.data ?? []

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category]!.push(item)
    return acc
  }, {})

  const expiringItems = items.filter(
    i => i.expiry_date && i.expiry_date <= in30days
  )

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-muted-foreground text-sm mt-1">Stock actual y movimientos</p>
        </div>
        <div className="flex gap-2">
          <EditItemForm suppliers={suppliers as never} mode="new" />
          <MovimientoForm items={items as never} />
        </div>
      </div>

      {/* Alertas de vencimiento */}
      {expiringItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <Clock className="h-4 w-4" />
              {expiringItems.length} ítem{expiringItems.length > 1 ? 's' : ''} por vencer en 30 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {expiringItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm text-orange-700">
                  <span className="font-medium">{item.name}</span>
                  <span>Vence: {formatDate(item.expiry_date ?? '')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock por categoría */}
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">{CATEGORY_LABELS[category] ?? category}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-3 pr-4 font-medium">Ítem</th>
                  <th className="text-left pb-3 pr-4 font-medium">Proveedor</th>
                  <th className="text-right pb-3 pr-4 font-medium">Stock actual</th>
                  <th className="text-right pb-3 pr-4 font-medium">Mínimo</th>
                  <th className="text-left pb-3 pr-4 font-medium">Vencimiento</th>
                  <th className="text-left pb-3 pr-4 font-medium">Estado</th>
                  <th className="text-left pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categoryItems.map(item => {
                  const isLow     = item.current_stock < item.min_stock
                  const isExpiring = item.expiry_date && item.expiry_date <= in30days
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">{item.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {(item as { suppliers?: { name: string } | null }).suppliers?.name ?? '—'}
                      </td>
                      <td className={`py-3 pr-4 text-right font-semibold ${isLow ? 'text-red-600' : ''}`}>
                        {formatNumber(item.current_stock, 1)} {item.unit}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">
                        {formatNumber(item.min_stock, 1)} {item.unit}
                      </td>
                      <td className={`py-3 pr-4 text-sm ${isExpiring ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                        {item.expiry_date ? formatDate(item.expiry_date) : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        {isLow ? (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" /> Stock bajo
                          </span>
                        ) : isExpiring ? (
                          <span className="flex items-center gap-1 text-xs text-orange-600">
                            <Clock className="h-3 w-3" /> Por vencer
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">OK</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <EditItemForm item={item as never} suppliers={suppliers as never} mode="edit" />
                          <MovimientoForm items={items as never} preselectedItem={item as never} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      {/* Últimos movimientos */}
      {movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-3 pr-4 font-medium">Ítem</th>
                  <th className="text-left pb-3 pr-4 font-medium">Tipo</th>
                  <th className="text-right pb-3 pr-4 font-medium">Cantidad</th>
                  <th className="text-left pb-3 pr-4 font-medium">Referencia</th>
                  <th className="text-left pb-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 font-medium">
                      {(m.inventory_items as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.movement_type === 'entrada' ? 'bg-green-100 text-green-700' :
                        m.movement_type === 'salida'  ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                      }`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      {m.movement_type === 'entrada' ? '+' : m.movement_type === 'salida' ? '−' : '='}
                      {formatNumber(m.quantity, 1)}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{m.reference ?? '—'}</td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {!items.length && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay ítems de inventario registrados.
        </p>
      )}
    </div>
  )
}
