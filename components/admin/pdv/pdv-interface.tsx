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
import { ShoppingCart, Plus, Minus, Trash2, Store, Phone, CreditCard, Pizza, Package, User, MapPin, Edit3, UserPlus, Search, Loader2, AlertCircle, Banknote, Smartphone, Wallet, Filter, Grid3X3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image?: string
  showImage?: boolean
  available: boolean
  productNumber?: string
  categoryId?: string
  category_name?: string
  sizes?: { name: string; price: number }[]
  toppings?: { name: string; price: number }[]
}

interface Category {
  id: string
  name: string
  description?: string
  image?: string
  sort_order?: number
  active: boolean
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  size?: string
  toppings?: string[]
  notes?: string
  isHalfAndHalf?: boolean
  halfAndHalf?: {
    firstHalf: {
      productId: string
      productName: string
      toppings: string[]
    }
    secondHalf: {
      productId: string
      productName: string
      toppings: string[]
    }
  }
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  primaryAddress?: {
    id: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
    label: string
    is_default: boolean
  } | null
  totalOrders: number
  createdAt: string
}

interface CustomerAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
}

interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function PDVInterface() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // Estados de cliente
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  
  // Estados de autocomplete
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Estados de endereço
  const [customerAddress, setCustomerAddress] = useState<CustomerAddress>({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: ""
  })
  
  // Estados para busca de CEP
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [cepError, setCepError] = useState("")
  
  // Estados gerais
  const [orderType, setOrderType] = useState<"balcao" | "telefone">("balcao")
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [notes, setNotes] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  
  // Refs para rolagem automática
  const productsRef = useRef<HTMLDivElement>(null)
  const paymentRef = useRef<HTMLDivElement>(null)
  const submitRef = useRef<HTMLDivElement>(null)
  
  const { toast } = useToast()
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Função para rolagem suave com offset
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, offset = 100) => {
    if (ref.current) {
      const elementPosition = ref.current.offsetTop
      const offsetPosition = elementPosition - offset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // Buscar clientes com debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Não buscar se já temos um cliente selecionado e não estamos editando
    if (selectedCustomer && !isEditingCustomer) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCustomers(searchTerm.trim())
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, selectedCustomer, isEditingCustomer])

  // Rolagem automática para botão de criar pedido quando forma de pagamento é selecionada
  useEffect(() => {
    if (paymentMethod && cartItems.length > 0) {
      setTimeout(() => {
        scrollToSection(submitRef, 120)
      }, 400)
    }
  }, [paymentMethod, cartItems.length])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        const availableProducts = Array.isArray(data) ? data : (data.products || [])
        setProducts(availableProducts.filter((p: Product) => p.available))
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      })
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const activeCategories = (data.categories || []).filter((c: Category) => c.active)
        setCategories(activeCategories)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive",
      })
    }
  }

  const searchCustomers = async (term: string) => {
    try {
      setIsSearching(true)
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(term)}&limit=10`)
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.customers || [])
        setShowResults(true)
      } else {
        console.error('Erro na busca de clientes')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone)
    setCustomerEmail(customer.email)
    setSearchTerm("") // Limpar termo de busca
    setSearchResults([]) // Limpar resultados
    setShowResults(false)
    setIsEditingCustomer(false)

    // Remover foco do campo de busca
    const searchInput = document.getElementById('customer-search') as HTMLInputElement
    if (searchInput) {
      searchInput.blur()
    }

    // Preencher endereço se existir
    if (customer.primaryAddress) {
      setCustomerAddress({
        street: customer.primaryAddress.street,
        number: customer.primaryAddress.number,
        complement: customer.primaryAddress.complement || "",
        neighborhood: customer.primaryAddress.neighborhood,
        city: customer.primaryAddress.city,
        state: customer.primaryAddress.state,
        zip_code: customer.primaryAddress.zip_code
      })
    } else {
      // Limpar endereço se não existir
      setCustomerAddress({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zip_code: ""
      })
    }

    // Rolagem automática para seção de produtos após selecionar cliente
    setTimeout(() => {
      scrollToSection(productsRef, 80)
    }, 300)
  }

  const handleNewCustomer = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para criar um novo cliente",
        variant: "destructive",
      })
      return
    }

    const nameFromSearch = searchTerm.trim()
    
    setSelectedCustomer(null)
    setCustomerName(nameFromSearch)
    setCustomerPhone("")
    setCustomerEmail("")
    setSearchTerm("") // Limpar termo de busca
    setSearchResults([]) // Limpar resultados
    setShowResults(false)
    setIsEditingCustomer(true)

    // Remover foco do campo de busca
    const searchInput = document.getElementById('customer-search') as HTMLInputElement
    if (searchInput) {
      searchInput.blur()
    }
    
    // Limpar endereço
    setCustomerAddress({
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: ""
    })
  }

  const handleEditCustomer = () => {
    setIsEditingCustomer(true)
    setSearchTerm(customerName)
  }

  const handleClearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerName("")
    setCustomerPhone("")
    setCustomerEmail("")
    setSearchTerm("")
    setIsEditingCustomer(false)
    setShowResults(false)
    
    // Limpar endereço
    setCustomerAddress({
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: ""
    })
  }

  // Função para formatar CEP
  const formatZipCode = (zipCode: string) => {
    // Remove all non-numeric characters
    const numbers = zipCode.replace(/\D/g, "")
    // Format as XXXXX-XXX
    if (numbers.length <= 5) {
      return numbers
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  // Função para buscar CEP na API do ViaCEP
  const searchZipCode = async (zipCode: string) => {
    setIsLoadingCEP(true)
    setCepError("")

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`)
      const data: ViaCEPResponse = await response.json()

      if (data.erro) {
        setCepError("CEP não encontrado. Verifique o código postal informado.")
        return
      }

      setCustomerAddress(prev => ({
        ...prev,
        zip_code: formatZipCode(zipCode),
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }))

      toast({
        title: "CEP encontrado",
        description: "Endereço preenchido automaticamente",
      })
    } catch (error) {
      setCepError("Erro ao buscar CEP. Tente novamente.")
      console.error("Error fetching ZIP code:", error)
    } finally {
      setIsLoadingCEP(false)
    }
  }

  // Função para lidar com mudança no CEP
  const handleZipCodeChange = (zipCode: string) => {
    const formattedZipCode = formatZipCode(zipCode)

    setCustomerAddress(prev => ({
      ...prev,
      zip_code: formattedZipCode,
    }))

    // Clear address fields if ZIP code is incomplete and clear any errors
    const numbersOnly = zipCode.replace(/\D/g, "")
    if (numbersOnly.length < 8) {
      setCepError("")
    }
  }

  // Função para buscar CEP quando o usuário sair do campo (onBlur)
  const handleZipCodeBlur = () => {
    const numbersOnly = customerAddress.zip_code.replace(/\D/g, "")
    if (numbersOnly.length === 8) {
      searchZipCode(numbersOnly)
    }
  }

  const createNewCustomer = async () => {
    try {
      const customerData = {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || undefined,
        address: orderType === 'telefone' ? customerAddress : undefined
      }

      const response = await fetch('/api/customers/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar cliente')
      }

      const result = await response.json()
      return result.customer

    } catch (error: any) {
      console.error('Erro ao criar cliente:', error)
      throw error
    }
  }

  const addItemToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        (cartItem) =>
          cartItem.id === item.id &&
          cartItem.size === item.size &&
          JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings) &&
          cartItem.isHalfAndHalf === item.isHalfAndHalf &&
          JSON.stringify(cartItem.halfAndHalf) === JSON.stringify(item.halfAndHalf)
      )

      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem === existingItem 
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity } 
            : cartItem
        )
      }

      return [...prevItems, item]
    })

    // Rolagem automática para seção de forma de pagamento após adicionar produto
    setTimeout(() => {
      scrollToSection(paymentRef, 80)
    }, 500)
  }

  const removeItemFromCart = (index: number) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index))
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromCart(index)
      return
    }
    setCartItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    )
  }

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    // Sem taxa de entrega para pedidos de balcão/telefone
    return { subtotal, total: subtotal }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Mapeamento das formas de pagamento para o backend
  const mapPaymentMethodToBackend = (displayValue: string): string => {
    const paymentMapping: Record<string, string> = {
      "PIX": "PIX",
      "Dinheiro": "CASH", 
      "Cartão de Crédito": "CREDIT_CARD",
      "Cartão de Débito": "DEBIT_CARD"
    }
    console.log(`🔄 [PAYMENT_MAPPING] Convertendo "${displayValue}" → "${paymentMapping[displayValue] || displayValue}"`)
    return paymentMapping[displayValue] || displayValue
  }

  const handleSubmitOrder = async () => {
    // Validações
    if (!customerName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!customerPhone.trim()) {
      toast({
        title: "Erro", 
        description: "Telefone do cliente é obrigatório",
        variant: "destructive",
      })
      return
    }

    // Validar endereço para pedidos de telefone
    if (orderType === 'telefone' && !selectedCustomer?.primaryAddress) {
      const requiredAddressFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zip_code']
      for (const field of requiredAddressFields) {
        if (!customerAddress[field as keyof CustomerAddress]?.trim()) {
          toast({
            title: "Erro",
            description: `Campo ${field} do endereço é obrigatório para entrega`,
            variant: "destructive",
          })
          return
        }
      }
    }

    if (cartItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { subtotal, total } = calculateTotal()
      
      let finalCustomerId = selectedCustomer?.id

      // Criar cliente se necessário
      if (!selectedCustomer && isEditingCustomer) {
        const newCustomer = await createNewCustomer()
        finalCustomerId = newCustomer.id
        
        toast({
          title: "Cliente criado",
          description: `Cliente ${newCustomer.name} cadastrado com sucesso`,
        })
      }

      if (!finalCustomerId) {
        throw new Error("ID do cliente não encontrado")
      }

      // Preparar endereço de entrega
      let deliveryAddress = ""
      if (orderType === 'balcao') {
        deliveryAddress = "Manual (Balcão)"
      } else {
        if (selectedCustomer?.primaryAddress) {
          // Usar endereço existente do cliente
          const addr = selectedCustomer.primaryAddress
          deliveryAddress = `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''} - ${addr.neighborhood}, ${addr.city}/${addr.state} - CEP: ${addr.zip_code}`
        } else if (customerAddress.street) {
          // Usar endereço fornecido
          deliveryAddress = `${customerAddress.street}, ${customerAddress.number}${customerAddress.complement ? ` - ${customerAddress.complement}` : ''} - ${customerAddress.neighborhood}, ${customerAddress.city}/${customerAddress.state} - CEP: ${customerAddress.zip_code}`
        } else {
          deliveryAddress = "Manual (Telefone)"
        }
      }
      
      const orderData = {
        customerId: finalCustomerId,
        items: cartItems.map(item => ({
          id: item?.id || '',
          product_id: item?.id || '',
          name: item?.name || '',
          quantity: item?.quantity || 1,
          price: item?.price || 0,
          unit_price: item?.price || 0,
          size: item?.size || '',
          toppings: item?.toppings || [],
          notes: item?.notes || '',
          isHalfAndHalf: item?.isHalfAndHalf || false,
          halfAndHalf: item?.halfAndHalf || null
        })),
        total,
        subtotal,
        delivery_fee: 0,
        name: customerName,
        phone: customerPhone,
        orderType: orderType,
        deliveryAddress: deliveryAddress,
        paymentMethod: mapPaymentMethodToBackend(paymentMethod),
        notes: notes.trim() || undefined
      }

      console.log('Enviando pedido PDV:', orderData)

      const response = await fetch('/api/orders/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar pedido')
      }

      const result = await response.json()
      
      toast({
        title: "Sucesso",
        description: `Pedido PDV criado com sucesso! ID: #${result.id ? result.id.slice(-8) : 'N/A'}`,
      })

      // Limpar formulário
      setCartItems([])
      handleClearCustomer()
      setNotes("")
      setOrderType("balcao")
      setPaymentMethod("PIX")

    } catch (error: any) {
      console.error('Erro ao criar pedido PDV:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pedido PDV",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  // Filtrar produtos por categoria
  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(product => product.categoryId === selectedCategory)

  const { subtotal, total } = calculateTotal()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Coluna Esquerda: Produtos e Categorias */}
      <div className="lg:col-span-2 space-y-4 overflow-y-auto">
        {/* Filtro de Categorias */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtrar por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className="h-12 px-6 text-base font-medium"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Todas
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-12 px-6 text-base font-medium"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grid de Produtos */}
        <Card ref={productsRef}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Produtos {selectedCategory !== "all" && `- ${categories.find(c => c.id === selectedCategory)?.name}`}
              <Badge variant="secondary" className="ml-2">
                {filteredProducts.length} itens
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer bg-white hover:bg-gray-50"
                  onClick={() => openProductModal(product)}
                >
                  <div className="space-y-3">
                    {product.showImage && product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-20 object-cover rounded"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-base leading-tight">
                        {product.productNumber ? `${product.productNumber} - ${product.name}` : product.name}
                      </h4>
                      <p className="text-lg font-bold text-primary mt-1">
                        {formatCurrency(product.price)}
                      </p>
                      {product.category_name && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {product.category_name}
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" className="w-full h-10 text-base font-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {selectedCategory === "all" 
                    ? "Nenhum produto disponível" 
                    : "Nenhum produto encontrado nesta categoria"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita: Pedido e Cliente */}
      <div className="space-y-4 overflow-y-auto">
        {/* Dados do Cliente - Simplificado para PDV */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Autocomplete de Clientes */}
            <div className="relative">
              <Label htmlFor="customer-search" className="text-base font-medium">
                Buscar Cliente *
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="customer-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={selectedCustomer && !isEditingCustomer 
                    ? `${selectedCustomer.name} - ${selectedCustomer.phone}` 
                    : "Digite nome ou telefone..."
                  }
                  disabled={selectedCustomer && !isEditingCustomer}
                  className="pl-10 h-12 text-base"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Resultados da busca */}
              {showResults && searchTerm.length >= 2 && (
                <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border-2">
                  <CardContent className="p-0">
                    {/* Opção de criar novo cliente sempre no topo */}
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault() // Evita que o input perca foco antes do clique
                        handleNewCustomer()
                      }}
                      className="p-4 hover:bg-blue-50 cursor-pointer border-b border-dashed border-blue-300 bg-blue-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-blue-600">
                        <UserPlus className="h-5 w-5" />
                        <span className="font-medium text-base">➕ Adicionar novo cliente</span>
                        {searchTerm.trim() && (
                          <span className="text-sm text-blue-500">"{searchTerm.trim()}"</span>
                        )}
                      </div>
                    </div>

                    {/* Lista de clientes encontrados */}
                    {searchResults.length > 0 && (
                      <>
                        {searchResults.map((customer) => (
                          <div
                            key={customer.id}
                            onMouseDown={(e) => {
                              e.preventDefault() // Evita que o input perca foco antes do clique
                              handleCustomerSelect(customer)
                            }}
                            className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <User className="h-5 w-5 text-blue-600" />
                                  <span className="font-medium text-base">{customer.name}</span>
                                  {customer.totalOrders > 0 && (
                                    <Badge variant="secondary" className="text-sm">
                                      <Package className="h-3 w-3 mr-1" />
                                      {customer.totalOrders} pedidos
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    {customer.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Mensagem quando não há resultados */}
                    {searchResults.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        Nenhum cliente encontrado com "{searchTerm}"
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Cliente selecionado */}
            {selectedCustomer && !isEditingCustomer && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Cliente Selecionado</span>
                      {selectedCustomer.totalOrders > 0 && (
                        <Badge variant="secondary">
                          <Package className="h-3 w-3 mr-1" />
                          {selectedCustomer.totalOrders} pedidos
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditCustomer}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCustomer}
                        className="text-red-600 hover:text-red-700"
                      >
                        Trocar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="font-medium">Nome:</span> {selectedCustomer.name}
                      </div>
                      <div>
                        <span className="font-medium">Telefone:</span> {selectedCustomer.phone}
                      </div>
                    </div>
                    
                    {selectedCustomer.email && (
                      <div>
                        <span className="font-medium">E-mail:</span> {selectedCustomer.email}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulário simplificado de cliente para PDV */}
            {(isEditingCustomer || (!selectedCustomer && searchTerm.length >= 2)) && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customerName" className="text-base font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nome do cliente"
                      required
                      className="h-12 text-base mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone" className="text-base font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      required
                      className="h-12 text-base mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipo de Pedido - Simplificado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Tipo de Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {/* Balcão */}
              <Button
                type="button"
                variant={orderType === "balcao" ? "default" : "outline"}
                onClick={() => setOrderType("balcao")}
                className={`h-16 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  orderType === "balcao"
                    ? "bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-lg scale-105"
                    : "border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
                }`}
              >
                <Store className="h-6 w-6" />
                <span className="text-sm font-semibold">Balcão</span>
              </Button>

              {/* Telefone */}
              <Button
                type="button"
                variant={orderType === "telefone" ? "default" : "outline"}
                onClick={() => setOrderType("telefone")}
                className={`h-16 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  orderType === "telefone"
                    ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-lg scale-105"
                    : "border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
                }`}
              >
                <Phone className="h-6 w-6" />
                <span className="text-sm font-semibold">Entrega</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Carrinho */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Itens ({cartItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum item adicionado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.size && <div className="text-xs text-gray-600">Tamanho: {item.size}</div>}
                        {item.toppings && item.toppings.length > 0 && (
                          <div className="text-xs text-gray-600">Adicionais: {item.toppings.join(", ")}</div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItemFromCart(index)}
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
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="font-medium text-sm bg-white px-3 py-1 rounded border min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="font-medium text-primary">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forma de Pagamento */}
        <Card ref={paymentRef}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {/* PIX */}
              <Button
                type="button"
                variant={paymentMethod === "PIX" ? "default" : "outline"}
                onClick={() => setPaymentMethod("PIX")}
                className={`h-16 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  paymentMethod === "PIX"
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-lg scale-105"
                    : "border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                }`}
              >
                <Smartphone className="h-6 w-6" />
                <span className="text-sm font-semibold">PIX</span>
              </Button>

              {/* Dinheiro */}
              <Button
                type="button"
                variant={paymentMethod === "Dinheiro" ? "default" : "outline"}
                onClick={() => setPaymentMethod("Dinheiro")}
                className={`h-16 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  paymentMethod === "Dinheiro"
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 shadow-lg scale-105"
                    : "border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300"
                }`}
              >
                <Banknote className="h-6 w-6" />
                <span className="text-sm font-semibold">Dinheiro</span>
              </Button>

              {/* Cartão de Crédito */}
              <Button
                type="button"
                variant={paymentMethod === "Cartão de Crédito" ? "default" : "outline"}
                onClick={() => setPaymentMethod("Cartão de Crédito")}
                className={`h-16 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  paymentMethod === "Cartão de Crédito"
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg scale-105"
                    : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm font-semibold">Crédito</span>
              </Button>

              {/* Cartão de Débito */}
              <Button
                type="button"
                variant={paymentMethod === "Cartão de Débito" ? "default" : "outline"}
                onClick={() => setPaymentMethod("Cartão de Débito")}
                className={`h-16 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  paymentMethod === "Cartão de Débito"
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-lg scale-105"
                    : "border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                }`}
              >
                <Wallet className="h-6 w-6" />
                <span className="text-sm font-semibold">Débito</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Finalizar */}
        <div ref={submitRef}>
          <Button
            onClick={handleSubmitOrder}
            disabled={
              loading || 
              cartItems.length === 0 || 
              !customerName.trim() || 
              !customerPhone.trim() ||
              (!selectedCustomer && !isEditingCustomer)
            }
            className="w-full h-16 text-xl font-bold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <ShoppingCart className="h-6 w-6 mr-2" />
                Finalizar Pedido - {formatCurrency(total)}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Modal de Produto - Reutiliza o mesmo modal do ManualOrderForm */}
      {selectedProduct && (
        <AdminProductModal
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
          onAddToCart={addItemToCart}
        />
      )}
    </div>
  )
}

// Modal de produto adaptado para uso administrativo (mesmo do ManualOrderForm)
interface AdminProductModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart: (item: CartItem) => void
}

function AdminProductModal({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart 
}: AdminProductModalProps) {
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [quantity, setQuantity] = useState(1)

  // Estados para pizza meio a meio
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false)
  const [availablePizzas, setAvailablePizzas] = useState<Product[]>([])
  const [secondHalfProduct, setSecondHalfProduct] = useState<string>("")
  const [firstHalfToppings, setFirstHalfToppings] = useState<string[]>([])
  const [secondHalfToppings, setSecondHalfToppings] = useState<string[]>([])
  
  // Estado para controlar qual aba de adicionais está ativa
  const [activeToppingsTab, setActiveToppingsTab] = useState<'first' | 'second'>('first')

  // Verificar se o produto é uma pizza
  const isPizza = product.name.toLowerCase().includes('pizza') || 
                  ['pizzas tradicionais', 'pizzas especiais'].some(cat => 
                    product.categoryId && cat.toLowerCase().includes('pizza'))

  // Inicializar tamanho padrão quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedSize(product.sizes?.[0]?.name || "")
      setSelectedToppings([])
      setNotes("")
      setQuantity(1)
      setIsHalfAndHalf(false)
      setSecondHalfProduct("")
      setFirstHalfToppings([])
      setSecondHalfToppings([])
      setActiveToppingsTab('first')
      
      if (isPizza) {
        fetchAvailablePizzas()
      }
    }
  }, [isOpen, product, isPizza])

  const fetchAvailablePizzas = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : (data.products || [])
        
        // Filtrar apenas pizzas disponíveis, excluindo o produto atual
        const pizzas = products.filter((p: Product) => 
          p.id !== product.id && 
          p.available && 
          (p.name.toLowerCase().includes('pizza') || 
           ['pizzas tradicionais', 'pizzas especiais', 'pizzas doce'].some((cat: string) => 
             p.categoryId && cat.toLowerCase().includes('pizza')))
        )
        
        setAvailablePizzas(pizzas)
      }
    } catch (error) {
      console.error('🍕 [PDV] Erro ao carregar pizzas:', error)
    }
  }

  const selectedSizePrice = Number(product.sizes?.find((size) => size.name === selectedSize)?.price || product.price)
  
  const toppingsPrice = isHalfAndHalf 
    ? (firstHalfToppings.reduce((total, topping) => {
        const toppingData = product.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0) + secondHalfToppings.reduce((total, topping) => {
        const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
        const toppingData = secondProduct?.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0))
    : selectedToppings.reduce((total, topping) => {
        const toppingData = product.toppings?.find((t) => t.name === topping)
        return total + Number(toppingData?.price || 0)
      }, 0)

  const basePrice = isHalfAndHalf && secondHalfProduct
    ? (() => {
        const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
        const secondProductSize = secondProduct?.sizes?.find(size => size.name === selectedSize)
        const secondPrice = Number(secondProductSize?.price || secondProduct?.price || 0)
        
        // Usar o MAIOR preço entre os dois sabores
        const higherPrice = Math.max(selectedSizePrice, secondPrice)
        
        return higherPrice
      })()
    : selectedSizePrice

  const totalPrice = (basePrice + toppingsPrice) * quantity

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleAddToCart = () => {
    if (isHalfAndHalf && !secondHalfProduct) {
      alert("Por favor, selecione o segundo sabor para a pizza meio a meio")
      return
    }

    const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
    const cleanProductId = product.id.toString().replace(/--+$/, '').trim()
    const cleanSecondProductId = secondHalfProduct ? secondHalfProduct.toString().replace(/--+$/, '').trim() : ''

    const cartItem = isHalfAndHalf 
      ? {
          id: `${cleanProductId}`,
          name: `Pizza Meio a Meio: ${product.name} / ${secondProduct?.name}`,
          price: basePrice + toppingsPrice,
          quantity,
          image: product.image,
          size: selectedSize,
          notes: notes.trim() || undefined,
          isHalfAndHalf: true,
          halfAndHalf: {
            firstHalf: {
              productId: cleanProductId,
              productName: product.name,
              toppings: firstHalfToppings
            },
            secondHalf: {
              productId: cleanSecondProductId,
              productName: secondProduct?.name || '',
              toppings: secondHalfToppings
            }
          }
        }
      : {
          id: cleanProductId,
          name: product.name,
          price: selectedSizePrice + toppingsPrice,
          quantity,
          image: product.image,
          size: selectedSize,
          toppings: selectedToppings,
          notes: notes.trim() || undefined,
        }

    onAddToCart(cartItem)
    onClose()
  }

  const handleToppingChange = (topping: string, checked: boolean, isSecondHalf = false) => {
    if (isHalfAndHalf) {
      if (isSecondHalf) {
        if (checked) {
          setSecondHalfToppings([...secondHalfToppings, topping])
        } else {
          setSecondHalfToppings(secondHalfToppings.filter((t) => t !== topping))
        }
      } else {
        if (checked) {
          setFirstHalfToppings([...firstHalfToppings, topping])
        } else {
          setFirstHalfToppings(firstHalfToppings.filter((t) => t !== topping))
        }
      }
    } else {
      if (checked) {
        setSelectedToppings([...selectedToppings, topping])
      } else {
        setSelectedToppings(selectedToppings.filter((t) => t !== topping))
      }
    }
  }

  const resetHalfAndHalfState = () => {
    setSecondHalfProduct("")
    setFirstHalfToppings([])
    setSecondHalfToppings([])
    setActiveToppingsTab('first')
  }

  const handleHalfAndHalfToggle = (enabled: boolean) => {
    setIsHalfAndHalf(enabled)
    if (!enabled) {
      resetHalfAndHalfState()
    } else {
      setSelectedToppings([]) // Limpar toppings normais
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {product.productNumber ? `${product.productNumber} - ${product.name}` : product.name}
            {isPizza && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                <Pizza className="w-3 h-3 mr-1" />
                Pizza
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {product.showImage && product.image && (
            <div className="h-[150px] overflow-hidden rounded-lg">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          )}

          <p className="text-gray-600 text-base">{product.description}</p>

          {/* Opção Pizza Meio a Meio - apenas para pizzas */}
          {isPizza && (
            <div className={`border-2 rounded-lg p-4 transition-all duration-200 ${
              isHalfAndHalf 
                ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300 shadow-md' 
                : 'bg-blue-50 border-blue-200 hover:border-blue-300'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <Checkbox
                  id="half-and-half"
                  checked={isHalfAndHalf}
                  onCheckedChange={handleHalfAndHalfToggle}
                  className="border-2"
                />
                <Label htmlFor="half-and-half" className="text-base font-bold text-blue-800 cursor-pointer flex items-center gap-2">
                  <span className="text-xl">🍕</span>
                  Pizza Meio a Meio (2 Sabores)
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white animate-pulse">
                    Popular!
                  </Badge>
                </Label>
              </div>
              {isHalfAndHalf && (
                <div className="mt-3 p-2 bg-white rounded border border-orange-200">
                  <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    Modo Meio a Meio Ativado - Configure os sabores abaixo
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tamanhos */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <Label className="text-lg font-semibold mb-3 block">Escolha o tamanho</Label>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                {product.sizes.map((size) => (
                  <div key={size.name} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={size.name} id={size.name} />
                    <Label htmlFor={size.name} className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <span className="text-base font-medium">{size.name}</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(size.price)}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Seleção de sabores - Normal ou Meio a Meio */}
          {isHalfAndHalf ? (
            <div className="space-y-4 bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-4">
                <Pizza className="w-5 h-5 text-orange-600" />
                <Label className="text-lg font-bold text-orange-800">Configure sua Pizza Meio a Meio</Label>
              </div>
              
              {/* Seleção do segundo sabor */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-orange-700">
                  Primeiro sabor: <span className="font-bold">{product.name}</span>
                </Label>
                <Label className="text-base font-medium text-orange-700">Segundo sabor:</Label>
                <Select value={secondHalfProduct} onValueChange={setSecondHalfProduct}>
                  <SelectTrigger className="border-orange-200 focus:border-orange-400 h-12 text-base">
                    <SelectValue placeholder="Selecione o segundo sabor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePizzas.map((pizza) => (
                      <SelectItem key={pizza.id} value={pizza.id}>
                        {pizza.productNumber ? `${pizza.productNumber} - ${pizza.name}` : pizza.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Navegação para adicionais */}
              {secondHalfProduct && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-2 text-base">
                      <span className="text-lg">🧄</span>
                      Escolha os Adicionais para cada Metade
                    </h4>
                    
                    {/* Botões de navegação */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <Button
                        type="button"
                        variant={activeToppingsTab === 'first' ? 'default' : 'outline'}
                        onClick={() => setActiveToppingsTab('first')}
                        className={`w-full text-sm font-medium p-3 h-auto flex flex-col items-center gap-1 ${
                          activeToppingsTab === 'first' 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
                            : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }`}
                      >
                        <span className="text-xs opacity-80">1ª Metade</span>
                        <span className="font-bold text-center leading-tight">
                          {product.name.length > 14 ? product.name.substring(0, 14) + "..." : product.name}
                        </span>
                        {firstHalfToppings.length > 0 && (
                          <Badge variant="secondary" className="text-xs bg-white/20 text-current">
                            {firstHalfToppings.length} item{firstHalfToppings.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant={activeToppingsTab === 'second' ? 'default' : 'outline'}
                        onClick={() => setActiveToppingsTab('second')}
                        className={`w-full text-sm font-medium p-3 h-auto flex flex-col items-center gap-1 ${
                          activeToppingsTab === 'second' 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
                            : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }`}
                      >
                        <span className="text-xs opacity-80">2ª Metade</span>
                        <span className="font-bold text-center leading-tight">
                          {(() => {
                            const secondName = availablePizzas.find(p => p.id === secondHalfProduct)?.name || ''
                            return secondName.length > 14 ? secondName.substring(0, 14) + "..." : secondName
                          })()}
                        </span>
                        {secondHalfToppings.length > 0 && (
                          <Badge variant="secondary" className="text-xs bg-white/20 text-current">
                            {secondHalfToppings.length} item{secondHalfToppings.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </Button>
                    </div>

                    {/* Conteúdo dos adicionais */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      {activeToppingsTab === 'first' ? (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                            Adicionais para: {product.name}
                          </h5>
                          {product.toppings && product.toppings.length > 0 ? (
                            <div className="space-y-3">
                              {product.toppings.map((topping) => (
                                <div key={topping.name} className="flex items-center space-x-3 p-2 border rounded hover:bg-white">
                                  <Checkbox
                                    id={`first-${topping.name}`}
                                    checked={firstHalfToppings.includes(topping.name)}
                                    onCheckedChange={(checked) => handleToppingChange(topping.name, checked as boolean, false)}
                                  />
                                  <Label htmlFor={`first-${topping.name}`} className="flex-1 cursor-pointer">
                                    <div className="flex justify-between">
                                      <span className="text-base">{topping.name}</span>
                                      <span className="font-semibold text-primary">+ {formatCurrency(topping.price)}</span>
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">Nenhum adicional disponível para este sabor</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {(() => {
                            const secondProduct = availablePizzas.find(p => p.id === secondHalfProduct)
                            return (
                              <div>
                                <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                  <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                  Adicionais para: {secondProduct?.name}
                                </h5>
                                {secondProduct?.toppings && secondProduct.toppings.length > 0 ? (
                                  <div className="space-y-3">
                                    {secondProduct.toppings.map((topping) => (
                                      <div key={topping.name} className="flex items-center space-x-3 p-2 border rounded hover:bg-white">
                                        <Checkbox
                                          id={`second-${topping.name}`}
                                          checked={secondHalfToppings.includes(topping.name)}
                                          onCheckedChange={(checked) => handleToppingChange(topping.name, checked as boolean, true)}
                                        />
                                        <Label htmlFor={`second-${topping.name}`} className="flex-1 cursor-pointer">
                                          <div className="flex justify-between">
                                            <span className="text-base">{topping.name}</span>
                                            <span className="font-semibold text-primary">+ {formatCurrency(topping.price)}</span>
                                          </div>
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500">Nenhum adicional disponível para este sabor</p>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Adicionais normais */
            product.toppings && product.toppings.length > 0 && (
              <div>
                <Label className="text-lg font-semibold mb-3 block">Adicionais (opcionais)</Label>
                <div className="space-y-3">
                  {product.toppings.map((topping) => (
                    <div key={topping.name} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={topping.name}
                        checked={selectedToppings.includes(topping.name)}
                        onCheckedChange={(checked) => handleToppingChange(topping.name, checked as boolean)}
                      />
                      <Label htmlFor={topping.name} className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <span className="text-base">{topping.name}</span>
                          <span className="font-semibold text-primary">+ {formatCurrency(topping.price)}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Campo de Observações */}
          <div>
            <Label htmlFor="notes" className="text-lg font-semibold mb-3 block">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguma observação sobre este item..."
              maxLength={140}
              className="resize-none text-base"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {notes.length}/140 caracteres
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-3">
              <Label className="font-semibold text-base">Quantidade:</Label>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{formatCurrency(totalPrice)}</div>
              {isHalfAndHalf && secondHalfProduct && (
                <p className="text-xs text-orange-600 font-medium">Baseado no maior valor entre os sabores</p>
              )}
            </div>
          </div>

          <Button onClick={handleAddToCart} className="w-full h-14 text-lg font-bold">
            <Plus className="h-5 w-5 mr-2" />
            Adicionar ao Pedido - {formatCurrency(totalPrice)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}