"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, total, updateQuantity, removeItem } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    onClose()
    router.push("/checkout")
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Seu Carrinho ({items.length})</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
                <Button onClick={onClose}>Continuar Comprando</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.name}</h4>
                      
                      {/* Informações específicas para pizza meio a meio */}
                      {item.isHalfAndHalf && item.halfAndHalf ? (
                        <div className="text-xs text-gray-600 mt-1 space-y-1">
                          <div className="bg-blue-50 p-2 rounded border">
                            <p className="font-medium text-blue-800 mb-1">🍕 Pizza Meio a Meio:</p>
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">1ª metade:</span> {item.halfAndHalf.firstHalf.productName}
                                {item.halfAndHalf.firstHalf.toppings && item.halfAndHalf.firstHalf.toppings.length > 0 && (
                                  <span className="text-gray-500"> + {item.halfAndHalf.firstHalf.toppings.join(", ")}</span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">2ª metade:</span> {item.halfAndHalf.secondHalf.productName}
                                {item.halfAndHalf.secondHalf.toppings && item.halfAndHalf.secondHalf.toppings.length > 0 && (
                                  <span className="text-gray-500"> + {item.halfAndHalf.secondHalf.toppings.join(", ")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {item.size && <p className="text-xs text-gray-600 mt-1">Tamanho: {item.size}</p>}
                        </div>
                      ) : (
                        /* Informações para produtos normais */
                        <>
                          {item.size && <p className="text-xs text-gray-600">Tamanho: {item.size}</p>}
                          {item.toppings && item.toppings.length > 0 && (
                            <p className="text-xs text-gray-600">Adicionais: {item.toppings.join(", ")}</p>
                          )}
                        </>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{formatCurrency(Number(item.price) * item.quantity)}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full" size="lg">
                Finalizar Pedido
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
