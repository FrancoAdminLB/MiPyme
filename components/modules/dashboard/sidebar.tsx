'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Package,
  FlaskConical,
  MessageSquare,
  Settings,
  LogOut,
  Truck,
  ShoppingCart,
  ShoppingBag,
  LayoutDashboard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Organization } from '@/types'
import { OrgSwitcher } from './org-switcher'

const NAV_ITEMS = [
  { title: 'Inicio',        href: '/inicio',        icon: LayoutDashboard },
  { title: 'Reportes',      href: '/reportes',      icon: BarChart3 },
  { title: 'Producción',    href: '/produccion',    icon: FlaskConical },
  { title: 'Inventario',    href: '/inventario',    icon: Package },
  { title: 'Pedidos',       href: '/pedidos',       icon: ShoppingBag },
  { title: 'Órdenes',       href: '/ordenes',       icon: ShoppingCart },
  { title: 'Proveedores',   href: '/proveedores',   icon: Truck },
  { title: 'Asistente',     href: '/asistente',     icon: MessageSquare },
  { title: 'Configuración', href: '/configuracion', icon: Settings },
]

interface SidebarProps {
  organization: Organization
  pendingOrders: number
  pendingPedidos: number
  isSuperAdmin?: boolean
  activeOrgId?: string
  allOrgs?: { id: string; name: string; industry: string }[]
}

export function Sidebar({ organization, pendingOrders, pendingPedidos, isSuperAdmin, activeOrgId, allOrgs }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen border-r bg-card">
      {/* Logo / Org name */}
      <div className="px-4 py-4 border-b space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider px-2">MiPyme</p>
        {isSuperAdmin && allOrgs && allOrgs.length > 1 ? (
          <>
            <OrgSwitcher currentOrgId={activeOrgId ?? organization.id} orgs={allOrgs} />
            <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-0.5 text-center font-medium">
              Super Admin
            </p>
          </>
        ) : (
          <p className="font-semibold text-sm truncate px-2">{organization.name}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.title}</span>
              {item.href === '/ordenes' && pendingOrders > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                )}>
                  {pendingOrders > 99 ? '99+' : pendingOrders}
                </span>
              )}
              {item.href === '/pedidos' && pendingPedidos > 0 && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
                )}>
                  {pendingPedidos > 99 ? '99+' : pendingPedidos}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
