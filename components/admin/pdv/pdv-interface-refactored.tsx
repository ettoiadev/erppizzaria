"use client"

import { useEffect } from "react"
import { usePDVData } from './hooks/use-pdv-data'
import { useCart } from './hooks/use-cart'
import { useCustomer } from './hooks/use-customer'
import { useOrder } from './hooks/use-order'
import { useProductModal } from './hooks/use-product-modal'
import { OrderTypeSelector } from './components/order-type-selector'
import { CustomerSearch } from './components/customer-search'
import { CustomerForm } from './components/customer-form'
import { Cart } from './components/cart'
import { PaymentSelector } from './components/payment-selector'
import { CategoryFilter } from './components/category-filter'
import { ProductGrid } from './components/product-grid'
import { ProductModal } from './components/product-modal'

export function PDVInterface() {
  // Data hooks
  const { 
    categories, 
    selectedCategory, 
    setSelectedCategory, 
    filteredProducts 
  } = usePDVData()

  // Cart hook
  const {
    cartItems,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    calculateTotal,
    clearCart
  } = useCart()

  // Customer hook
  const {
    selectedCustomer,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    customerAddress,
    setCustomerAddress,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    customerCode,
    setCustomerCode,
    isEditingCustomer,
    setIsEditingCustomer,
    handleCustomerSelect,
    handleNewCustomer,
    handleEditCustomer,
    handleClearCustomer,
    createNewCustomer,
    handleZipCodeChange,
    handleZipCodeBlur
  } = useCustomer()

  // Order hook
  const {
    orderType,
    setOrderType,
    paymentMethod,
    setPaymentMethod,
    orderNotes,
    setOrderNotes,
    isSubmitting,
    paymentSectionRef,
    formatCurrency,
    handleSubmitOrder
  } = useOrder()

  // Product modal hook
  const {
    selectedProduct,
    isProductModalOpen,
    openProductModal,
    closeProductModal,
    handleAddToCart: handleProductModalAddToCart
  } = useProductModal()

  // Calculate totals
  const { subtotal, total } = calculateTotal()

  // Auto-scroll to payment section when payment method changes
  useEffect(() => {
    if (paymentSectionRef.current) {
      paymentSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [paymentMethod])

  // Handle order submission
  const onSubmitOrder = () => {
    handleSubmitOrder(
      cartItems,
      selectedCustomer,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      createNewCustomer,
      clearCart,
      handleClearCustomer
    )
  }

  // Handle customer form save
  const handleSaveCustomer = async () => {
    if (selectedCustomer) {
      // Edit existing customer logic would go here
      setIsEditingCustomer(false)
    } else {
      // Create new customer
      const newCustomer = await createNewCustomer()
      if (newCustomer) {
        setIsEditingCustomer(false)
      }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <OrderTypeSelector 
            orderType={orderType}
            onOrderTypeChange={setOrderType}
          />

          <CustomerSearch
            orderType={orderType}
            selectedCustomer={selectedCustomer}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            searchResults={searchResults}
            isSearching={isSearching}
            customerCode={customerCode}
            onCustomerCodeChange={setCustomerCode}
            onCustomerSelect={handleCustomerSelect}
            onNewCustomer={handleNewCustomer}
            onEditCustomer={handleEditCustomer}
            onClearCustomer={handleClearCustomer}
          />

          <CustomerForm
            orderType={orderType}
            isEditingCustomer={isEditingCustomer}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            customerEmail={customerEmail}
            onCustomerEmailChange={setCustomerEmail}
            customerAddress={customerAddress}
            onCustomerAddressChange={setCustomerAddress}
            onZipCodeChange={handleZipCodeChange}
            onZipCodeBlur={handleZipCodeBlur}
            onSaveCustomer={handleSaveCustomer}
            onCancelEdit={() => setIsEditingCustomer(false)}
          />

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          <ProductGrid
            products={filteredProducts}
            onProductSelect={openProductModal}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Right Column - Cart and Payment */}
        <div className="space-y-6">
          <Cart
            cartItems={cartItems}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeItemFromCart}
            formatCurrency={formatCurrency}
            subtotal={subtotal}
            total={total}
          />

          {cartItems.length > 0 && (
            <PaymentSelector
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              orderNotes={orderNotes}
              onOrderNotesChange={setOrderNotes}
              onSubmitOrder={onSubmitOrder}
              isSubmitting={isSubmitting}
              total={total}
              formatCurrency={formatCurrency}
              cartItemsCount={cartItems.length}
              paymentSectionRef={paymentSectionRef}
            />
          )}
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        onAddToCart={(item) => {
          handleProductModalAddToCart(addItemToCart)
        }}
        formatCurrency={formatCurrency}
      />
    </div>
  )
}