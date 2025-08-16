# 📚 Documentação das APIs - William Disk Pizza

## Visão Geral

Esta documentação descreve todas as APIs disponíveis no sistema William Disk Pizza. As APIs seguem padrões REST e retornam dados em formato JSON.

## Autenticação

A maioria das APIs requer autenticação via JWT token enviado no cookie `auth-token` ou header `Authorization: Bearer <token>`.

### Níveis de Acesso
- **Público**: Sem autenticação necessária
- **Cliente**: Usuário logado com role `customer`
- **Admin**: Usuário logado com role `admin`
- **Cozinha**: Usuário logado com role `kitchen`
- **Entregador**: Usuário logado com role `delivery`

## Estrutura de Resposta

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## APIs de Autenticação

### POST /api/auth/login
Realiza login do usuário.

**Acesso**: Público

**Body**:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta**:
```json
{
  "success": true,
  "user": {
    "id": "123",
    "email": "usuario@exemplo.com",
    "full_name": "Nome do Usuário",
    "role": "customer"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresIn": 900
}
```

### POST /api/auth/register
Registra novo usuário.

**Acesso**: Público

**Body**:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "full_name": "Nome Completo",
  "phone": "11999999999"
}
```

### POST /api/auth/logout
Realiza logout do usuário.

**Acesso**: Autenticado

### POST /api/auth/verify
Verifica se o token é válido.

**Acesso**: Autenticado

### POST /api/auth/refresh
Renova o token de acesso.

**Acesso**: Autenticado

## APIs de Produtos

### GET /api/products
Lista produtos ativos.

**Acesso**: Público

**Query Parameters**:
- `category_id` (opcional): Filtrar por categoria
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Pizza Margherita",
      "description": "Molho de tomate, mussarela e manjericão",
      "price": 35.90,
      "category_id": 1,
      "image": "url-da-imagem",
      "active": true,
      "has_sizes": true,
      "has_toppings": false,
      "sizes": [
        { "name": "Pequena", "price": 25.90 },
        { "name": "Média", "price": 35.90 },
        { "name": "Grande", "price": 45.90 }
      ]
    }
  ]
}
```

### POST /api/products
Cria novo produto.

**Acesso**: Admin

**Body**:
```json
{
  "name": "Nome do Produto",
  "description": "Descrição do produto",
  "price": 29.90,
  "category_id": 1,
  "image": "url-da-imagem",
  "available": true,
  "sizes": [
    { "name": "Pequena", "price": 19.90 },
    { "name": "Grande", "price": 29.90 }
  ],
  "toppings": [
    { "name": "Queijo Extra", "price": 3.00 }
  ]
}
```

### PUT /api/products/[id]
Atualiza produto existente.

**Acesso**: Admin

### DELETE /api/products/[id]
Remove produto.

**Acesso**: Admin

## APIs de Categorias

### GET /api/categories
Lista categorias ativas.

**Acesso**: Público

**Query Parameters**:
- `include_inactive` (opcional): Incluir categorias inativas (apenas admin)

### POST /api/categories
Cria nova categoria.

**Acesso**: Admin

**Body**:
```json
{
  "name": "Nome da Categoria",
  "description": "Descrição da categoria",
  "image": "url-da-imagem",
  "sort_order": 1
}
```

### PUT /api/categories/[id]
Atualiza categoria existente.

**Acesso**: Admin

### DELETE /api/categories/[id]
Remove categoria.

**Acesso**: Admin

## APIs de Pedidos

### GET /api/orders
Lista pedidos.

**Acesso**: Cliente (próprios pedidos), Admin/Cozinha (todos)

**Query Parameters**:
- `status` (opcional): Filtrar por status (RECEIVED, PREPARING, ON_THE_WAY, DELIVERED, CANCELLED)
- `user_id` (opcional): Filtrar por usuário (apenas admin)
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Resposta**:
```json
{
  "success": true,
  "orders": [
    {
      "id": "123",
      "status": "RECEIVED",
      "total": 45.90,
      "customer_name": "João Silva",
      "customer_phone": "11999999999",
      "customer_address": "Rua das Flores, 123",
      "payment_method": "PIX",
      "payment_status": "PENDING",
      "created_at": "2024-01-15T10:30:00Z",
      "items": [
        {
          "id": "item-1",
          "name": "Pizza Margherita",
          "quantity": 1,
          "unit_price": 35.90,
          "total_price": 35.90,
          "size": "Média",
          "toppings": []
        }
      ]
    }
  ],
  "statistics": {
    "total": 150,
    "received": 5,
    "preparing": 3,
    "onTheWay": 2,
    "delivered": 140,
    "cancelled": 0,
    "totalRevenue": 6750.50
  }
}
```

### POST /api/orders
Cria novo pedido.

**Acesso**: Cliente

**Body**:
```json
{
  "customer_name": "João Silva",
  "customer_phone": "11999999999",
  "customer_address": "Rua das Flores, 123",
  "payment_method": "PIX",
  "total": 45.90,
  "subtotal": 35.90,
  "delivery_fee": 10.00,
  "discount": 0,
  "notes": "Sem cebola",
  "items": [
    {
      "product_id": 1,
      "name": "Pizza Margherita",
      "quantity": 1,
      "unit_price": 35.90,
      "total_price": 35.90,
      "size": "Média",
      "toppings": [],
      "special_instructions": "Bem assada"
    }
  ]
}
```

### GET /api/orders/[id]
Busca pedido específico.

**Acesso**: Cliente (próprio pedido), Admin/Cozinha (qualquer)

### PUT /api/orders/[id]/status
Atualiza status do pedido.

**Acesso**: Admin/Cozinha

**Body**:
```json
{
  "status": "PREPARING",
  "notes": "Pedido em preparo"
}
```

## APIs de Clientes

### GET /api/customers
Lista clientes.

**Acesso**: Admin

**Query Parameters**:
- `search` (opcional): Buscar por nome, email ou telefone
- `status` (opcional): Filtrar por status (active, inactive, vip, regular, churned)
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

### GET /api/customers/[id]
Busca cliente específico.

**Acesso**: Admin, Cliente (próprios dados)

### PUT /api/customers/[id]
Atualiza dados do cliente.

**Acesso**: Admin, Cliente (próprios dados)

### DELETE /api/customers/[id]
Remove cliente.

**Acesso**: Admin

## APIs de Endereços

### GET /api/addresses
Lista endereços do usuário logado.

**Acesso**: Cliente

### POST /api/addresses
Cria novo endereço.

**Acesso**: Cliente

**Body**:
```json
{
  "label": "Casa",
  "street": "Rua das Flores",
  "number": "123",
  "complement": "Apto 45",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01234-567",
  "is_default": true
}
```

### PUT /api/addresses/[id]
Atualiza endereço existente.

**Acesso**: Cliente (próprio endereço)

### DELETE /api/addresses/[id]
Remove endereço.

**Acesso**: Cliente (próprio endereço)

## APIs Administrativas

### GET /api/admin/dashboard
Retorna dados do dashboard administrativo.

**Acesso**: Admin

**Resposta**:
```json
{
  "success": true,
  "data": {
    "orders": {
      "today": 25,
      "pending": 5,
      "revenue_today": 1250.50
    },
    "customers": {
      "total": 1500,
      "new_today": 3,
      "active": 450
    },
    "products": {
      "total": 45,
      "active": 42,
      "low_stock": 2
    }
  }
}
```

### GET /api/admin/settings
Lista configurações do sistema.

**Acesso**: Admin

### PUT /api/admin/settings
Atualiza configurações do sistema.

**Acesso**: Admin

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `UNAUTHORIZED` | Token inválido ou expirado |
| `FORBIDDEN` | Acesso negado para o recurso |
| `NOT_FOUND` | Recurso não encontrado |
| `VALIDATION_ERROR` | Dados de entrada inválidos |
| `DUPLICATE_ENTRY` | Tentativa de criar recurso duplicado |
| `DATABASE_ERROR` | Erro interno do banco de dados |
| `RATE_LIMIT_EXCEEDED` | Muitas requisições em pouco tempo |

## Rate Limiting

As APIs possuem rate limiting para prevenir abuso:

- **Autenticação**: 5 tentativas por minuto por IP
- **Criação de pedidos**: 10 pedidos por minuto por usuário
- **APIs gerais**: 100 requisições por minuto por IP

## Webhooks

### Mercado Pago
O sistema recebe webhooks do Mercado Pago para atualizar status de pagamentos.

**Endpoint**: `POST /api/payments/webhook`

**Headers**:
- `x-signature`: Assinatura do webhook
- `x-request-id`: ID único da requisição

## Versionamento

Atualmente todas as APIs estão na versão 1. Futuras versões serão disponibilizadas com prefixo `/api/v2/`.

## Suporte

Para dúvidas sobre as APIs, consulte:
- Logs da aplicação em `/api/health`
- Documentação técnica em `/docs/`
- Contato: contato@williamdiskpizza.com.br