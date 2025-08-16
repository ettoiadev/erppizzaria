import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">🍕 William Disk Pizza</h1>
        <p className="text-xl text-muted-foreground mb-8">
          As melhores pizzas da cidade, entregues na sua porta!
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/menu">Ver Cardápio</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>🚚 Entrega Rápida</CardTitle>
            <CardDescription>
              Entregamos em até 30 minutos na sua região
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🍕 Ingredientes Frescos</CardTitle>
            <CardDescription>
              Sempre usamos os melhores ingredientes
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💳 Pagamento Fácil</CardTitle>
            <CardDescription>
              Pague online ou na entrega
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Pronto para pedir?</h2>
        <Button asChild size="lg">
          <Link href="/menu">Começar Pedido</Link>
        </Button>
      </div>
    </div>
  )
}