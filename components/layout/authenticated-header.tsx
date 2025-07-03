"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  ShoppingBag,
  Menu,
  X,
  User,
  ChevronDown,
  UtensilsCrossed,
  Package,
  UserCircle,
  Ticket,
  Heart,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useAppSettings } from "@/hooks/use-app-settings"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AuthenticatedHeaderProps {
  onCartClick?: () => void
}

export function AuthenticatedHeader({ onCartClick }: AuthenticatedHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { itemCount, total } = useCart()
  const { user, logout, isLoading } = useAuth()
  const { settings } = useAppSettings()
  const router = useRouter()
  const pathname = usePathname()

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick()
    } else {
      router.push("/checkout")
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Definir itens de navegação sempre disponíveis
  const navigationItems = [
    { href: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
    { href: "/pedidos", label: "Pedidos", icon: Package },
    { href: "/conta", label: "Dados da Conta", icon: UserCircle },
    { href: "/cupons", label: "Cupons", icon: Ticket },
    { href: "/favoritos", label: "Favoritos", icon: Heart },
    { href: "/seguranca", label: "Segurança", icon: Shield },
  ]

  // Get shortened name (first name only)
  const getShortName = (fullName: string) => {
    return fullName.split(" ")[0]
  }

  // Se ainda está carregando, mostrar skeleton
  if (isLoading) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/cardapio" className="flex items-center space-x-2">
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt={settings.restaurant_name || "Logo"} 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain rounded-lg"
                  style={{ maxWidth: '150px', maxHeight: '150px' }}
                />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {(settings.restaurant_name || "WD").charAt(0)}
                  </span>
                </div>
              )}
              <span className="font-bold text-xl text-gray-900 hidden sm:block md:text-2xl">
                {settings.restaurant_name || "William Disk Pizza"}
              </span>
            </Link>

            {/* Loading skeleton */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Se não há usuário, não renderizar (não deveria acontecer neste componente)
  if (!user) {
    return null
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/cardapio" className="flex items-center space-x-2">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.restaurant_name || "Logo"} 
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain rounded-lg"
                style={{ maxWidth: '150px', maxHeight: '150px' }}
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(settings.restaurant_name || "WD").charAt(0)}
                </span>
              </div>
            )}
            <span className="font-bold text-xl text-gray-900 hidden sm:block md:text-2xl">
              {settings.restaurant_name || "William Disk Pizza"}
            </span>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Button */}
            <Button
              variant="ghost"
              onClick={handleCartClick}
              className="flex flex-col items-center p-2 h-auto min-w-[80px] hover:bg-gray-50"
            >
              <div className="flex items-center space-x-1">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-gray-900">R$ {total.toFixed(2)}</span>
              </div>
              <span className="text-xs text-gray-500">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </span>
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 max-w-[100px] truncate">
                      {getShortName(user.name)}
                    </span>
                    <span className="text-xs text-gray-500">Minha Conta</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-0 shadow-lg border-0 bg-white rounded-xl">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl border-b">
                  <p className="text-sm font-semibold text-gray-900">Olá, {getShortName(user.name)}! 👋</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
                <div className="py-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.href} asChild className="p-0">
                        <Link
                          href={item.href}
                          className={`flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                            pathname === item.href ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500" : "text-gray-700"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${pathname === item.href ? "text-blue-600" : "text-gray-500"}`} />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </div>
                <DropdownMenuSeparator className="my-1" />
                <div className="py-2">
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600 px-4 py-3 cursor-pointer hover:bg-red-50 transition-colors font-medium"
                  >
                    <span>🚪 Sair da Conta</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Mobile Cart Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCartClick}
              className="flex flex-col items-center p-1 h-auto min-w-[60px]"
            >
              <div className="flex items-center space-x-1">
                <ShoppingBag className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-gray-900">R$ {total.toFixed(2)}</span>
              </div>
              <span className="text-xs text-gray-500">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </span>
            </Button>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Slide Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-black bg-opacity-50 z-40">
            <div className="bg-white w-80 max-w-[85vw] h-full shadow-lg animate-in slide-in-from-right">
              <nav className="py-4">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">Olá, {getShortName(user.name)}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors ${
                          pathname === item.href ? "bg-primary/10 text-primary border-r-2 border-primary" : ""
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                <div className="border-t mt-2 pt-2">
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left font-medium"
                  >
                    <span>Sair</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
