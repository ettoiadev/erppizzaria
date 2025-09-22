"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingBag, Package, Users, Bike, Settings, BarChart3, MapPin, Printer, Calculator, Bell, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "PDV", href: "/admin/pdv", icon: Calculator },
  { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
  { name: "Entregadores", href: "/admin/entregadores", icon: Bike },
  { name: "Produtos", href: "/admin/produtos", icon: Package },
  { name: "Clientes", href: "/admin/clientes", icon: Users },
  { name: "Relatórios", href: "/admin/relatorios", icon: BarChart3 },
  { name: "Notificações", href: "/admin/notificacoes", icon: Bell },
  { name: "Monitoramento", href: "/admin/monitoramento", icon: AlertTriangle },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <div className="bg-background border-b border-border sticky top-16 z-40">
      <div className="container mx-auto px-4 sm:px-6">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-1 scrollbar-hide">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-1 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate max-w-[80px] sm:max-w-none">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
