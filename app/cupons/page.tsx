"use client"

import { useState, useEffect } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, Copy, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Coupon {
  id: string
  title: string
  description: string
  discount: string
  expiresAt: string
  isUsed: boolean
  isExpired: boolean
  isMaxUsesReached: boolean
  minValue: number
  discountType: string
  discountValue: number
}

export default function CouponsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchCoupons()
    }
  }, [user?.id])

  const fetchCoupons = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/coupons?userId=${user.id}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar cupons')
      }
      
      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error('Erro ao carregar cupons:', error)
      setError('Erro ao carregar cupons. Tente novamente mais tarde.')
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cupons.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Código copiado!",
      description: `O código ${code} foi copiado para a área de transferência.`,
    })
  }

  const isExpired = (date: string) => {
    return new Date(date) < new Date()
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Cupons</h1>
            <p className="text-gray-600">Carregando suas ofertas exclusivas...</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Cupons</h1>
            <p className="text-gray-600">Aproveite suas ofertas exclusivas</p>
          </div>
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar cupons</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchCoupons}>Tentar Novamente</Button>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Cupons</h1>
          <p className="text-gray-600">Aproveite suas ofertas exclusivas</p>
        </div>

        {coupons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <Card
                key={coupon.id}
                className={`relative ${
                  coupon.isUsed || coupon.isExpired || coupon.isMaxUsesReached
                    ? "opacity-60 bg-gray-50"
                    : "border-primary/20 hover:border-primary/40 transition-colors"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{coupon.title}</CardTitle>
                    </div>
                    {coupon.isUsed && <Badge variant="secondary">Usado</Badge>}
                    {coupon.isExpired && !coupon.isUsed && <Badge variant="destructive">Expirado</Badge>}
                    {coupon.isMaxUsesReached && !coupon.isUsed && !coupon.isExpired && (
                      <Badge variant="destructive">Esgotado</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{coupon.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">{coupon.discount}</span>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Pedido mínimo</p>
                          <p className="text-sm font-medium">R$ {Number(coupon.minValue)?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Válido até {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}</span>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Código:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{coupon.id}</code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCopyCoupon(coupon.id)}
                        disabled={coupon.isUsed || coupon.isExpired || coupon.isMaxUsesReached}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Código
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cupom disponível</h3>
            <p className="text-gray-600 mb-4">Você não possui cupons no momento.</p>
            <Button asChild>
              <a href="/cardapio">Explorar Cardápio</a>
            </Button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
