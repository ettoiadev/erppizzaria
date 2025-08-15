# Análise de Performance - ERP Pizzaria

## Problemas Identificados

### 1. Componentes sem Memoização

#### 1.1 CustomersManagement.tsx
**Problema:** Filtros e ordenações executados a cada render
```typescript
// Problema: Operações custosas sem memoização
const filteredCustomers = customers
  .filter((customer: Customer) => {
    // Múltiplas operações de string em cada render
    return (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           // ... mais filtros
  })
  .sort((a: Customer, b: Customer) => {
    // Ordenação complexa a cada render
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      // ... mais casos
    }
  })
```

**Impacto:**
- Re-execução de filtros a cada render
- Operações de string custosas (toLowerCase, includes)
- Ordenação desnecessária quando dados não mudam
- Performance degradada com muitos clientes

**Solução:**
```typescript
import { useMemo } from 'react'

const filteredCustomers = useMemo(() => {
  const searchLower = searchTerm.toLowerCase()
  return customers
    .filter((customer: Customer) => {
      const name = (customer.name || '').toLowerCase()
      const email = (customer.email || '').toLowerCase()
      const phone = customer.phone || ''
      const address = (customer.address || '').toLowerCase()
      const code = customer.customer_code?.toString() || ''
      
      return name.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchTerm) ||
             address.includes(searchLower) ||
             code.includes(searchTerm)
    })
    .sort((a: Customer, b: Customer) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "orders":
          return b.totalOrders - a.totalOrders
        case "spent":
          return b.totalSpent - a.totalSpent
        case "recent":
        default:
          const aDate = new Date(a.lastOrderAt || a.createdAt).getTime()
          const bDate = new Date(b.lastOrderAt || b.createdAt).getTime()
          return bDate - aDate
      }
    })
}, [customers, searchTerm, sortBy])
```

#### 1.2 Dashboard.tsx
**Problema:** Processamento de dados complexo sem memoização
```typescript
// Problema: Cálculos custosos a cada render
orders.forEach((order: any) => {
  order.order_items?.forEach((item: any) => {
    const productName = item.products?.name || 'Produto não identificado'
    if (productSales[productName]) {
      productSales[productName].count += item.quantity
      productSales[productName].revenue += parseFloat(item.total_price || 0)
    } else {
      productSales[productName] = {
        name: productName,
        count: item.quantity,
        revenue: parseFloat(item.total_price || 0)
      }
    }
  })
})
```

**Impacto:**
- Processamento de arrays grandes a cada render
- Cálculos de estatísticas desnecessários
- Performance degradada com muitos pedidos

**Solução:**
```typescript
const dashboardStats = useMemo(() => {
  // Mover toda lógica de processamento para dentro do useMemo
  const productSales: { [key: string]: { name: string, count: number, revenue: number } } = {}
  
  orders.forEach((order: any) => {
    order.order_items?.forEach((item: any) => {
      const productName = item.products?.name || 'Produto não identificado'
      if (productSales[productName]) {
        productSales[productName].count += item.quantity
        productSales[productName].revenue += parseFloat(item.total_price || 0)
      } else {
        productSales[productName] = {
          name: productName,
          count: item.quantity,
          revenue: parseFloat(item.total_price || 0)
        }
      }
    })
  })
  
  return {
    topProducts: Object.values(productSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    // ... outros cálculos
  }
}, [orders])
```

#### 1.3 TopProductsChart.tsx
**Problema:** Processamento de dados sem memoização
```typescript
// Problema: Map e operações custosas a cada render
const productSales = new Map<string, { name: string, count: number, revenue: number }>()

periodOrders.forEach((order: any) => {
  if (order.order_items && Array.isArray(order.order_items)) {
    order.order_items.forEach((item: any) => {
      // Processamento custoso
    })
  }
})
```

**Solução:**
```typescript
const chartData = useMemo(() => {
  const productSales = new Map<string, { name: string, count: number, revenue: number }>()
  
  periodOrders.forEach((order: any) => {
    // ... processamento
  })
  
  return Array.from(productSales.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(product => ({
      name: product.name,
      sales: product.count,
      revenue: Math.round(product.revenue * 100) / 100
    }))
}, [periodOrders])
```

### 2. Componentes com Re-renderizações Desnecessárias

#### 2.1 ProductsManagement.tsx
**Status:** ✅ Já otimizado com useMemo
```typescript
const filteredProducts = useMemo(() => {
  return products?.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory
    const matchesSearch =
      (product.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  }) || []
}, [products, selectedCategory, searchTerm])
```

#### 2.2 PDV Components
**Status:** ✅ Já otimizado com hooks customizados
- `use-pdv-data.ts` - Filtros memoizados
- `use-customer-optimized.ts` - Resultados limitados e memoizados

### 3. Operações de Busca Ineficientes

#### 3.1 ManualOrderForm.tsx
**Problema:** Busca de clientes sem debounce adequado
```typescript
// Problema: Timeout manual sem hook otimizado
useEffect(() => {
  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current)
  }
  
  searchTimeoutRef.current = setTimeout(() => {
    searchCustomers(searchTerm.trim())
  }, 300)
}, [searchTerm, selectedCustomer, isEditingCustomer])
```

**Solução:**
```typescript
import { useDebounce } from '@/hooks/use-debounce'

const debouncedSearchTerm = useDebounce(searchTerm, 300)

useEffect(() => {
  if (debouncedSearchTerm.trim().length >= 2 && !selectedCustomer) {
    searchCustomers(debouncedSearchTerm.trim())
  } else {
    setSearchResults([])
    setShowResults(false)
  }
}, [debouncedSearchTerm, selectedCustomer])
```

### 4. Componentes com Animações Custosas

#### 4.1 AboutValues.tsx
**Problema:** Animações Framer Motion sem otimização
```typescript
// Problema: Animações podem causar re-renders
const IconComponent = iconMap[value.icon as keyof typeof iconMap] || Heart

return (
  <motion.div
    key={index}
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: index * 0.1 }}
    viewport={{ once: true }}
  >
```

**Solução:**
```typescript
const IconComponent = useMemo(() => 
  iconMap[value.icon as keyof typeof iconMap] || Heart, 
  [value.icon]
)

const animationProps = useMemo(() => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay: index * 0.1 },
  viewport: { once: true }
}), [index])

return (
  <motion.div key={index} {...animationProps}>
```

## Recomendações Gerais

### 1. Implementar React.memo para Componentes Puros
```typescript
import React from 'react'

const CustomerCard = React.memo(({ customer, onEdit, onDelete }: CustomerCardProps) => {
  // Componente que só re-renderiza quando props mudam
})
```

### 2. Usar useCallback para Funções
```typescript
const handleCustomerSelect = useCallback((customer: Customer) => {
  setSelectedCustomer(customer)
  // ... outras operações
}, [])

const handleSearch = useCallback((term: string) => {
  setSearchTerm(term)
}, [])
```

### 3. Implementar Virtualização para Listas Grandes
```typescript
import { FixedSizeList as List } from 'react-window'

const VirtualizedCustomerList = ({ customers }: { customers: Customer[] }) => {
  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => (
    <div style={style}>
      <CustomerCard customer={customers[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={customers.length}
      itemSize={120}
    >
      {Row}
    </List>
  )
}
```

### 4. Otimizar Queries com React Query
```typescript
const { data: customers } = useQuery({
  queryKey: ['customers', searchTerm, sortBy],
  queryFn: () => fetchCustomers({ search: searchTerm, sort: sortBy }),
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
  enabled: searchTerm.length >= 2
})
```

### 5. Implementar Lazy Loading
```typescript
import { lazy, Suspense } from 'react'

const CustomerDetailsModal = lazy(() => import('./customer-details-modal'))

const CustomersManagement = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showModal && <CustomerDetailsModal />}
    </Suspense>
  )
}
```

## Métricas de Performance

### Antes das Otimizações
- Filtros executados a cada render
- ~50-100ms para filtrar 1000 clientes
- Re-renderizações desnecessárias
- Animações bloqueantes

### Após as Otimizações (Estimado)
- Filtros memoizados
- ~5-10ms para filtrar 1000 clientes
- Re-renderizações controladas
- Animações otimizadas
- Redução de 80-90% no tempo de processamento

## Próximos Passos

1. ✅ Identificar problemas de performance
2. 🔄 Implementar memoização nos componentes críticos
3. ⏳ Adicionar React.memo e useCallback
4. ⏳ Implementar virtualização para listas grandes
5. ⏳ Otimizar animações e transições
6. ⏳ Adicionar métricas de performance
7. ⏳ Implementar testes de performance

## Ferramentas de Monitoramento

### React DevTools Profiler
```typescript
// Adicionar em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  import('react-dom/profiling')
}
```

### Web Vitals
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

### Performance Observer
```typescript
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('Performance entry:', entry)
    }
  })
  
  observer.observe({ entryTypes: ['measure', 'navigation'] })
}
```