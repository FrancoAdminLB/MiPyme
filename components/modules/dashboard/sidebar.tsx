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
  { title: 'Inicio',        href: '/inicio',        icon: LayoutDashboard, minSize: 'micro'   },
  { title: 'Reportes',      href: '/reportes',      icon: BarChart3,       minSize: 'small'   },
  { title: 'Producción',    href: '/produccion',    icon: FlaskConical,    minSize: 'micro'   },
  { title: 'Inventario',    href: '/inventario',    icon: Package,         minSize: 'micro'   },
  { title: 'Pedidos',       href: '/pedidos',       icon: ShoppingBag,     minSize: 'micro'   },
  { title: 'Órdenes',       href: '/ordenes',       icon: ShoppingCart,    minSize: 'small'   },
  { title: 'Proveedores',   href: '/proveedores',   icon: Truck,           minSize: 'small'   },
  { title: 'Asistente',     href: '/asistente',     icon: MessageSquare,   minSize: 'micro'   },
  { title: 'Configuración', href: '/configuracion', icon: Settings,        minSize: 'micro'   },
]

const SIZE_ORDER = ['micro', 'small', 'medium', 'medium2']

function getNavItems(companySize: string | null) {
  const sizeIndex = SIZE_ORDER.indexOf(companySize ?? 'small')
  const effectiveIndex = sizeIndex === -1 ? 1 : sizeIndex
  return NAV_ITEMS.filter(item => SIZE_ORDER.indexOf(item.minSize) <= effectiveIndex)
}

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
      <div className="px-4 py-4 border-b">
        {isSuperAdmin && allOrgs && allOrgs.length > 1 ? (
          <div className="space-y-2">
            <OrgSwitcher currentOrgId={activeOrgId ?? organization.id} orgs={allOrgs} />
            <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-0.5 text-center font-medium">
              Super Admin
            </p>
          </div>
        ) : (
          <div className="px-2">
            <p className="font-bold text-sm truncate">{organization.name}</p>
            <p className="text-[11px] text-muted-foreground truncate capitalize">{organization.industry?.replace('_', ' ')}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {getNavItems(organization.company_size).map((item) => {
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
