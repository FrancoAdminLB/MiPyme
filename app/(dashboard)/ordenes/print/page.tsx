import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { formatNumber, formatDate } from '@/lib/utils'
import { PrintButton } from '@/components/modules/ordenes/print-button'

export default async function PrintOrdenesPage({
  searchParams,
}: {
  searchParams: { ids?: string; status?: string }
}) {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const supabase = createClient()
  const orgId = ctx.organization.id

  const ids = searchParams.ids?.split(',').filter(Boolean)

  let query = supabase
    .from('purchase_orders')
    .select('*, inventory_items(name, unit), suppliers(name, contact_phone, contact_email, cuit)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (ids?.length) {
    query = query.in('id', ids)
  } else if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  } else {
    query = query.in('status', ['pending', 'sent'])
  }

  const { data: orders } = await query

  if (!orders?.length) {
    return <div className="p-8 text-center text-gray-500">Sin órdenes para imprimir.</div>
  }

  const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <PrintButton />
      <div className="max-w-3xl mx-auto p-8 font-sans text-gray-900 print:p-0">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-900">
          <div>
            <h1 className="text-2xl font-bold">{ctx.organization.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Órdenes de compra</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{today}</p>
            <p className="mt-1">{orders.length} orden{orders.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>

        {/* Órdenes */}
        <div className="space-y-8">
          {orders.map((o, idx) => {
            const item     = o.inventory_items as { name: string; unit: string } | null
            const supplier = o.suppliers as { name: string; contact_phone?: string; contact_email?: string; cuit?: string } | null

            return (
              <div key={o.id} className="border border-gray-200 rounded-lg p-6 print:break-inside-avoid">
                {/* Número de orden */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                    Orden #{String(idx + 1).padStart(3, '0')} · {o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    o.status === 'sent'    ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {o.status === 'pending' ? 'Pendiente' : o.status === 'sent' ? 'Enviada' : o.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Ítem solicitado */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Ítem solicitado</p>
                    <p className="text-lg font-bold">{item?.name ?? '—'}</p>
                    <p className="text-2xl font-mono font-bold text-gray-900 mt-1">
                      {formatNumber(o.quantity_requested, 1)} <span className="text-base font-normal text-gray-500">{item?.unit}</span>
                    </p>
                    {o.stock_at_creation != null && (
                      <p className="text-xs text-gray-400 mt-2">
                        Stock al crear: {formatNumber(o.stock_at_creation, 1)} / mínimo {formatNumber(o.min_stock_at_creation, 1)} {item?.unit}
                      </p>
                    )}
                  </div>

                  {/* Proveedor */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Proveedor</p>
                    {supplier ? (
                      <div className="space-y-1">
                        <p className="font-semibold">{supplier.name}</p>
                        {supplier.cuit && <p className="text-sm text-gray-500">CUIT: {supplier.cuit}</p>}
                        {supplier.contact_phone && <p className="text-sm text-gray-500">Tel: {supplier.contact_phone}</p>}
                        {supplier.contact_email && <p className="text-sm text-gray-500">{supplier.contact_email}</p>}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Sin proveedor asignado</p>
                    )}
                  </div>
                </div>

                {o.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Notas</p>
                    <p className="text-sm text-gray-600">{o.notes}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                  <span>Creada: {formatDate(o.created_at)}</span>
                  {o.triggered_by === 'auto' && <span>⚡ Generada automáticamente</span>}
                </div>

                {/* Firma */}
                <div className="mt-6 grid grid-cols-2 gap-8 print:mt-8">
                  <div>
                    <div className="border-t border-gray-300 pt-2">
                      <p className="text-xs text-gray-400">Firma solicitante</p>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-gray-300 pt-2">
                      <p className="text-xs text-gray-400">Firma proveedor / Acuse de recibo</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center print:mt-4">
          {ctx.organization.name} · Generado con MiPyme · {today}
        </div>
      </div>
    </>
  )
}
