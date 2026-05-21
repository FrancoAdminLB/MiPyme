'use client'

import { useState } from 'react'
import { INDUSTRIES } from '@/lib/industries'
import type { Industry } from '@/types'
import { FlaskConical, Package, ShieldCheck, AlertTriangle } from 'lucide-react'

const INDUSTRY_KEYS = Object.keys(INDUSTRIES) as Industry[]

// Fake data por industria para simular el dashboard
const FAKE_BATCHES: Record<string, { code: string; product: string; input: number; output: number; status: string }[]> = {
  tambo:            [{ code: 'ORD-001', product: 'Leche cruda entera', input: 420, output: 10080, status: 'completed' }, { code: 'ORD-002', product: 'Leche cruda entera', input: 418, output: 9850, status: 'in_progress' }],
  dairy:            [{ code: 'LOT-001', product: 'Gouda', input: 10000, output: 980, status: 'completed' }, { code: 'LOT-002', product: 'Sardo', input: 8000, output: 760, status: 'in_progress' }],
  ganaderia:        [{ code: 'LOT-001', product: 'Novillos engorde', input: 320, output: 310, status: 'completed' }, { code: 'LOT-002', product: 'Vaquillonas', input: 180, output: 178, status: 'in_progress' }],
  frigorifico:      [{ code: 'FRG-001', product: 'Media res vacuna', input: 128, output: 69, status: 'completed' }, { code: 'FRG-002', product: 'Cortes enfriados', input: 69, output: 68, status: 'in_progress' }],
  bodega:           [{ code: 'VIN-001', product: 'Malbec 2026', input: 12000, output: 9000, status: 'in_progress' }, { code: 'VIN-002', product: 'Cabernet 2025', input: 8000, output: 6400, status: 'completed' }],
  cerveceria:       [{ code: 'CRV-001', product: 'IPA Americana', input: 120, output: 950, status: 'in_progress' }, { code: 'CRV-002', product: 'Stout Imperial', input: 100, output: 780, status: 'completed' }],
  apicultura:       [{ code: 'API-001', product: 'Miel multiflora', input: 320, output: 1840, status: 'completed' }, { code: 'API-002', product: 'Miel de trébol', input: 180, output: 920, status: 'in_progress' }],
  olivicultura:     [{ code: 'OLI-001', product: 'AOVE Arbequina', input: 42000, output: 8200, status: 'completed' }, { code: 'OLI-002', product: 'AOVE Picual', input: 18000, output: 3400, status: 'in_progress' }],
  chacinados:       [{ code: 'CHA-001', product: 'Salame tipo Milano', input: 180, output: 140, status: 'in_progress' }, { code: 'CHA-002', product: 'Chorizo seco', input: 120, output: 90, status: 'completed' }],
  cerealera:        [{ code: 'GRA-001', product: 'Soja campaña 26', input: 1200, output: 4800, status: 'completed' }, { code: 'GRA-002', product: 'Maíz campaña 26', input: 800, output: 3200, status: 'in_progress' }],
  agro_campo:       [{ code: 'CAM-001', product: 'Soja RR', input: 600, output: 42, status: 'completed' }, { code: 'CAM-002', product: 'Maíz híbrido', input: 400, output: 38, status: 'in_progress' }],
  avicultura:       [{ code: 'AVE-001', product: 'Pollo parrillero', input: 40000, output: 93600, status: 'in_progress' }, { code: 'AVE-002', product: 'Pollo parrillero', input: 38000, output: 88160, status: 'completed' }],
  yerbatera:        [{ code: 'YER-001', product: 'Yerba Selección Sup.', input: 80, output: 72, status: 'in_progress' }, { code: 'YER-002', product: 'Yerba Clásica', input: 120, output: 108, status: 'completed' }],
  fruticultura:     [{ code: 'FRU-001', product: 'Pera Williams cat.1', input: 28000, output: 4200, status: 'completed' }, { code: 'FRU-002', product: 'Manzana Red Delicious', input: 18000, output: 2800, status: 'in_progress' }],
  hidroponia:       [{ code: 'HID-001', product: 'Lechuga mantecosa', input: 8000, output: 840, status: 'completed' }, { code: 'HID-002', product: 'Albahaca genovesa', input: 3000, output: 280, status: 'in_progress' }],
  food_manufacturing:[{ code: 'ALI-001', product: 'Salsa de tomate 370g', input: 2400, output: 38, status: 'completed' }, { code: 'ALI-002', product: 'Mermelada frutilla', input: 1800, output: 28, status: 'in_progress' }],
  panaderia:        [{ code: 'PAN-001', product: 'Pan francés', input: 200, output: 380, status: 'completed' }, { code: 'PAN-002', product: 'Medialunas', input: 80, output: 148, status: 'in_progress' }],
  acuicultura:      [{ code: 'ACU-001', product: 'Trucha arcoíris', input: 12000, output: 9200, status: 'in_progress' }, { code: 'ACU-002', product: 'Pejerrey', input: 8000, output: 6100, status: 'completed' }],
  cosmetica:        [{ code: 'COS-001', product: 'Crema hidratante 50g', input: 120, output: 8400, status: 'completed' }, { code: 'COS-002', product: 'Sérum vitamina C', input: 80, output: 4200, status: 'in_progress' }],
  pesca:            [{ code: 'PES-001', product: 'Langostino pelado IQF', input: 4800, output: 2950, status: 'completed' }, { code: 'PES-002', product: 'Merluza fileteada', input: 3200, output: 1800, status: 'in_progress' }],
}

const FAKE_STOCK: Record<string, { name: string; stock: number; min: number; unit: string }[]> = {
  tambo:            [{ name: 'Pezoneras', stock: 18, min: 20, unit: 'unidad' }, { name: 'Sellador pezones', stock: 12, min: 10, unit: 'L' }, { name: 'Detergente alcalino', stock: 8, min: 20, unit: 'kg' }],
  dairy:            [{ name: 'Cuajo líquido', stock: 2.1, min: 5, unit: 'L' }, { name: 'Cloruro de calcio', stock: 8, min: 10, unit: 'kg' }, { name: 'Sal fina', stock: 120, min: 50, unit: 'kg' }],
  ganaderia:        [{ name: 'Vacuna aftosa', stock: 800, min: 500, unit: 'dosis' }, { name: 'Ivermectina', stock: 2, min: 5, unit: 'L' }, { name: 'Sal mineral', stock: 180, min: 200, unit: 'kg' }],
  frigorifico:      [{ name: 'Bolsas vacío 30x50', stock: 4200, min: 2000, unit: 'unidad' }, { name: 'Cajas cartón', stock: 380, min: 500, unit: 'unidad' }, { name: 'Hielo en escamas', stock: 800, min: 1000, unit: 'kg' }],
  bodega:           [{ name: 'Bentonita', stock: 12, min: 20, unit: 'kg' }, { name: 'SO₂ metabisulfito', stock: 8, min: 15, unit: 'kg' }, { name: 'Corchos naturales', stock: 4200, min: 5000, unit: 'unidad' }],
  cerveceria:       [{ name: 'Malta pale ale', stock: 280, min: 100, unit: 'kg' }, { name: 'Lúpulo Cascade', stock: 4.2, min: 2, unit: 'kg' }, { name: 'Levadura US-05', stock: 8, min: 5, unit: 'sobre' }],
  apicultura:       [{ name: 'Frascos 500g', stock: 1800, min: 1000, unit: 'unidad' }, { name: 'Tapas twist-off', stock: 1800, min: 1000, unit: 'unidad' }, { name: 'Ácido oxálico', stock: 2.4, min: 5, unit: 'kg' }],
  olivicultura:     [{ name: 'Botellas 500ml', stock: 6800, min: 5000, unit: 'unidad' }, { name: 'Cápsulas', stock: 6800, min: 5000, unit: 'unidad' }, { name: 'Cajas de cartón', stock: 420, min: 600, unit: 'unidad' }],
  chacinados:       [{ name: 'Tripa natural cerdo', stock: 12, min: 20, unit: 'metro' }, { name: 'Nitrito de sodio', stock: 0.8, min: 2, unit: 'kg' }, { name: 'Pimienta negra molida', stock: 4, min: 5, unit: 'kg' }],
  cerealera:        [{ name: 'Bolsas big bag', stock: 80, min: 100, unit: 'unidad' }, { name: 'Aireadores silo', stock: 4, min: 6, unit: 'unidad' }, { name: 'Fumigante fosfina', stock: 18, min: 20, unit: 'kg' }],
  agro_campo:       [{ name: 'Semilla soja RR1', stock: 2400, min: 3000, unit: 'kg' }, { name: 'Urea granulada', stock: 8000, min: 5000, unit: 'kg' }, { name: 'Herbicida glifosato', stock: 180, min: 200, unit: 'L' }],
  avicultura:       [{ name: 'Alimento balanceado', stock: 18000, min: 20000, unit: 'kg' }, { name: 'Vacuna Newcastle', stock: 38000, min: 40000, unit: 'dosis' }, { name: 'Viruta de madera', stock: 12, min: 20, unit: 'm³' }],
  yerbatera:        [{ name: 'Bolsas 1kg kraft', stock: 4200, min: 5000, unit: 'unidad' }, { name: 'Hilo de yute', stock: 8, min: 10, unit: 'kg' }, { name: 'Etiquetas frente', stock: 3800, min: 5000, unit: 'unidad' }],
  fruticultura:     [{ name: 'Cajas de cartón std', stock: 3800, min: 5000, unit: 'unidad' }, { name: 'Separadores papel', stock: 12000, min: 15000, unit: 'hoja' }, { name: 'Cinta adhesiva', stock: 18, min: 30, unit: 'rollo' }],
  hidroponia:       [{ name: 'Solución A (macro)', stock: 18, min: 20, unit: 'L' }, { name: 'Solución B (micro)', stock: 8, min: 10, unit: 'L' }, { name: 'Semillas lechuga', stock: 4200, min: 5000, unit: 'unidad' }],
  food_manufacturing:[{ name: 'Tomate triturado', stock: 1800, min: 2000, unit: 'kg' }, { name: 'Frascos 370ml', stock: 2800, min: 3000, unit: 'unidad' }, { name: 'Tapas', stock: 2800, min: 3000, unit: 'unidad' }],
  panaderia:        [{ name: 'Harina 000', stock: 180, min: 300, unit: 'kg' }, { name: 'Levadura fresca', stock: 4.2, min: 8, unit: 'kg' }, { name: 'Manteca', stock: 12, min: 20, unit: 'kg' }],
  acuicultura:      [{ name: 'Alimento pellet 3mm', stock: 1800, min: 2000, unit: 'kg' }, { name: 'Alevines trucha', stock: 0, min: 10000, unit: 'unidad' }, { name: 'Cal agrícola', stock: 80, min: 100, unit: 'kg' }],
  cosmetica:        [{ name: 'Aceite jojoba', stock: 8, min: 15, unit: 'kg' }, { name: 'Vitamina C (ác. ascórbico)', stock: 2.1, min: 5, unit: 'kg' }, { name: 'Envases 50ml', stock: 6800, min: 5000, unit: 'unidad' }],
  pesca:            [{ name: 'Bolsas IQF 1kg', stock: 8400, min: 10000, unit: 'unidad' }, { name: 'Cajas poliest. 20kg', stock: 380, min: 500, unit: 'unidad' }, { name: 'Hielo picado', stock: 800, min: 2000, unit: 'kg' }],
}

export default function PreviewPage() {
  const [selected, setSelected] = useState<Industry>('dairy')
  const meta = INDUSTRIES[selected]
  const batches = FAKE_BATCHES[selected] ?? []
  const stock = FAKE_STOCK[selected] ?? []
  const fields = meta.defaultConfig.custom_fields
  const stages = meta.defaultConfig.stages

  const stockAlerts = stock.filter(s => s.stock < s.min)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Preview interno — Dashboard por industria</h1>
          <p className="text-xs text-gray-400 mt-0.5">Solo para desarrollo. No indexado.</p>
        </div>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">🔒 Interno</span>
      </div>

      {/* Selector de industria */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {INDUSTRY_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                selected === key
                  ? 'bg-gray-950 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {INDUSTRIES[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Info industria */}
        <div className="flex items-start gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{meta.label}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{meta.region} — Regulador: <span className="font-medium text-gray-700">{meta.regulator}</span></p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Lotes del mes</p>
              <FlaskConical className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{batches.length}</p>
            <p className="text-xs text-gray-400 mt-1">{batches.filter(b => b.status === 'in_progress').length} en proceso</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">{meta.defaultConfig.output_label}</p>
              <FlaskConical className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{batches.reduce((a, b) => a + b.output, 0).toLocaleString('es-AR')}</p>
            <p className="text-xs text-gray-400 mt-1">Último lote: {batches[0]?.output.toLocaleString('es-AR') ?? '—'}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">{meta.defaultConfig.input_label}</p>
              <Package className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{batches.reduce((a, b) => a + b.input, 0).toLocaleString('es-AR')}</p>
            <p className="text-xs text-gray-400 mt-1">Total acumulado</p>
          </div>

          <div className={`bg-white rounded-xl border p-4 ${stockAlerts.length > 0 ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Alertas stock</p>
              <AlertTriangle className={`h-4 w-4 ${stockAlerts.length > 0 ? 'text-red-500' : 'text-gray-300'}`} />
            </div>
            <p className={`text-2xl font-bold ${stockAlerts.length > 0 ? 'text-red-500' : 'text-gray-900'}`}>{stockAlerts.length}</p>
            <p className="text-xs text-gray-400 mt-1">{stockAlerts.length > 0 ? 'Ítems bajo mínimo' : 'Stock OK'}</p>
          </div>
        </div>

        {/* Lotes + Stock */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Lotes */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm">Últimos lotes</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {batches.map(b => (
                <div key={b.code} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono text-xs text-gray-400">{b.code}</span>
                    <span className="ml-2 font-medium text-gray-800">{b.product}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{b.output.toLocaleString('es-AR')} {meta.defaultConfig.output_label.split(' ').pop()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      b.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {b.status === 'completed' ? 'Completado' : 'En proceso'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm">Inventario principal</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {stock.map(s => {
                const isAlert = s.stock < s.min
                return (
                  <div key={s.name} className="px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-gray-700">{s.name}</span>
                    <div className="flex items-center gap-2">
                      {isAlert && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                      <span className={isAlert ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {s.stock.toLocaleString('es-AR')} / {s.min.toLocaleString('es-AR')} {s.unit}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Etapas + Campos */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Etapas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm mb-4">Etapas del proceso</h3>
            <div className="flex flex-wrap gap-2">
              {stages.map((s, i) => (
                <span key={s} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                  i === 0 ? 'bg-gray-950 text-white' :
                  i === 1 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                  'bg-gray-50 border border-gray-200 text-gray-500'
                }`}>
                  <span className="opacity-40">{i + 1}</span> {s}
                </span>
              ))}
            </div>
          </div>

          {/* Campos de compliance */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm mb-4">Campos de proceso y compliance</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {fields.map(f => (
                <div key={f.key} className="flex items-start justify-between text-xs gap-4">
                  <div className="flex items-center gap-2">
                    {f.compliance_ref && <ShieldCheck className="h-3 w-3 text-green-500 shrink-0" />}
                    <span className="text-gray-700">{f.label}{f.unit ? ` (${f.unit})` : ''}</span>
                  </div>
                  {f.compliance_ref && (
                    <span className="text-gray-400 text-right shrink-0">{f.compliance_ref}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Productos disponibles */}
        {meta.defaultConfig.product_types.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm mb-3">Tipos de producto configurados</h3>
            <div className="flex flex-wrap gap-2">
              {meta.defaultConfig.product_types.map(p => (
                <span key={p} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{p}</span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
