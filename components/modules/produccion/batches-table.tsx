'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatNumber, formatDate } from '@/lib/utils'
import { BatchInputsForm } from './batch-inputs-form'
import { BatchStatusButton } from './batch-status-button'
import { EditBatchForm } from './edit-batch-form'
import { BatchDetailButton } from './batch-detail-button'
import { DeleteBatchButton } from './delete-batch-button'
import { DuplicateBatchButton } from './duplicate-batch-button'
import type { IndustryConfig } from '@/types'

type Status = 'all' | 'in_progress' | 'completed' | 'cancelled'

const STATUS_LABELS: Record<string, string> = {
  all:         'Todos',
  in_progress: 'En proceso',
  completed:   'Completados',
  cancelled:   'Cancelados',
}

interface BatchesTableProps {
  batches:     Record<string, unknown>[]
  items:       Record<string, unknown>[]
  inputs:      Record<string, unknown>[]
  config:      IndustryConfig
  inputLabel:  string
  outputLabel: string
}

// Rendimiento promedio histórico por producto (solo lotes completados)
function buildAvgYield(batches: Record<string, unknown>[]): Map<string, number> {
  const map = new Map<string, { sum: number; count: number }>()
  for (const b of batches) {
    if (b.status !== 'completed') continue
    const y = b.yield_percentage as number
    const p = b.product_name as string
    if (!y || !p) continue
    const cur = map.get(p) ?? { sum: 0, count: 0 }
    map.set(p, { sum: cur.sum + y, count: cur.count + 1 })
  }
  const result = new Map<string, number>()
  for (const [product, { sum, count }] of map) {
    result.set(product, sum / count)
  }
  return result
}

export function BatchesTable({ batches, items, inputs, config, inputLabel, outputLabel }: BatchesTableProps) {
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState<Status>('all')
  const [productFilter, setProduct] = useState('all')
  const avgYieldByProduct = useMemo(() => buildAvgYield(batches), [batches])

  // Productos únicos presentes en los lotes
  const availableProducts = useMemo(() => {
    const set = new Set(batches.map(b => b.product_name as string))
    return Array.from(set).sort()
  }, [batches])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return batches.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (productFilter !== 'all' && b.product_name !== productFilter) return false
      if (q) {
        const code    = (b.batch_code as string ?? '').toLowerCase()
        const product = (b.product_name as string ?? '').toLowerCase()
        const notes   = (b.notes as string ?? '').toLowerCase()
        if (!code.includes(q) && !product.includes(q) && !notes.includes(q)) return false
      }
      return true
    })
  }, [batches, search, statusFilter, productFilter])

  const hasFilters = search || statusFilter !== 'all' || productFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStatus('all')
    setProduct('all')
  }

  return (
    <div className="space-y-4">

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, producto o notas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por producto */}
        {availableProducts.length > 1 && (
          <select
            value={productFilter}
            onChange={e => setProduct(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Todos los productos</option>
            {availableProducts.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? s === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-300'
                : s === 'completed'   ? 'bg-green-100 text-green-700 border-green-300'
                : s === 'cancelled'   ? 'bg-gray-100 text-gray-600 border-gray-300'
                : 'bg-primary text-primary-foreground border-primary'
                : 'border-input bg-background hover:bg-accent text-muted-foreground'
            }`}
          >
            {STATUS_LABELS[s]}
            {s !== 'all' && (
              <span className="ml-1.5 opacity-70">
                {batches.filter(b => b.status === s).length}
              </span>
            )}
          </button>
        ))}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground self-center">
          {filtered.length} de {batches.length} lotes
        </span>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          {hasFilters ? (
            <>
              <p className="text-sm text-muted-foreground">No hay lotes que coincidan con los filtros.</p>
              <button onClick={clearFilters} className="text-sm text-primary hover:underline">Limpiar filtros</button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                <Search className="h-5 w-5 text-blue-400" />
              </div>
              <p className="font-medium text-sm">No hay lotes registrados todavía</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Usá el botón <span className="font-semibold">Nuevo lote</span> arriba a la derecha para registrar tu primera producción.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left pb-3 pr-4 font-medium whitespace-nowrap">Código</th>
                <th className="text-left pb-3 pr-4 font-medium whitespace-nowrap">Producto</th>
                <th className="text-right pb-3 pr-4 font-medium whitespace-nowrap">{outputLabel}</th>
                <th className="text-right pb-3 pr-4 font-medium whitespace-nowrap">{inputLabel}</th>
                <th className="text-right pb-3 pr-4 font-medium whitespace-nowrap">Rendimiento</th>
                <th className="text-left pb-3 pr-4 font-medium whitespace-nowrap">Inicio</th>
                <th className="text-left pb-3 pr-4 font-medium whitespace-nowrap">Insumos</th>
                <th className="text-left pb-3 pr-4 font-medium whitespace-nowrap">Estado</th>
                <th className="text-left pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((b) => {
                const batchInputs = inputs.filter(i => i.batch_id === b.id)
                return (
                  <tr key={b.id as string} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs">{b.batch_code as string}</td>
                    <td className="py-3 pr-4 font-medium">{b.product_name as string}</td>
                    <td className="py-3 pr-4 text-right">{formatNumber(b.quantity_kg as number, 1)}</td>
                    <td className="py-3 pr-4 text-right">{formatNumber(b.input_quantity as number, 0)}</td>
                    <td className="py-3 pr-4 text-right font-medium">{formatNumber(b.yield_percentage as number, 2)}%</td>
                    <td className="py-3 pr-4">{formatDate(b.start_date as string)}</td>
                    <td className="py-3 pr-4">
                      <BatchInputsForm
                        batchId={b.id as string}
                        batchCode={b.batch_code as string}
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
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <BatchDetailButton batch={b as never} config={config} />
                        <EditBatchForm batch={b as never} config={config} />
                        <DuplicateBatchButton batch={b as never} />
                        <BatchStatusButton
                          batchId={b.id as string}
                          currentStatus={b.status as string}
                          productName={b.product_name as string}
                          quantityKg={b.quantity_kg as number}
                          inputQuantity={b.input_quantity as number}
                          historicalAvgYield={avgYieldByProduct.get(b.product_name as string) ?? null}
                          customData={b.custom_data as Record<string, unknown> | undefined}
                          config={config}
                          batchInputs={batchInputs as never}
                        />
                        <DeleteBatchButton batchId={b.id as string} batchCode={b.batch_code as string} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
