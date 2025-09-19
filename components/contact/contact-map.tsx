"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation } from "lucide-react"

export function ContactMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <MapPin className="h-6 w-6 mr-2 text-red-600" />
          Nossa Localização
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Placeholder para o mapa - em produção seria integrado com Google Maps */}
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p className="font-semibold">Mapa Interativo</p>
              <p className="text-sm">Rua das Pizzas, 123 - Vila Italiana</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold">Rua das Pizzas, 123</p>
              <p className="text-gray-600">Vila Italiana - São Paulo, SP</p>
            </div>
            <button className="flex items-center space-x-2 text-red-600 hover:text-red-700">
              <Navigation className="h-4 w-4" />
              <span className="text-sm font-medium">Como Chegar</span>
            </button>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Pontos de Referência:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Próximo ao Shopping Vila Italiana</li>
              <li>Em frente à Padaria do João</li>
              <li>200m do metrô Vila Italiana</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
