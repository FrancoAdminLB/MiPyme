import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigPanel } from '@/components/modules/configuracion/config-panel'
import { EditOrganizationForm } from '@/components/modules/configuracion/edit-organization-form'
import { PlanSelector } from '@/components/modules/configuracion/plan-selector'
import { FiscalConfigForm } from '@/components/modules/configuracion/fiscal-config-form'
import { INDUSTRIES } from '@/lib/industries'
import type { FiscalConfig } from '@/lib/integrations/tusfacturas'

const PLAN_LABELS: Record<string, string> = {
  free:       'Gratuito',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
}

const LANGUAGE_LABELS: Record<string, string> = {
  es_AR: '🇦🇷 Español (Argentina)',
  en:    '🇺🇸 English',
}

export default async function ConfiguracionPage() {
  const ctx = await getAuthContext()
  if (!ctx) return null

  const { organization, profile } = ctx
  const isAdmin = profile.role === 'admin'

  // Leer fiscal_config via admin (campos sensibles no expuestos a RLS)
  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: orgData } = await supabaseAdmin
    .from('organizations')
    .select('fiscal_config')
    .eq('id', organization.id)
    .single()
  const fiscalConfig = (orgData?.fiscal_config ?? {}) as Partial<FiscalConfig>

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Personalizá MiPyme para tu empresa
        </p>
      </div>

      {/* Datos de org y cuenta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Organización</CardTitle>
            {isAdmin && <EditOrganizationForm organization={organization} />}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nombre" value={organization.name} />
            <Row label="Rubro" value={INDUSTRIES[organization.industry]?.label ?? organization.industry} />
            <Row label="Plan" value={PLAN_LABELS[organization.plan] ?? organization.plan} />
            <Row label="Idioma" value={LANGUAGE_LABELS[organization.industry_config?.language ?? 'es_AR'] ?? 'Español (Argentina)'} />
            <Row label="ID" value={organization.id} mono />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mi cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nombre" value={profile.full_name ?? '—'} />
            <Row label="Email" value={profile.email} />
            <Row label="Rol" value={profile.role === 'admin' ? 'Administrador' : profile.role === 'manager' ? 'Gerente' : 'Operario'} />
          </CardContent>
        </Card>
      </div>

      {/* Planes */}
      <PlanSelector currentPlan={organization.plan} isAdmin={isAdmin} />

      {/* Panel de configuración — solo admins */}
      {isAdmin ? (
        <>
          <div>
            <h2 className="text-lg font-semibold">Configuración de producción</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Definí las métricas, productos y campos que usa tu empresa. Los cambios se aplican a todos los usuarios.
            </p>
          </div>
          <ConfigPanel
            orgId={organization.id}
            orgName={organization.name}
            initialConfig={organization.industry_config ?? {}}
          />

          <div>
            <h2 className="text-lg font-semibold">Facturación electrónica</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Configurá los datos fiscales para emitir comprobantes AFIP desde los pedidos de clientes.
            </p>
          </div>
          <FiscalConfigForm
            orgId={organization.id}
            initialConfig={fiscalConfig}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Solo los administradores pueden modificar la configuración.
        </p>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
