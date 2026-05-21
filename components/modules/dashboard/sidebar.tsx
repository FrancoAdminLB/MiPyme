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
  LayoutDashboard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Organization } from '@/types'

const NAV_ITEMS = [
  { title: 'Inicio',        href: '/inicio',        icon: LayoutDashboard },
  { title: 'Reportes',      href: '/reportes',      icon: BarChart3 },
  { title: 'Producción',    href: '/produccion',    icon: FlaskConical },
  { title: 'Inventario',    href: '/inventario',    icon: Package },
  { title: 'Órdenes',       href: '/ordenes',       icon: ShoppingCart },
  { title: 'Proveedores',   href: '/proveedores',   icon: Truck },
  { title: 'Asistente',     href: '/asistente',     icon: MessageSquare },
  { title: 'Configuración', href: '/configuracion', icon: Settings },
]

interface SidebarProps {
  organization: Organization
  pendingOrders: number
}

export function Sidebar({ organization, pendingOrders }: SidebarProps) {
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
      <div className="px-6 py-5 border-b">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">MiPyme</p>
        <p className="font-semibold text-sm truncate">{organization.name}</p>
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
