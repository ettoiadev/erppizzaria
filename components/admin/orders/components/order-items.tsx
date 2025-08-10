import { Badge } from "@/components/ui/badge"
import type { OrderItem } from "../types"
import { formatCurrency } from "../utils"

interface OrderItemsProps {
  items: OrderItem[]
}

export function OrderItems({ items }: OrderItemsProps) {
  return (
    <div className="space-y-2">
      {items?.map((item, index) => (
        <div key={index} className="text-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className="font-medium">
                {item.quantity}x {item.products?.name || (item as any).name || 'Produto'}
              </span>
              {item.size && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {item.size}
                </Badge>
              )}
            </div>
            <span className="font-medium text-green-600">
              {formatCurrency(item.unit_price * item.quantity)}
            </span>
          </div>
          
          {/* Pizza meio a meio */}
          {item.half_and_half && (
            <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <div className="font-medium text-yellow-800 mb-1">🍕 Pizza Meio a Meio:</div>
              <div className="space-y-1">
                <div>
                  <span className="font-medium">1ª metade:</span> {item.half_and_half.firstHalf?.productName}
                  {item.half_and_half.firstHalf?.toppings && item.half_and_half.firstHalf.toppings.length > 0 && (
                    <div className="ml-2 text-gray-600">
                      + {item.half_and_half.firstHalf.toppings.join(', ')}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-medium">2ª metade:</span> {item.half_and_half.secondHalf?.productName}
                  {item.half_and_half.secondHalf?.toppings && item.half_and_half.secondHalf.toppings.length > 0 && (
                    <div className="ml-2 text-gray-600">
                      + {item.half_and_half.secondHalf.toppings.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Adicionais (apenas se não for pizza meio a meio) */}
          {!item.half_and_half && item.toppings && item.toppings.length > 0 && (
            <div className="ml-4 text-xs text-gray-600">
              + {item.toppings.join(', ')}
            </div>
          )}
          
          {/* Instruções especiais */}
          {item.special_instructions && (
            <div className="ml-4 text-xs text-blue-600 bg-blue-50 p-1 rounded mt-1">
              📝 {item.special_instructions}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}