'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface DeliveryResult {
  deliverable: boolean
  delivery_fee?: number
  estimated_time?: number
  distance_km?: number
  zone_name?: string
  zone_color?: string
  formatted_address?: string
  message?: string
  method?: string
  error?: string
  max_radius_km?: number
}

interface DeliveryCalculatorProps {
  onDeliveryChange: (result: DeliveryResult & { address?: string }) => void
  initialAddress?: string
  className?: string
}

export default function DeliveryCalculator({ 
  onDeliveryChange, 
  initialAddress = '',
  className = ''
}: DeliveryCalculatorProps) {
  const [address, setAddress] = useState(initialAddress)
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<DeliveryResult | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  // Auto-calcular quando o endereço inicial muda
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress)
      if (initialAddress.trim().length > 10) {
        calculateDelivery(initialAddress)
      }
    }
  }, [initialAddress])

  const calculateDelivery = async (addressToCalculate?: string) => {
    const targetAddress = addressToCalculate || address
    
    if (!targetAddress.trim()) {
      setResult({ 
        deliverable: false, 
        error: 'Digite um endereço para calcular a entrega',
        message: 'Endereço obrigatório'
      })
      return
    }

    if (targetAddress.trim().length < 10) {
      setResult({ 
        deliverable: false, 
        error: 'Digite um endereço mais completo',
        message: 'Endereço muito curto'
      })
      return
    }

    setCalculating(true)
    setHasCalculated(true)
    
    try {
      const response = await fetch('/api/delivery/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: targetAddress.trim() })
      })

      const data = await response.json()
      setResult(data)
      
      // Notificar o componente pai
      onDeliveryChange({
        ...data,
        address: targetAddress.trim()
      })

    } catch (error) {
      console.error('Erro ao calcular entrega:', error)
      const errorResult = {
        deliverable: false,
        error: 'Erro ao calcular entrega. Tente novamente.',
        message: 'Erro de conexão'
      }
      setResult(errorResult)
      onDeliveryChange(errorResult)
    } finally {
      setCalculating(false)
    }
  }

  const handleAddressChange = (value: string) => {
    setAddress(value)
    // Limpar resultado anterior se o endereço mudou significativamente
    if (result && Math.abs(value.length - address.length) > 5) {
      setResult(null)
      setHasCalculated(false)
      onDeliveryChange({ deliverable: false })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      calculateDelivery()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Endereço de Entrega
        </label>
        <div className="flex space-x-2">
          <Input
            placeholder="Digite seu endereço completo (rua, número, bairro, cidade)..."
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={calculating}
          />
          <Button 
            onClick={() => calculateDelivery()} 
            disabled={calculating || !address.trim() || address.trim().length < 10}
            className="shrink-0"
          >
            {calculating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculando...
              </>
            ) : (
              'Calcular'
            )}
          </Button>
        </div>
        
        {address.trim() && address.trim().length < 10 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Digite um endereço mais completo para calcular a entrega
          </p>
        )}
      </div>

      {calculating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Calculando entrega...</p>
                <p className="text-sm text-blue-600">Verificando distância e zona de entrega</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !calculating && hasCalculated && (
        <Card className={`border ${
          result.deliverable 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <CardContent className="p-4">
            {result.deliverable ? (
              <div className="space-y-3">
                {/* Header com status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Entrega Disponível</span>
                  </div>
                  {result.zone_color && (
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: result.zone_color }}
                      title={result.zone_name}
                    />
                  )}
                </div>

                {/* Zona de entrega */}
                {result.zone_name && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {result.zone_name}
                    </span>
                    {result.method && (
                      <Badge variant="outline" className="text-xs">
                        {result.method === 'cache' ? 'Cache' : 
                         result.method === 'zone_match' ? 'Zona' : 
                         result.method === 'fallback' ? 'Padrão' : 'Calculado'}
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Detalhes da entrega */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <span className="text-gray-600">Taxa:</span>
                      <span className="ml-1 font-semibold text-green-800">
                        {result.delivery_fee === 0 ? 'Grátis' : `R$ ${Number(result.delivery_fee)?.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-gray-600">Tempo:</span>
                      <span className="ml-1 font-semibold text-blue-800">
                        {result.estimated_time} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informações adicionais */}
                {result.distance_km && (
                  <div className="text-xs text-gray-600 border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span>Distância: {Number(result.distance_km).toFixed(1)} km</span>
                      {result.formatted_address && (
                        <span className="text-right max-w-xs truncate" title={result.formatted_address}>
                          {result.formatted_address}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Mensagem de sucesso */}
                {result.message && (
                  <p className="text-sm text-green-700 italic">
                    {result.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header com erro */}
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Entrega Não Disponível</span>
                </div>

                {/* Mensagem de erro */}
                <div className="text-sm text-red-700">
                  <p className="font-medium">{result.message || result.error}</p>
                  
                  {result.distance_km && result.max_radius_km && (
                    <div className="mt-2 text-xs text-red-600">
                      <p>Distância: {Number(result.distance_km).toFixed(1)} km</p>
                      <p>Raio máximo: {result.max_radius_km} km</p>
                    </div>
                  )}
                </div>

                {/* Sugestões */}
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <p className="font-medium mb-1">Sugestões:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verifique se o endereço está correto</li>
                    <li>Inclua o bairro e a cidade</li>
                    <li>Entre em contato conosco para verificar a disponibilidade</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não calculou ainda */}
      {!result && !calculating && hasCalculated && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Digite seu endereço completo para calcular a taxa de entrega</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}