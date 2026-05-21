'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Pencil, Trash2 } from 'lucide-react'
import type { Supplier } from '@/types'

const EMPTY_FORM = {
  name: '', cuit: '', contact_name: '', contact_phone: '',
  contact_email: '', category: 'materia_prima', notes: '',
}

export function ProveedoresTable({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setOpen(true) }
  function openEdit(s: Supplier) {
    setEditing(s)
    setForm({
      name: s.name, cuit: s.cuit ?? '', contact_name: s.contact_name ?? '',
      contact_phone: s.contact_phone ?? '', contact_email: s.contact_email ?? '',
      category: s.category ?? 'materia_prima', notes: s.notes ?? '',
    })
    setOpen(true)
  }
  function closeModal() { setOpen(false); setEditing(null); setError(null) }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) { setLoading(false); return }

    const payload = { ...form, organization_id: profile.organization_id, active: true }

    const { error } = editing
      ? await supabase.from('suppliers').update(payload).eq('id', editing.id)
      : await supabase.from('suppliers').insert(payload)

    if (error) { setError(error.message); setLoading(false); return }
    closeModal()
    router.refresh()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Desactivás este proveedor?')) return
    const supabase = createClient()
    await supabase.from('suppliers').update({ active: false }).eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo proveedor
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sin proveedores registrados todavía.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left pb-3 pr-4 font-medium">Nombre</th>
                <th className="text-left pb-3 pr-4 font-medium">CUIT</th>
                <th className="text-left pb-3 pr-4 font-medium">Categoría</th>
                <th className="text-left pb-3 pr-4 font-medium">Contacto</th>
                <th className="text-left pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-4 font-medium">{s.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{s.cuit || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                      {s.category || '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {s.contact_name || s.contact_email || s.contact_phone || '—'}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editing ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h2>
              <button onClick={closeModal}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Estancia La Pampa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CUIT</Label>
                  <Input name="cuit" value={form.cuit} onChange={handleChange} placeholder="20-12345678-9" />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="materia_prima">Materia prima</option>
                    <option value="insumo">Insumo</option>
                    <option value="servicio">Servicio</option>
                    <option value="packaging">Packaging</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="Nombre del contacto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="+54 9 ..." />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} placeholder="proveedor@..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input name="notes" value={form.notes} onChange={handleChange} placeholder="Condiciones de pago, observaciones..." />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
