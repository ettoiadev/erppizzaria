"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useAppSettings } from "@/hooks/use-app-settings"

interface HeaderProps {
  onCartClick?: () => void
}

export function Header({ onCartClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { itemCount } = useCart()
  const { user, logout } = useAuth()
  const { settings } = useAppSettings()
  const router = useRouter()

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick()
    } else {
      router.push("/checkout")
    }
  }

  // Determinar se deve mostrar navegação completa ou simplificada
  const isAuthenticatedCustomer = user && user.role === "CUSTOMER"
  const showPublicNavigation = !isAuthenticatedCustomer

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticatedCustomer ? "/cardapio" : "/"} className="flex items-center space-x-2">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {showPublicNavigation && (
              <Link href="/" className="text-gray-700 hover:text-primary transition-colors">
                Início
              </Link>
            )}
            <Link href="/cardapio" className="text-gray-700 hover:text-primary transition-colors">
              Cardápio
            </Link>
            {showPublicNavigation && (
              <>
                <Link href="/sobre" className="text-gray-700 hover:text-primary transition-colors">
                  Sobre
                </Link>
                <Link href="/contato" className="text-gray-700 hover:text-primary transition-colors">
                  Contato
                </Link>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Olá, {user.name}</span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <User className="w-4 h-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/cadastro">Cadastrar</Link>
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={handleCartClick} className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              {showPublicNavigation && (
                <Link
                  href="/"
                  className="text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Início
                </Link>
              )}
              <Link
                href="/cardapio"
                className="text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Cardápio
              </Link>
              {showPublicNavigation && (
                <>
                  <Link
                    href="/sobre"
                    className="text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sobre
                  </Link>
                  <Link
                    href="/contato"
                    className="text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contato
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
