import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import { CartItem } from '../types'

interface CartProps {
  cartItems: CartItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  formatCurrency: (value: number) => string
  subtotal: number
  total: number
}

export function Cart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  formatCurrency,
  subtotal,
  total
}: CartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Carrinho ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cartItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Carrinho vazio
          </p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  {item.size && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {item.size}
                    </Badge>
                  )}
                  {item.isHalfAndHalf && item.halfAndHalf && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <p>🍕 Meio a meio:</p>
                      <p>• {item.halfAndHalf.firstHalf.productName}</p>
                      {item.halfAndHalf.firstHalf.toppings.length > 0 && (
                        <p className="ml-2 text-orange-600">
                          + {item.halfAndHalf.firstHalf.toppings.join(', ')}
                        </p>
                      )}
                      <p>• {item.halfAndHalf.secondHalf.productName}</p>
                      {item.halfAndHalf.secondHalf.toppings.length > 0 && (
                        <p className="ml-2 text-orange-600">
                          + {item.halfAndHalf.secondHalf.toppings.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                  {!item.isHalfAndHalf && item.toppings && item.toppings.length > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      + {item.toppings.join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Obs: {item.notes}
                    </p>
                  )}
                  <p className="text-sm font-medium text-primary mt-1">
                    {formatCurrency(item.price)} cada
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}