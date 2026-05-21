'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react'

type ColumnKey = 'batch_code' | 'product_name' | 'quantity_kg' | 'start_date' | 'end_date' | 'status' | 'notes' | 'skip'

const FIELD_LABELS: Record<ColumnKey, string> = {
  batch_code: 'Código de lote *',
  product_name: 'Producto *',
  quantity_kg: 'Cantidad (kg)',
  start_date: 'Fecha inicio',
  end_date: 'Fecha fin',
  status: 'Estado',
  notes: 'Notas',
  skip: '— Ignorar —',
}

const STATUS_MAP: Record<string, string> = {
  'en proceso': 'in_progress', 'in_progress': 'in_progress', 'proceso': 'in_progress',
  'completado': 'completed', 'completed': 'completed', 'finalizado': 'completed', 'terminado': 'completed',
  'cancelado': 'cancelled', 'cancelled': 'cancelled',
}

function guessMapping(headers: string[]): Record<number, ColumnKey> {
  const mapping: Record<number, ColumnKey> = {}
  headers.forEach((h, i) => {
    const lower = h.toLowerCase().trim()
    if (/c[oó]digo|lote|batch|n[uú]mero/.test(lower)) mapping[i] = 'batch_code'
    else if (/producto|product|nombre|queso|variedad/.test(lower)) mapping[i] = 'product_name'
    else if (/cantidad|kg|kilo|peso/.test(lower)) mapping[i] = 'quantity_kg'
    else if (/inicio|start|fecha.?i|elaborac/.test(lower)) mapping[i] = 'start_date'
    else if (/fin|end|egreso|fecha.?f|salida/.test(lower)) mapping[i] = 'end_date'
    else if (/estado|status/.test(lower)) mapping[i] = 'status'
    else if (/nota|observ|coment/.test(lower)) mapping[i] = 'notes'
    else mapping[i] = 'skip'
  })
  return mapping
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  // Excel serial number
  const serial = Number(raw)
  if (!isNaN(serial) && serial > 1000) {
    const date = new Date((serial - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]!
  }
  // Try natural format
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]!
  return null
}

interface ParsedRow { [key: string]: string | number }

export function ImportProduccionButton() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<Record<number, ColumnKey>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null); setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]!]!
      const json = XLSX.utils.sheet_to_json<ParsedRow>(ws, { header: 1, defval: '' })
      const headerRow = (json[0] as unknown as string[]) ?? []
      const dataRows = json.slice(1).filter((r) =>
        (r as unknown as string[]).some((c) => String(c).trim() !== '')
      ) as ParsedRow[]
      setHeaders(headerRow)
      setRows(dataRows.slice(0, 500))
      setMapping(guessMapping(headerRow))
      setOpen(true)
    }
    reader.readAsArrayBuffer(file)
  }

  function getValue(row: ParsedRow, colIndex: number) {
    return String((row as unknown as string[])[colIndex] ?? '').trim()
  }

  async function handleImport() {
    setError(null)
    const codeCol = Object.entries(mapping).find(([, v]) => v === 'batch_code')?.[0]
    const nameCol = Object.entries(mapping).find(([, v]) => v === 'product_name')?.[0]
    if (!codeCol || !nameCol) { setError('Necesitás mapear "Código de lote" y "Producto".'); return }

    const batches = rows.map((row) => {
      const get = (key: ColumnKey) => {
        const col = Object.entries(mapping).find(([, v]) => v === key)?.[0]
        return col !== undefined ? getValue(row, Number(col)) : ''
      }
      const rawStatus = get('status').toLowerCase()
      return {
        batch_code: get('batch_code'),
        product_name: get('product_name'),
        quantity_kg: parseFloat(get('quantity_kg')) || 0,
        start_date: parseDate(get('start_date')) ?? new Date().toISOString().split('T')[0],
        end_date: parseDate(get('end_date')),
        status: STATUS_MAP[rawStatus] ?? 'completed',
        notes: get('notes'),
      }
    }).filter((b) => b.batch_code && b.product_name)

    if (!batches.length) { setError('No hay filas válidas.'); return }

    setLoading(true)
    const res = await fetch('/api/production/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batches }),
    })
    const data = await res.json() as { created?: number; skipped?: number; error?: string }
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al importar'); return }
    setResult({ created: data.created ?? 0, skipped: data.skipped ?? 0 })
    router.refresh()
  }

  function reset() {
    setOpen(false); setHeaders([]); setRows([]); setMapping({}); setResult(null); setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const previewRows = rows.slice(0, 5)

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" /> Importar Excel / CSV
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-lg font-semibold">Importar historial de producción</h2>
                <p className="text-sm text-muted-foreground">{rows.length} lotes detectados</p>
              </div>
              <button onClick={reset}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-6">
              {result ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">{result.created} lote{result.created !== 1 ? 's' : ''} importado{result.created !== 1 ? 's' : ''}</p>
                    {result.skipped > 0 && <p className="text-xs text-green-600">{result.skipped} omitidos (código ya existía)</p>}
                  </div>
                  <Button size="sm" className="ml-auto" onClick={reset}>Cerrar</Button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold mb-3">Mapeo de columnas</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {headers.map((h, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-xs text-muted-foreground font-mono truncate">{h || `Columna ${i + 1}`}</p>
                          <select
                            value={mapping[i] ?? 'skip'}
                            onChange={(e) => setMapping(m => ({ ...m, [i]: e.target.value as ColumnKey }))}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {(Object.keys(FIELD_LABELS) as ColumnKey[]).map((k) => (
                              <option key={k} value={k}>{FIELD_LABELS[k]}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-3">Preview (primeras {previewRows.length} filas)</p>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50">
                          <tr>{headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                              {mapping[i] !== 'skip' ? <span className="text-foreground font-semibold">{FIELD_LABELS[mapping[i] ?? 'skip']}</span> : <span className="line-through opacity-40">{h || `Col ${i + 1}`}</span>}
                            </th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y">
                          {previewRows.map((row, ri) => (
                            <tr key={ri} className="hover:bg-muted/30">
                              {headers.map((_, ci) => (
                                <td key={ci} className={`px-3 py-2 ${mapping[ci] === 'skip' ? 'opacity-30' : ''}`}>
                                  {getValue(row, ci) || <span className="text-muted-foreground">—</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {error && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Se van a importar <strong>{rows.filter(r => getValue(r, Number(Object.entries(mapping).find(([,v]) => v === 'batch_code')?.[0] ?? -1))).length}</strong> lotes</p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={reset}>Cancelar</Button>
                      <Button onClick={handleImport} disabled={loading}>{loading ? 'Importando...' : `Importar ${rows.length} lotes`}</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
