# Documentação das APIs - ERP Pizzaria

Este documento descreve todas as APIs disponíveis no sistema ERP Pizzaria.

## Índice

- [Autenticação](#autenticação)
- [Produtos](#produtos)
- [Categorias](#categorias)
- [Pedidos](#pedidos)
- [Clientes](#clientes)
- [Motoristas](#motoristas)
- [Cupons](#cupons)
- [Favoritos](#favoritos)
- [Notificações](#notificações)
- [Pagamentos](#pagamentos)
- [Administração](#administração)
- [Sistema](#sistema)
- [Middlewares](#middlewares)
- [Códigos de Erro](#códigos-de-erro)

## Base URL

```
Production: https://erppizzaria-tau.vercel.app
Development: http://localhost:3000
```

## Autenticação

### Login de Usuário

**POST** `/api/auth/login`

Realiza login de usuário no sistema.

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "role": "customer"
  }
}
```

**Response (401):**
```json
{
  "error": "Credenciais inválidas"
}
```

### Login Simples

**POST** `/api/auth/login-simple`

Versão simplificada do login sem middlewares complexos.

## Produtos

### Listar Produtos

**GET** `/api/products`

Retorna lista de produtos ativos.

**Query Parameters:**
- `category_id` (opcional): Filtrar por categoria
- `search` (opcional): Buscar por nome
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação

**Response (200):**
```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Pizza Margherita",
      "description": "Molho de tomate, mussarela e manjericão",
      "price": 35.90,
      "category_id": "category_id",
      "image_url": "https://exemplo.com/pizza.jpg",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25
}
```

### Criar Produto

**POST** `/api/products`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Pizza Margherita",
  "description": "Molho de tomate, mussarela e manjericão",
  "price": 35.90,
  "category_id": "category_id",
  "image_url": "https://exemplo.com/pizza.jpg"
}
```

## Categorias

### Listar Categorias

**GET** `/api/categories`

Retorna lista de categorias ativas ordenadas por sort_order.

**Response (200):**
```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "Pizzas",
      "description": "Pizzas tradicionais e especiais",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Criar Categoria

**POST** `/api/categories`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Pizzas",
  "description": "Pizzas tradicionais e especiais",
  "sort_order": 1
}
```

## Pedidos

### Listar Pedidos

**GET** `/api/orders`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (opcional): Filtrar por status
- `customer_id` (opcional): Filtrar por cliente
- `date_from` (opcional): Data inicial (YYYY-MM-DD)
- `date_to` (opcional): Data final (YYYY-MM-DD)
- `limit` (opcional): Limite de resultados
- `offset` (opcional): Offset para paginação

**Response (200):**
```json
{
  "orders": [
    {
      "id": "order_id",
      "customer_id": "customer_id",
      "status": "pending",
      "total_amount": 45.90,
      "delivery_address": "Rua das Flores, 123",
      "items": [
        {
          "product_id": "product_id",
          "quantity": 1,
          "unit_price": 35.90,
          "total_price": 35.90
        }
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150
}
```

### Criar Pedido

**POST** `/api/orders`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_id": "customer_id",
  "delivery_address": "Rua das Flores, 123",
  "items": [
    {
      "product_id": "product_id",
      "quantity": 1,
      "unit_price": 35.90
    }
  ],
  "coupon_code": "DESCONTO10",
  "payment_method": "credit_card"
}
```

### Arquivar Pedidos

**POST** `/api/orders/archive`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "order_ids": ["order_id_1", "order_id_2"],
  "archive_reason": "Pedidos antigos"
}
```

## Clientes

### Listar Clientes

**GET** `/api/customers`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "customers": [
    {
      "id": "customer_id",
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "phone": "(11) 99999-9999",
      "addresses": [
        {
          "id": "address_id",
          "street": "Rua das Flores",
          "number": "123",
          "neighborhood": "Centro",
          "city": "São Paulo",
          "state": "SP",
          "zip_code": "01234-567"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 500
}
```

## Motoristas

### Listar Motoristas

**GET** `/api/drivers`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "drivers": [
    {
      "id": "driver_id",
      "name": "Carlos Santos",
      "phone": "(11) 88888-8888",
      "vehicle_type": "motorcycle",
      "license_plate": "ABC-1234",
      "is_active": true,
      "current_location": {
        "lat": -23.5505,
        "lng": -46.6333
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Criar Motorista

**POST** `/api/drivers`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Carlos Santos",
  "phone": "(11) 88888-8888",
  "vehicle_type": "motorcycle",
  "license_plate": "ABC-1234"
}
```

## Cupons

### Listar Cupons

**GET** `/api/coupons`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "coupons": [
    {
      "id": "coupon_id",
      "code": "DESCONTO10",
      "discount_type": "percentage",
      "discount_value": 10,
      "minimum_order_value": 30.00,
      "max_uses": 100,
      "used_count": 25,
      "valid_from": "2024-01-01T00:00:00Z",
      "valid_until": "2024-12-31T23:59:59Z",
      "is_active": true
    }
  ]
}
```

### Criar Cupom

**POST** `/api/coupons`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "DESCONTO10",
  "discount_type": "percentage",
  "discount_value": 10,
  "minimum_order_value": 30.00,
  "max_uses": 100,
  "valid_from": "2024-01-01T00:00:00Z",
  "valid_until": "2024-12-31T23:59:59Z"
}
```

## Favoritos

### Listar Favoritos

**GET** `/api/favorites`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `user_id` (obrigatório): ID do usuário

**Response (200):**
```json
{
  "favorites": [
    {
      "id": "favorite_id",
      "user_id": "user_id",
      "product_id": "product_id",
      "product": {
        "id": "product_id",
        "name": "Pizza Margherita",
        "price": 35.90,
        "image_url": "https://exemplo.com/pizza.jpg"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Adicionar Favorito

**POST** `/api/favorites`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user_id",
  "product_id": "product_id"
}
```

## Notificações

### Listar Notificações

**GET** `/api/notifications`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `user_id` (opcional): Filtrar por usuário
- `read` (opcional): Filtrar por lidas/não lidas
- `type` (opcional): Filtrar por tipo

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "user_id": "user_id",
      "title": "Pedido Confirmado",
      "message": "Seu pedido #123 foi confirmado",
      "type": "order_update",
      "is_read": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Criar Notificação

**POST** `/api/notifications`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user_id",
  "title": "Pedido Confirmado",
  "message": "Seu pedido #123 foi confirmado",
  "type": "order_update"
}
```

## Pagamentos

### Webhook de Pagamento

**POST** `/api/payments/webhook`

Webhook para receber notificações de pagamento do MercadoPago.

**Headers:**
```
Content-Type: application/json
X-Signature: <mercadopago_signature>
```

**Request Body:**
```json
{
  "id": "payment_id",
  "live_mode": true,
  "type": "payment",
  "date_created": "2024-01-01T00:00:00Z",
  "application_id": "app_id",
  "user_id": "user_id",
  "version": 1,
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "payment_id"
  }
}
```

## Administração

### Perfil do Admin

**GET** `/api/admin/profile`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "admin": {
    "id": "admin_id",
    "email": "admin@exemplo.com",
    "name": "Administrador",
    "role": "admin",
    "permissions": ["read", "write", "delete"],
    "last_login": "2024-01-01T00:00:00Z"
  }
}
```

### Alterar Senha do Admin

**PUT** `/api/admin/password`

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "senha_atual",
  "new_password": "nova_senha"
}
```

### Zonas de Entrega

**GET** `/api/admin/delivery-zones`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "zones": [
    {
      "id": "zone_id",
      "name": "Centro",
      "delivery_fee": 5.00,
      "min_order_value": 25.00,
      "estimated_time": 30,
      "is_active": true,
      "boundaries": {
        "type": "Polygon",
        "coordinates": [[[-46.6333, -23.5505]]]
      }
    }
  ]
}
```

## Sistema

### Status do Sistema

**GET** `/api/system-status`

Verifica o status geral do sistema.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": {
    "connected": true,
    "version": "supabase",
    "response_time": 45
  },
  "services": {
    "api": "healthy",
    "database": "healthy",
    "cache": "healthy"
  },
  "metrics": {
    "total_orders": 1250,
    "total_customers": 500,
    "total_products": 25
  }
}
```

### Auditoria Completa

**GET** `/api/audit-complete`

**Headers:**
```
Authorization: Bearer <admin_token>
```

Realiza auditoria completa do sistema.

**Response (200):**
```json
{
  "audit_id": "audit_id",
  "timestamp": "2024-01-01T00:00:00Z",
  "status": "completed",
  "database": {
    "tables_checked": 15,
    "missing_tables": [],
    "indexes": 25
  },
  "apis": {
    "critical": {
      "tested": 7,
      "working": 7,
      "failed": 0
    },
    "functional": {
      "tested": 5,
      "working": 5,
      "failed": 0
    }
  },
  "security": {
    "rls_policies": 12,
    "vulnerabilities": 0
  }
}
```

### Health Check

**GET** `/api/health`

Verificação rápida de saúde da API.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 86400
}
```

## Middlewares

Todas as APIs utilizam uma stack de middlewares para garantir segurança, performance e monitoramento:

### Middlewares Aplicados

1. **Rate Limiting**: Limita requisições por IP/usuário
2. **Sanitização**: Remove caracteres maliciosos dos inputs
3. **Validação**: Valida dados de entrada usando Zod schemas
4. **Autenticação**: Verifica tokens JWT
5. **Autorização**: Verifica permissões de acesso
6. **Logging**: Registra todas as requisições e respostas
7. **Error Monitoring**: Monitora e reporta erros
8. **Database Error Handling**: Trata erros de banco de dados

### Rate Limits

- **Autenticação**: 5 tentativas por minuto
- **APIs Gerais**: 100 requisições por minuto
- **Busca**: 50 requisições por minuto
- **Upload**: 10 requisições por minuto
- **Webhook**: 1000 requisições por minuto

## Códigos de Erro

### Códigos HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Não autorizado
- `404` - Não encontrado
- `409` - Conflito (recurso já existe)
- `422` - Dados não processáveis
- `429` - Muitas requisições (rate limit)
- `500` - Erro interno do servidor

### Estrutura de Erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos",
    "details": {
      "field": "email",
      "issue": "Formato de email inválido"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req_123456"
  }
}
```

### Códigos de Erro Personalizados

- `AUTH_REQUIRED` - Autenticação necessária
- `INVALID_TOKEN` - Token inválido ou expirado
- `INSUFFICIENT_PERMISSIONS` - Permissões insuficientes
- `VALIDATION_ERROR` - Erro de validação de dados
- `RESOURCE_NOT_FOUND` - Recurso não encontrado
- `DUPLICATE_RESOURCE` - Recurso duplicado
- `RATE_LIMIT_EXCEEDED` - Limite de requisições excedido
- `DATABASE_ERROR` - Erro de banco de dados
- `EXTERNAL_SERVICE_ERROR` - Erro em serviço externo

## Autenticação e Autorização

### Tipos de Token

1. **User Token**: Para clientes regulares
2. **Admin Token**: Para administradores
3. **Service Token**: Para comunicação entre serviços

### Headers de Autenticação

```
Authorization: Bearer <jwt_token>
```

### Estrutura do JWT

```json
{
  "sub": "user_id",
  "email": "usuario@exemplo.com",
  "role": "customer",
  "permissions": ["read"],
  "iat": 1640995200,
  "exp": 1641081600
}
```

## Versionamento

Atualmente todas as APIs estão na versão 1. Futuras versões serão disponibilizadas com prefixo:

- `v1`: `/api/...` (atual)
- `v2`: `/api/v2/...` (futuro)

## Suporte

Para dúvidas sobre a API:

- **Documentação**: Este documento
- **Logs**: Verifique os logs da aplicação
- **Monitoramento**: Dashboard de monitoramento
- **Testes**: Execute a suite de testes da API

## Changelog

### v1.0.0 (2024-01-01)
- Versão inicial da API
- Implementação de todas as rotas principais
- Sistema de autenticação JWT
- Middlewares de segurança e monitoramento