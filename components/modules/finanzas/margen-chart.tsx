'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface MargenData {
  name: string
  margen: number
}

export function MargenChart({ data }: { data: MargenData[] }) {
  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 10) + '…' : v}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
          domain={[0, 100]}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Margen bruto']}
          labelStyle={{ fontWeight: 600 }}
        />
        <Bar dataKey="margen" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={entry.margen >= 30 ? '#16a34a' : entry.margen >= 15 ? '#d97706' : '#dc2626'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
