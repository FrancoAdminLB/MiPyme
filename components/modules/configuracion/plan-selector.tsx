'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Plan {
  id: string
  name: string
  price: string
  description: string
  features: string[]
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Gratis',
    description: 'Para empezar a conocer la plataforma',
    features: [
      'Producción y lotes',
      'Inventario con alertas de stock',
      'Reportes de KPIs',
      'Gestión de proveedores',
      '1 usuario administrador',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29.900 / mes',
    description: 'Para PyMEs en operación',
    highlight: true,
    features: [
      'Todo lo de Free',
      'Gráficos históricos de producción',
      'Asistente IA con datos de tu empresa',
      'Cumplimiento normativo (SENASA, CAA, INV)',
      'Órdenes de reposición automáticas',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$59.900 / mes',
    description: 'Para empresas en crecimiento',
    features: [
      'Todo lo de Starter',
      'Motor de alertas configurables',
      'Configuración avanzada por industria',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'A consultar',
    description: 'Para operaciones de mayor escala',
    features: [
      'Todo lo de Pro',
      'Onboarding asistido',
      'Configuración personalizada',
      'Contacto directo con el equipo',
    ],
  },
]

interface PlanSelectorProps {
  currentPlan: string
  isAdmin: boolean
}

export function PlanSelector({ currentPlan, isAdmin }: PlanSelectorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(planId: string) {
    if (planId === currentPlan || !isAdmin) return
    setLoading(planId)
    setError(null)

    const res = await fetch('/api/organizations/plan', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al cambiar el plan')
      setLoading(null)
      return
    }

    router.refresh()
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Planes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin
            ? 'Seleccioná el plan que mejor se adapta a tu operación.'
            : 'Solo los administradores pueden cambiar el plan.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const isLoadingThis = loading === plan.id

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-5 flex flex-col gap-4 transition-colors ${
                plan.highlight
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" /> Recomendado
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{plan.name}</p>
                  {isCurrent && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Plan actual
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold">{plan.price}</p>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {isAdmin && (
                <Button
                  size="sm"
                  variant={isCurrent ? 'outline' : plan.highlight ? 'default' : 'outline'}
                  disabled={isCurrent || isLoadingThis || loading !== null}
                  onClick={() => handleSelect(plan.id)}
                  className="w-full"
                >
                  {isLoadingThis
                    ? 'Aplicando...'
                    : isCurrent
                    ? 'Plan actual'
                    : plan.id === 'enterprise'
                    ? 'Contactar'
                    : 'Seleccionar'}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        * Los pagos se habilitan próximamente. Por ahora podés activar el plan que corresponda.
      </p>
    </div>
  )
}
