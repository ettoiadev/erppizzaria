"use client"

import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAppSettings } from "@/hooks/use-app-settings"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function AdminHeader() {
  const { user, logout } = useAuth()
  const { settings } = useAppSettings()

  return (
    <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        {settings.logo_url ? (
          <img 
            src={settings.logo_url} 
            alt={settings.restaurant_name || "Logo"} 
            className="w-8 h-8 object-contain rounded-lg"
            style={{ maxWidth: '150px', maxHeight: '150px' }}
          />
        ) : (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {(settings.restaurant_name || "WD").charAt(0)}
            </span>
          </div>
        )}
        <span className="font-bold text-xl text-gray-900">
          {settings.restaurant_name ? `${settings.restaurant_name} - Admin` : "Administração"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span className="hidden md:inline">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={logout}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
