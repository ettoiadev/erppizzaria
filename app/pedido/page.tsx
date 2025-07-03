"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Package, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function PedidoPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    // Redirecionar automaticamente para a lista de pedidos após 2 segundos
    const timer = setTimeout(() => {
      if (!authLoading) {
        if (user) {
          router.push("/pedidos")
        } else {
          router.push("/login?redirect=" + encodeURIComponent("/pedidos"))
        }
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [router, user, authLoading])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pedidos</h1>
            <p className="text-gray-600 mb-8">
              {user 
                ? "Redirecionando para seus pedidos..." 
                : "Você precisa fazer login para ver seus pedidos."
              }
            </p>
            <LoadingSpinner />
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Página Inicial
            </Button>
            
            {user ? (
              <Button onClick={() => router.push("/pedidos")}>
                Ver Meus Pedidos
              </Button>
            ) : (
              <Button onClick={() => router.push("/login?redirect=" + encodeURIComponent("/pedidos"))}>
                Fazer Login
              </Button>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Para acessar um pedido específico, use o link completo como 
              <code className="bg-blue-100 px-2 py-1 rounded mx-1">/pedido/[id-do-pedido]</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 