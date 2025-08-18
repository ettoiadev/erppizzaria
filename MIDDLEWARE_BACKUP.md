# Backup da Lógica de Middlewares

## Análise Completa dos Middlewares Removidos

### 1. Middleware Principal (middleware.ts)
```typescript
// Headers básicos de segurança
response.headers.set('X-Content-Type-Options', 'nosniff')
response.headers.set('X-Frame-Options', 'DENY')
```

### 2. Funcionalidades Identificadas

#### 2.1 Autenticação (auth-middleware.ts)
- `withAuth`: Validação básica de JWT
- `withAdminAuth`: Validação específica para admins
- `withManagerAuth`: Validação para gerentes
- `withKitchenAuth`: Validação para cozinha
- `withDeliveryAuth`: Validação para entregadores
- `getUserFromToken`: Extração de usuário do token
- `getUserFromRequest`: Extração de usuário da requisição

#### 2.2 Validação (validation-middleware.ts)
- `withValidation`: Validação usando schemas Zod
- `withQueryValidation`: Validação de query parameters
- `withParamsValidation`: Validação de parâmetros de rota
- `withFullValidation`: Validação completa

#### 2.3 Rate Limiting (rate-limit-middleware.ts)
- `withRateLimit`: Rate limiting genérico
- `withUserRateLimit`: Rate limiting por usuário
- `withAdaptiveRateLimit`: Rate limiting adaptativo
- `withPresetRateLimit`: Rate limiting com presets
- Configurações específicas para auth, api, upload

#### 2.4 Sanitização (sanitization-middleware.ts)
- `withSanitization`: Sanitização de dados
- `withPresetSanitization`: Sanitização com presets
- Presets: userForm, adminForm, searchQuery, fileUpload
- Proteção contra: SQL Injection, XSS, Path Traversal, Command Injection

#### 2.5 Logging (api-logger-middleware.ts)
- `withApiLogging`: Logging de requisições/respostas
- `withErrorHandling`: Tratamento de erros
- `withSensitiveLogging`: Logging para rotas sensíveis
- `withDebugLogging`: Logging de debug

#### 2.6 Monitoramento (error-monitoring.ts)
- `withErrorMonitoring`: Monitoramento de erros
- Métricas de performance
- Alertas automáticos

#### 2.7 Tratamento de Erros de BD (database-error-handler.ts)
- `withDatabaseErrorHandling`: Tratamento específico para erros PostgreSQL
- `withApiDatabaseErrorHandling`: Versão para APIs
- Mapeamento de códigos de erro PostgreSQL

### 3. Rotas Afetadas

#### 3.1 Rotas com Autenticação Admin
- `/api/admin/profile` - GET, PUT
- `/api/admin/password` - PUT
- `/api/admin/settings` - GET, PUT
- `/api/admin/geolocation/setup` - POST
- `/api/products/[id]` - PUT, DELETE
- `/api/categories/[id]` - PUT, DELETE
- `/api/orders/archive` - GET

#### 3.2 Rotas com Middlewares Completos
- `/api/auth/login` - POST (validação + rate limit + sanitização + logging + error monitoring)
- `/api/auth/register` - POST (logging)
- `/api/products` - GET, POST (validação + logging + error monitoring)
- `/api/categories` - GET, POST, PUT (validação + logging + error monitoring)
- `/api/orders` - GET, POST (validação + logging + error monitoring)
- `/api/coupons` - GET, POST (validação + logging + error monitoring)
- `/api/drivers` - GET, POST (validação + logging + error monitoring)
- `/api/notifications` - GET, POST, DELETE (validação + logging + error monitoring)
- `/api/favorites` - GET, POST, DELETE (validação + logging + error monitoring)
- `/api/customers` - GET (logging + error monitoring)

### 4. Configurações CORS Manuais
- `/api/auth/login` - CORS específico para https://erppizzaria-tau.vercel.app
- `/api/auth/login-simple` - CORS específico
- `/api/health` - CORS aberto (*)

### 5. Schemas de Validação Utilizados
- `userLoginSchema` - Login de usuários
- `couponSchema` - Cupons
- `driverSchema` - Motoristas
- `orderSchema` - Pedidos
- `notificationSchema` - Notificações
- `favoriteSchema` - Favoritos
- `categorySchema` - Categorias
- `categoryOrdersSchema` - Ordem de categorias
- `productSchema` - Produtos

### 6. Rate Limiting Configs
- `auth`: 5 tentativas por 15 minutos
- `api`: 100 requisições por minuto
- `upload`: 10 uploads por hora

### 7. Sanitização Presets
- `userForm`: Sanitização para formulários de usuário
- `adminForm`: Sanitização para formulários admin
- `searchQuery`: Sanitização para buscas
- `fileUpload`: Sanitização para uploads

## Estratégia de Migração

### Fase 1: Migração de Autenticação
1. Criar funções utilitárias para validação JWT
2. Implementar verificação de roles diretamente nas rotas
3. Migrar todas as rotas admin

### Fase 2: Implementação de CORS
1. Adicionar headers CORS em cada rota
2. Implementar OPTIONS handlers onde necessário

### Fase 3: Rate Limiting
1. Implementar rate limiting nas rotas críticas
2. Usar configurações específicas por tipo de rota

### Fase 4: Validação e Sanitização
1. Implementar validação Zod diretamente nas rotas
2. Adicionar sanitização de entrada

### Fase 5: Logging e Monitoramento
1. Implementar logging básico nas rotas críticas
2. Manter monitoramento de erros essencial

### Fase 6: Limpeza
1. Remover arquivos de middleware
2. Limpar importações
3. Testar todas as funcionalidades