import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/modules/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext()

  if (!ctx) redirect('/login')
  if (!ctx.organization.onboarding_completed) redirect('/onboarding')

  const supabase = createClient()

  const [{ count }, { count: pedidosCount }] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', ctx.organization.id)
      .in('status', ['pending', 'sent']),
    supabase
      .from('sales_orders')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', ctx.organization.id)
      .eq('status', 'pending'),
  ])

  // Super admin: cargar todas las orgs para el selector
  let allOrgs: { id: string; name: string; industry: string }[] = []
  if (ctx.profile.is_super_admin) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, industry')
      .order('name')
    allOrgs = (data ?? []) as { id: string; name: string; industry: string }[]
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        organization={ctx.organization}
        pendingOrders={count ?? 0}
        pendingPedidos={pedidosCount ?? 0}
        isSuperAdmin={!!ctx.profile.is_super_admin}
        activeOrgId={ctx.organization.id}
        allOrgs={allOrgs}
      />
      <main className="flex-1 overflow-auto bg-muted/20">
        {children}
      </main>
    </div>
  )
}
