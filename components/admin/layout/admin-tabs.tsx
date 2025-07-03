"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingBag, Package, Users, Bike, Settings, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
  { name: "Entregadores", href: "/admin/entregadores", icon: Bike },
  { name: "Produtos", href: "/admin/produtos", icon: Package },
  { name: "Clientes", href: "/admin/clientes", icon: Users },
  { name: "Relatórios", href: "/admin/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="container mx-auto px-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-1 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
