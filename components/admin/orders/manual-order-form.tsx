"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Store, Phone, Pizza, Package, User, MapPin, Edit3, UserPlus, Search, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProducts } from "@/hooks/useProducts"
import { useCart } from "@/hooks/useCart"
import { useCustomers } from "@/hooks/useCustomers"
import { useOrderSubmission } from "@/hooks/useOrderSubmission"
import { AdminProductModal } from "./admin-product-modal"
import { CustomerAutocomplete } from "./customer-autocomplete"
import { CartSection } from "./cart-section"
import { PaymentSection } from "./payment-section"
import { ProductsGrid } from "./products-grid"

// Importar interfaces do arquivo types
import type { 
  Product, 
  CartItem, 
  Customer, 
  OrderType,
  PaymentMethod
} from '../pdv/types'

interface ManualOrderFormProps {
  onSuccess: () => void
}

export function ManualOrderForm({ onSuccess }: ManualOrderFormProps) {
  // Hooks customizados
  const { products } = useProducts()
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateItemQuantity, 
    clearCart, 
    getCartTotal 
  } = useCart()
  const {
    customers,
    loading: customersLoading,
    loadCustomers,
    searchCustomers,
    addCustomer,
    updateCustomer
  } = useCustomers()

  
  
  // Estados gerais
  const [orderType, setOrderType] = useState<"balcao" | "telefone">("balcao")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX")
  const [notes, setNotes] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  
  // Estados do cliente
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  // Refs para rolagem automática
  const productsRef = useRef<HTMLDivElement>(null)
  const paymentRef = useRef<HTMLDivElement>(null)
  const submitRef = useRef<HTMLDivElement>(null)
  
  const { toast } = useToast()
  const { submitOrder, loading: isSubmitting } = useOrderSubmission({
    customerName,
    customerPhone,
    selectedCustomer,
    orderType,
    cartItems,
    paymentMethod,
    notes,
    calculateTotal: () => ({ subtotal: getCartTotal(), total: getCartTotal() }),
    clearCart,
    onSuccess
  })

  // Função para rolagem suave com offset
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, offset = 100) => {
    if (ref.current) {
      const modalContent = ref.current.closest('.overflow-y-auto')
      if (modalContent) {
        const elementPosition = ref.current.offsetTop
        const offsetPosition = elementPosition - offset
        
        modalContent.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }
  }

  // Rolagem automática para botão de criar pedido quando forma de pagamento é selecionada
  useEffect(() => {
    if (paymentMethod && cartItems.length > 0) {
      setTimeout(() => {
        scrollToSection(submitRef, 120)
      }, 400)
    }
  }, [paymentMethod, cartItems.length])

  // Função personalizada para lidar com seleção de cliente (inclui rolagem automática)
  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer)
    
    // Rolagem automática para seção de produtos após selecionar cliente
    setTimeout(() => {
      scrollToSection(productsRef, 80)
    }, 300)
  }

  // Função para criar novo cliente foi movida para o CustomerAutocomplete

  const addItemToCart = (item: CartItem) => {
    addToCart(item)

    // Rolagem automática para seção de forma de pagamento após adicionar produto
    setTimeout(() => {
      scrollToSection(paymentRef, 80)
    }, 500)
  }

  const calculateTotal = () => {
    const subtotal = getCartTotal()
    // Sem taxa de entrega para pedidos de balcão/telefone
    return { subtotal, total: subtotal }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleSubmitOrder = async () => {
    try {
      await submitOrder()
      // Limpar formulário após sucesso
      setNotes("")
      setOrderType("balcao")
      setPaymentMethod("PIX")
      setCustomerName("")
      setCustomerPhone("")
      setSelectedCustomer(null)
    } catch (error) {
      // O erro já é tratado no hook useOrderSubmission
      console.error('Erro ao submeter pedido:', error)
    }
  }

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
    setIsProductModalOpen(false)
  }

  const { subtotal, total } = calculateTotal()

  return (
    <div className="space-y-6">
      {/* Tipo de Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tipo de Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Balcão */}
            <Button
              type="button"
              variant={orderType === "balcao" ? "default" : "outline"}
              onClick={() => setOrderType("balcao")}
              className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                orderType === "balcao"
                  ? "bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-lg scale-105"
                  : "border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
              }`}
            >
              <Store className="h-6 w-6" />
              <span className="text-sm font-semibold text-center leading-tight">
                Balcão<br />(Retirada no local)
              </span>
            </Button>

            {/* Telefone */}
            <Button
              type="button"
              variant={orderType === "telefone" ? "default" : "outline"}
              onClick={() => setOrderType("telefone")}
              className={`h-20 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                orderType === "telefone"
                  ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-lg scale-105"
                  : "border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
              }`}
            >
              <Phone className="h-6 w-6" />
              <span className="text-sm font-semibold text-center leading-tight">
                Telefone<br />(Entrega)
              </span>
            </Button>
          </div>
          
          {/* Indicador visual da seleção atual */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                {orderType === "balcao" && <Store className="h-4 w-4 text-teal-600" />}
                {orderType === "telefone" && <Phone className="h-4 w-4 text-orange-600" />}
                <span className="font-medium">Tipo de pedido selecionado:</span>
              </div>
              <span className="font-semibold text-gray-900">
                {orderType === "balcao" ? "Balcão (Retirada no local)" : "Telefone (Entrega)"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Busca e Seleção do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca e Seleção de Cliente */}
          <CustomerAutocomplete
            onCustomerSelect={handleCustomerSelect}
            orderType={orderType}
            disabled={false}
          />




        </CardContent>
      </Card>

      {/* Seleção de Produtos */}
      <div ref={productsRef}>
        <ProductsGrid
          products={products}
          onProductClick={openProductModal}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Carrinho */}
      <CartSection
            cartItems={cartItems}
            onRemoveItem={removeFromCart}
            onUpdateQuantity={updateItemQuantity}
            formatCurrency={formatCurrency}
          />

      {/* Forma de Pagamento */}
      <PaymentSection
        ref={paymentRef}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
      />

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações (Opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações gerais sobre o pedido..."
            maxLength={200}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {notes.length}/200 caracteres
          </div>
        </CardContent>
      </Card>

      {/* Botão de Finalizar */}
      <div ref={submitRef} className="flex justify-end gap-3">
        <Button
          onClick={handleSubmitOrder}
          disabled={
            isSubmitting || 
            cartItems.length === 0 || 
            !customerName.trim() || 
            !customerPhone.trim() ||
            !selectedCustomer ||
            (orderType === 'telefone' && !selectedCustomer?.primaryAddress)
          }
          className="px-8"
        >
          {isSubmitting ? "Criando..." : `Criar Pedido - ${formatCurrency(total)}`}
        </Button>
      </div>

      {/* Modal de Produto */}
      {selectedProduct && (
        <AdminProductModal
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
          onAddToCart={addToCart}
        />
      )}
    </div>
  )
}