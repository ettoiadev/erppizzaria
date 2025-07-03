"use client"

import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, Copy, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CouponsPage() {
  const { toast } = useToast()

  // Mock coupons data - replace with real API call
  const coupons = [
    {
      id: "PIZZA20",
      title: "20% OFF em Pizzas",
      description: "Desconto de 20% em todas as pizzas",
      discount: "20%",
      expiresAt: "2024-02-15",
      isUsed: false,
      minValue: 30,
    },
    {
      id: "FRETE10",
      title: "Frete Grátis",
      description: "Frete grátis em pedidos acima de R$ 25",
      discount: "Frete Grátis",
      expiresAt: "2024-01-30",
      isUsed: false,
      minValue: 25,
    },
    {
      id: "WELCOME15",
      title: "Bem-vindo!",
      description: "15% de desconto no primeiro pedido",
      discount: "15%",
      expiresAt: "2024-01-20",
      isUsed: true,
      minValue: 20,
    },
  ]

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

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Cupons</h1>
          <p className="text-gray-600">Aproveite suas ofertas exclusivas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className={`relative ${
                coupon.isUsed || isExpired(coupon.expiresAt)
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
                  {isExpired(coupon.expiresAt) && !coupon.isUsed && <Badge variant="destructive">Expirado</Badge>}
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
                        <p className="text-sm font-medium">R$ {coupon.minValue}</p>
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
                      disabled={coupon.isUsed || isExpired(coupon.expiresAt)}
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

        {coupons.length === 0 && (
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
