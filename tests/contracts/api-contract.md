# Contrato da API Print-Server

## Visão Geral

O `print-server` é um serviço Node.js dedicado que gerencia a impressão térmica usando impressoras Bematech MP-4200 TH. Ele expõe tanto endpoints REST quanto eventos Socket.io para comunicação com o frontend.

**Servidor:** `http://localhost:3001`

## REST API Endpoints

### GET /status

**Descrição:** Verificar se o servidor está rodando e obter informações de status.

**Request:**
```http
GET /status
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "status": "running",
  "printer": {
    "connected": true,
    "config": {
      "type": "EPSON",
      "interface": "tcp://192.168.1.100:9100",
      "characterSet": "PC860_PORTUGUESE",
      "timeout": 5000
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Servidor não disponível",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /print

**Descrição:** Imprimir um pedido na impressora térmica.

**Request:**
```http
POST /print
Content-Type: application/json

{
  "id": "order-123",
  "order_number": "001234",
  "customer_name": "João Silva",
  "customer_phone": "(11) 99999-9999",
  "customer_code": "C001",
  "delivery_address": "Rua das Flores, 123 - Centro",
  "delivery_instructions": "Portão azul",
  "payment_method": "PIX",
  "status": "RECEIVED",
  "total": 45.90,
  "order_items": [
    {
      "quantity": 2,
      "name": "Pizza Margherita",
      "size": "Grande",
      "toppings": ["Queijo extra", "Azeitona"],
      "special_instructions": "Massa fina",
      "half_and_half": {
        "firstHalf": {
          "productName": "Margherita",
          "toppings": ["Queijo extra"]
        },
        "secondHalf": {
          "productName": "Calabresa",
          "toppings": ["Cebola"]
        }
      }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Pedido impresso com sucesso",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Dados do pedido inválidos",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Erro na impressora: Impressora não conectada",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /test

**Descrição:** Executar teste de impressão.

**Request:**
```http
POST /test
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Teste de impressão executado com sucesso",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Erro no teste: Impressora não responde",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Socket.io Events

### Cliente → Servidor

#### print-order

**Descrição:** Imprimir pedido via Socket.io.

**Payload:**
```javascript
socket.emit('print-order', {
  id: "order-123",
  order_number: "001234",
  customer_name: "João Silva",
  customer_phone: "(11) 99999-9999",
  customer_code: "C001",
  delivery_address: "Rua das Flores, 123 - Centro",
  delivery_instructions: "Portão azul",
  payment_method: "PIX",
  status: "RECEIVED",
  total: 45.90,
  order_items: [
    {
      quantity: 2,
      name: "Pizza Margherita",
      size: "Grande",
      toppings: ["Queijo extra", "Azeitona"],
      special_instructions: "Massa fina"
    }
  ]
})
```

#### test-print

**Descrição:** Executar teste de impressão via Socket.io.

**Payload:**
```javascript
socket.emit('test-print')
```

#### configure-printer

**Descrição:** Configurar impressora.

**Payload:**
```javascript
socket.emit('configure-printer', {
  type: "EPSON",
  interface: "tcp://192.168.1.100:9100",
  characterSet: "PC860_PORTUGUESE",
  timeout: 5000
})
```

#### printer-status

**Descrição:** Solicitar status da impressora.

**Payload:**
```javascript
socket.emit('printer-status')
```

### Servidor → Cliente

#### print-result

**Descrição:** Resultado da impressão de pedido.

**Payload:**
```javascript
socket.on('print-result', (result) => {
  // result = {
  //   success: true,
  //   message: "Pedido impresso com sucesso"
  // }
})
```

#### test-result

**Descrição:** Resultado do teste de impressão.

**Payload:**
```javascript
socket.on('test-result', (result) => {
  // result = {
  //   success: true,
  //   message: "Teste executado com sucesso"
  // }
})
```

#### configure-result

**Descrição:** Resultado da configuração da impressora.

**Payload:**
```javascript
socket.on('configure-result', (result) => {
  // result = {
  //   success: true,
  //   message: "Impressora configurada com sucesso"
  // }
})
```

#### printer-status-result

**Descrição:** Status da impressora.

**Payload:**
```javascript
socket.on('printer-status-result', (status) => {
  // status = {
  //   connected: true,
  //   config: {
  //     type: "EPSON",
  //     interface: "tcp://192.168.1.100:9100",
  //     characterSet: "PC860_PORTUGUESE"
  //   },
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
})
```

## Estruturas de Dados

### OrderData

```typescript
interface OrderData {
  id: string
  order_number?: string
  customer_name: string
  customer_phone?: string
  customer_code?: string
  delivery_address?: string
  delivery_instructions?: string
  payment_method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'MERCADO_PAGO'
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'
  total: number
  order_items: OrderItem[]
}
```

### OrderItem

```typescript
interface OrderItem {
  quantity: number
  name: string
  size?: string
  toppings?: string[]
  special_instructions?: string
  half_and_half?: {
    firstHalf: {
      productName: string
      toppings?: string[]
    }
    secondHalf: {
      productName: string
      toppings?: string[]
    }
  }
}
```

### PrinterConfig

```typescript
interface PrinterConfig {
  type: 'EPSON' | 'STAR' | 'BEMATECH'
  interface: string // 'tcp://IP:PORT', 'COM1', 'USB', etc.
  characterSet?: string
  timeout?: number
}
```

### PrintResult

```typescript
interface PrintResult {
  success: boolean
  message: string
  timestamp?: string
}
```

## Códigos de Erro

| Código | Descrição |
|--------|----------|
| 400 | Dados inválidos na requisição |
| 404 | Endpoint não encontrado |
| 500 | Erro interno do servidor |
| 503 | Impressora não disponível |

## Compatibilidade

Este contrato é compatível com:
- Print-server versão 1.0.0+
- Node.js 18+
- Socket.io 4.7.5+
- Express 4.18.2+

## Notas de Implementação

1. **Timeout:** Todas as requisições têm timeout de 10 segundos
2. **CORS:** Configurado para aceitar requisições de `localhost:3000`
3. **Encoding:** Utiliza charset PC860_PORTUGUESE para caracteres especiais
4. **Fallback:** Frontend implementa fallback para impressão via navegador quando print-server não está disponível
5. **Produção:** Em ambiente de produção, as chamadas são simuladas para evitar erros