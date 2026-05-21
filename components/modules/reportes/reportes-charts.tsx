'use client'

import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Lock } from 'lucide-react'
import Link from 'next/link'

interface ProductionDay {
  date: string
  kg: number
}

interface YieldProduct {
  product: string
  yield: number
  batches: number
}

interface ReportesChartsProps {
  plan: string
  productionByDay: ProductionDay[]
  yieldByProduct: YieldProduct[]
  outputLabel: string
}

const PAYWALL_PLANS = ['free']

function UpgradeWall() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
      <div className="text-center space-y-3 px-6">
        <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="font-semibold text-sm">Disponible en plan Starter</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Los gráficos históricos y análisis de rendimiento están disponibles a partir del plan Starter.
        </p>
        <Link
          href="/configuracion#planes"
          className="inline-block bg-gray-950 text-white text-xs px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          Ver planes
        </Link>
      </div>
    </div>
  )
}

const COLORS = ['#1d4ed8', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626']

export function ReportesCharts({ plan, productionByDay, yieldByProduct, outputLabel }: ReportesChartsProps) {
  const isLocked = PAYWALL_PLANS.includes(plan)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Producción diaria */}
      <div className="bg-card border rounded-lg p-6 relative">
        {isLocked && <UpgradeWall />}
        <div className={isLocked ? 'blur-sm pointer-events-none select-none' : ''}>
          <p className="text-sm font-semibold mb-1">Producción últimos 30 días</p>
          <p className="text-xs text-muted-foreground mb-4">{outputLabel} por día</p>
          {productionByDay.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              Sin datos de producción todavía
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productionByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)}`, outputLabel]}
                  labelStyle={{ fontSize: 11 }}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="kg" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rendimiento por producto */}
      <div className="bg-card border rounded-lg p-6 relative">
        {isLocked && <UpgradeWall />}
        <div className={isLocked ? 'blur-sm pointer-events-none select-none' : ''}>
          <p className="text-sm font-semibold mb-1">Rendimiento por producto</p>
          <p className="text-xs text-muted-foreground mb-4">% promedio de lotes completados</p>
          {yieldByProduct.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              Sin lotes completados todavía
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={yieldByProduct}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 'auto']} />
                <YAxis
                  type="category"
                  dataKey="product"
                  tick={{ fontSize: 10 }}
                  width={90}
                />
                <Tooltip
                  formatter={(v, _name, entry) => [
                    `${Number(v).toFixed(1)}% (${(entry.payload as YieldProduct | undefined)?.batches ?? 0} lotes)`,
                    'Rendimiento',
                  ]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="yield" radius={[0, 3, 3, 0]}>
                  {yieldByProduct.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  )
}
