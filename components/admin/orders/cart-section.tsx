"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import type { CartItem } from '../pdv/types'

interface CartSectionProps {
  cartItems: CartItem[]
  onRemoveItem: (index: number) => void
  onUpdateQuantity: (index: number, quantity: number) => void
  formatCurrency: (value: number) => string
}

export function CartSection({ 
  cartItems, 
  onRemoveItem, 
  onUpdateQuantity, 
  formatCurrency 
}: CartSectionProps) {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Itens do Pedido ({cartItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cartItems.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhum item adicionado ao pedido</p>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    
                    {item.isHalfAndHalf && item.halfAndHalf ? (
                      <div className="text-xs text-gray-600 mt-1 space-y-1">
                        <div className="bg-blue-50 p-2 rounded border">
                          <p className="font-medium text-blue-800 mb-1">🍕 Pizza Meio a Meio:</p>
                          <div className="space-y-1">
                            <div>
                              <span className="font-medium">1ª metade:</span> {item.halfAndHalf.firstHalf.productName}
                              {item.halfAndHalf.firstHalf.toppings && item.halfAndHalf.firstHalf.toppings.length > 0 && (
                                <div className="text-gray-500 ml-2">+ {item.halfAndHalf.firstHalf.toppings.join(", ")}</div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">2ª metade:</span> {item.halfAndHalf.secondHalf.productName}
                              {item.halfAndHalf.secondHalf.toppings && item.halfAndHalf.secondHalf.toppings.length > 0 && (
                                <div className="text-gray-500 ml-2">+ {item.halfAndHalf.secondHalf.toppings.join(", ")}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        {item.size && <div className="text-gray-600 mt-1">Tamanho: {item.size}</div>}
                      </div>
                    ) : (
                      <>
                        {item.size && <div className="text-gray-600 text-sm">Tamanho: {item.size}</div>}
                        {item.toppings && item.toppings.length > 0 && (
                          <div className="text-gray-600 text-sm">Adicionais: {item.toppings.join(", ")}</div>
                        )}
                      </>
                    )}
                    
                    {item.notes && (
                      <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200 mt-2">
                        <span className="font-medium">📝 Observações:</span> {item.notes}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.price)} cada</div>
                  </div>
                </div>
              </div>
            ))}

            <Separator />
            
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}