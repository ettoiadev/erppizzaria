# Correção do Fluxo de Criação de Pedidos

## 🔍 Problema Identificado

**Issue:** Pedidos criados por clientes não apareciam na coluna "Recebidos" do Kanban em `admin/pedidos`.

### Root Cause
O problema era um **mismatch de status** entre a criação e exibição de pedidos:

1. **Order Creation API** (`app/api/orders/route.ts` linha 133): Criava pedidos com status `"PENDING"`
2. **Orders GET API** (`app/api/orders/route.ts` linha 42): Mapeava corretamente pedidos `"PENDING"` para estatísticas "received"
3. **Kanban Component** (`components/admin/orders/orders-kanban.tsx` linha 133): Filtrava pedidos por status exato, procurando por `"RECEIVED"` mas os pedidos tinham `"PENDING"`

## ✅ Solução Implementada

### 1. Correção do Status de Criação
**Arquivo:** `app/api/orders/route.ts`

```typescript
// ANTES
status: "PENDING" as const,

// DEPOIS  
status: "RECEIVED" as const,
```

### 2. Atualização das Estatísticas
**Arquivo:** `app/api/orders/route.ts`

```typescript
// ANTES
received: processedOrders.filter((o) => o.status === "PENDING").length,

// DEPOIS
received: processedOrders.filter((o) => o.status === "RECEIVED").length,
```

### 3. Script para Corrigir Pedidos Existentes
**Arquivo:** `scripts/fix-pending-orders-status.sql`

```sql
-- Atualizar pedidos existentes com status PENDING para RECEIVED
UPDATE orders 
SET status = 'RECEIVED', updated_at = NOW()
WHERE status = 'PENDING';
```

### 4. Implementação de Real-time Updates
**Arquivo:** `components/admin/orders/orders-management.tsx`

Adicionado Socket.io para atualizações em tempo real:

```typescript
// Hook para Socket.io
const { socket, connected } = useAdminSocket()

// Listeners para eventos em tempo real
useEffect(() => {
  if (!socket) return

  // Listener para novos pedidos
  const handleNewOrder = (orderData: any) => {
    // Adicionar novo pedido à lista
    setOrders(prevOrders => [newOrder, ...prevOrders])
    
    // Atualizar estatísticas
    setStatistics(prevStats => ({
      ...prevStats,
      total: prevStats.total + 1,
      received: prevStats.received + 1
    }))
    
    // Mostrar notificação
    toast({
      title: "Novo Pedido!",
      description: `Pedido #${orderData.id.slice(-8)} recebido`,
      duration: 5000
    })
  }

  // Listener para atualizações de status
  const handleStatusUpdate = (data: any) => {
    // Atualizar pedido na lista
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === data.orderId 
          ? { ...order, status: data.status }
          : order
      )
    )
    
    // Atualizar estatísticas
    // ... lógica de atualização de estatísticas
  }

  socket.on('order-received', handleNewOrder)
  socket.on('order-status-updated', handleStatusUpdate)

  return () => {
    socket.off('order-received', handleNewOrder)
    socket.off('order-status-updated', handleStatusUpdate)
  }
}, [socket, toast])
```

## 🔧 Arquivos Modificados

1. **`app/api/orders/route.ts`**
   - Linha 133: Mudança de `"PENDING"` para `"RECEIVED"`
   - Linha 42: Atualização do filtro de estatísticas

2. **`components/admin/orders/orders-management.tsx`**
   - Adicionado import do `useAdminSocket`
   - Implementado useEffect para Socket.io listeners
   - Adicionada função `getStatusLabel`

3. **`scripts/fix-pending-orders-status.sql`** (novo)
   - Script para corrigir pedidos existentes

## 🧪 Como Testar

### 1. Teste de Criação de Pedido
1. Acesse: `http://localhost:3000/cardapio`
2. Adicione produtos ao carrinho
3. Finalize o pedido
4. Verifique se aparece na coluna "Recebidos" do Kanban

### 2. Teste de Real-time Updates
1. Abra duas abas do admin: `http://localhost:3000/admin/pedidos`
2. Em uma aba, crie um pedido manual
3. Verifique se aparece automaticamente na outra aba

### 3. Teste de Atualização de Status
1. Mova um pedido entre colunas no Kanban
2. Verifique se a atualização aparece em tempo real

## 📊 Status do Sistema

- ✅ **Order Creation**: Agora usa status `"RECEIVED"`
- ✅ **Order Display**: Kanban filtra corretamente por `"RECEIVED"`
- ✅ **Real-time Updates**: Socket.io implementado
- ✅ **Statistics**: Mapeamento correto de status
- ✅ **Manual Orders**: Já usavam status `"RECEIVED"`

## 🔄 Próximos Passos

1. **Executar Script SQL**: Para corrigir pedidos existentes
2. **Testar Fluxo Completo**: Criar pedido como cliente e verificar no admin
3. **Monitorar Logs**: Verificar se Socket.io está funcionando
4. **Testar Performance**: Verificar se real-time não impacta performance

## 📝 Notas Técnicas

- O Socket.io já estava implementado no backend
- A correção mantém compatibilidade com pedidos manuais
- Real-time updates incluem notificações toast
- Estatísticas são atualizadas automaticamente
- Cleanup adequado dos listeners do Socket.io

## 🚨 Importante

**Execute o script SQL** para corrigir pedidos existentes:
```sql
-- Execute no PostgreSQL
UPDATE orders 
SET status = 'RECEIVED', updated_at = NOW()
WHERE status = 'PENDING';
```

Isso garante que todos os pedidos existentes apareçam corretamente no Kanban. 