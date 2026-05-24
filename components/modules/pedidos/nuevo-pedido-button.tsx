'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Trash2 } from 'lucide-react'

interface OrderItem {
  product_name: string
  item_id: string   // id del inventory_item (producto_terminado), vacío si no aplica
  quantity: string
  unit: string
  unit_price: string
}

interface InventoryProduct {
  id: string
  name: string
  unit: string
  current_stock: number
}

const EMPTY_ITEM: OrderItem = { product_name: '', item_id: '', quantity: '', unit: 'kg', unit_price: '' }

export function NuevoPedidoButton({
  productTypes,
  inventoryProducts = [],
}: {
  productTypes: string[]
  inventoryProducts?: InventoryProduct[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    client_name: '',
    client_cuit: '',
    client_email: '',
    client_phone: '',
    delivery_date: '',
    notes: '',
  })
  const [items, setItems] = useState<OrderItem[]>([{ ...EMPTY_ITEM }])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  function updateItem(i: number, patch: Partial<OrderItem>) {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== i) return it
      const updated = { ...it, ...patch }
      // Si seleccionó un producto de inventario, auto-completar nombre y unidad
      if (patch.item_id) {
        const inv = inventoryProducts.find(p => p.id === patch.item_id)
        if (inv) {
          updated.product_name = inv.name
          updated.unit = inv.unit
        }
      }
      return updated
    }))
  }

  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM }])
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  const total = items.reduce((acc, it) => {
    const qty = parseFloat(it.quantity) || 0
    const price = parseFloat(it.unit_price) || 0
    return acc + qty * price
  }, 0)

  function reset() {
    setForm({ client_name: '', client_cuit: '', client_email: '', client_phone: '', delivery_date: '', notes: '' })
    setItems([{ ...EMPTY_ITEM }])
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validItems = items.filter(it => it.product_name && parseFloat(it.quantity) > 0)
    if (!validItems.length) {
      setError('Agregá al menos un ítem con cantidad mayor a 0.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) { setLoading(false); return }

    const orgId = profile.organization_id

    // Generar número de orden: ORD-YYYYMMDD-XXXX
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const rand = Math.floor(Math.random() * 9000) + 1000
    const orderNumber = `ORD-${dateStr}-${rand}`

    const { data: order, error: orderErr } = await supabase
      .from('sales_orders')
      .insert({
        organization_id: orgId,
        order_number:    orderNumber,
        client_name:     form.client_name,
        client_cuit:     form.client_cuit || null,
        client_email:    form.client_email || null,
        client_phone:    form.client_phone || null,
        delivery_date:   form.delivery_date || null,
        notes:           form.notes || null,
        total_amount:    total,
        created_by:      user.id,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      setError(orderErr?.message ?? 'Error al crear el pedido.')
      setLoading(false)
      return
    }

    const { error: itemsErr } = await supabase
      .from('sales_order_items')
      .insert(
        validItems.map(it => ({
          organization_id: orgId,
          order_id:        order.id,
          product_name:    it.product_name,
          item_id:         it.item_id || null,
          quantity:        parseFloat(it.quantity),
          unit:            it.unit,
          unit_price:      parseFloat(it.unit_price) || 0,
        }))
      )

    if (itemsErr) {
      setError(itemsErr.message)
      setLoading(false)
      return
    }

    setOpen(false)
    reset()
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> Nuevo pedido
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Nuevo pedido de cliente</h2>
              <button onClick={() => { setOpen(false); reset() }}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Datos del cliente */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Datos del cliente
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre / Razón social *</Label>
                    <Input name="client_name" value={form.client_name} onChange={handleChange} required placeholder="Ej: Supermercado El Sol" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CUIT (opcional)</Label>
                    <Input name="client_cuit" value={form.client_cuit} onChange={handleChange} placeholder="20-12345678-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input name="client_email" type="email" value={form.client_email} onChange={handleChange} placeholder="compras@cliente.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Teléfono</Label>
                    <Input name="client_phone" value={form.client_phone} onChange={handleChange} placeholder="+54 11 xxxx-xxxx" />
                  </div>
                </div>
              </div>

              {/* Ítems */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Productos solicitados
                </p>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4 space-y-1">
                        {i === 0 && <Label className="text-xs">Producto</Label>}
                        {inventoryProducts.length > 0 ? (
                          <select
                            value={item.item_id}
                            onChange={e => updateItem(i, { item_id: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Seleccionar producto...</option>
                            {inventoryProducts.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {p.current_stock} {p.unit} disponibles
                              </option>
                            ))}
                          </select>
                        ) : productTypes.length > 0 ? (
                          <select
                            value={item.product_name}
                            onChange={e => updateItem(i, { product_name: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Seleccionar...</option>
                            {productTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                          </select>
                        ) : (
                          <Input
                            value={item.product_name}
                            onChange={e => updateItem(i, { product_name: e.target.value })}
                            placeholder="Nombre del producto"
                          />
                        )}
                      </div>
                      <div className="col-span-2 space-y-1">
                        {i === 0 && <Label className="text-xs">Cantidad</Label>}
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.quantity}
                          onChange={e => updateItem(i, { quantity: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        {i === 0 && <Label className="text-xs">Unidad</Label>}
                        <select
                          value={item.unit}
                          onChange={e => updateItem(i, { unit: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="kg">kg</option>
                          <option value="u">u</option>
                          <option value="L">L</option>
                          <option value="caja">caja</option>
                        </select>
                      </div>
                      <div className="col-span-3 space-y-1">
                        {i === 0 && <Label className="text-xs">Precio c/IVA</Label>}
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={e => updateItem(i, { unit_price: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar ítem
                  </Button>
                </div>

                {total > 0 && (
                  <p className="text-sm font-semibold text-right mt-3">
                    Total: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(total)}
                  </p>
                )}
              </div>

              {/* Entrega y notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fecha de entrega</Label>
                  <Input name="delivery_date" type="date" value={form.delivery_date} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notas</Label>
                  <Input name="notes" value={form.notes} onChange={handleChange} placeholder="Observaciones..." />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear pedido'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
