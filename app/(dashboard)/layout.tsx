import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/supabase/helpers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/modules/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext()

  if (!ctx) redirect('/login')
  if (!ctx.organization.onboarding_completed) redirect('/onboarding')

  const supabase = createClient()
  const { count } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ctx.organization.id)
    .in('status', ['pending', 'sent'])

  return (
    <div className="flex min-h-screen">
      <Sidebar organization={ctx.organization} pendingOrders={count ?? 0} />
      <main className="flex-1 overflow-auto bg-muted/20">
        {children}
      </main>
    </div>
  )
}
