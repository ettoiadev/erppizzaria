# Plano de Migração Técnica: Supabase → PostgreSQL Auto-hospedado

## Resumo Executivo

Este documento apresenta um plano de migração técnica detalhado e priorizado para migrar a aplicação Next.js do Supabase para PostgreSQL auto-hospedado. A análise do código revela que o projeto já possui infraestrutura PostgreSQL configurada e bibliotecas de autenticação customizadas implementadas, facilitando significativamente o processo de migração.

### Status Atual da Infraestrutura

* ✅ **Docker Compose**: PostgreSQL configurado em `docker-compose.yml`

* ✅ **Schema**: Definido em `init.sql` com 8 tabelas principais

* ✅ **Pool de Conexão**: Implementado em `lib/database.ts`

* ✅ **Autenticação Customizada**: Implementada em `lib/auth.ts` com JWT

* ✅ **Middleware**: Configurado em `middleware.ts` com verificação JWT

* ⚠️ **API Routes**: Ainda utilizam `supabase.from()` para CRUD

* ⚠️ **Frontend**: Contexto de auth customizado, mas sem uso direto do Supabase client

***

## Fase 1: Análise do Ambiente e Banco de Dados

### 1.1 Mapeamento de Variáveis de Ambiente

**Arquivo**: `.env.example`

**Variáveis Supabase Identificadas**:

```env
# Supabase (a serem removidas)
SUPABASE_URL=https://zrkxsetbsyecbatqbojr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Variáveis PostgreSQL Já Configuradas**:

```env
# PostgreSQL (já implementadas)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erppizzaria
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=erppizzaria
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### 1.2 Análise do Schema PostgreSQL

**Arquivo**: `init.sql`

**Tabelas Implementadas**:

1. `profiles` - Usuários e autenticação
2. `categories` - Categorias de produtos
3. `products` - Produtos do cardápio
4. `customers` - Clientes
5. `customer_addresses` - Endereços dos clientes
6. `orders` - Pedidos
7. `order_items` - Itens dos pedidos
8. `admin_settings` - Configurações administrativas

**Recursos Implementados**:

* ✅ Extensões UUID e pgcrypto

* ✅ Índices otimizados para performance

* ✅ Triggers para `updated_at`

* ✅ Índices GIN para busca textual

* ✅ Usuário admin padrão

***

## Fase 2: Auditoria das Rotas de API Backend

### 2.1 Rotas que Utilizam Supabase

**Arquivos Identificados**:

#### Autenticação

* `app/api/auth/login/route.ts` - ❌ Usa `supabase.from('profiles')`

* `app/api/auth/register/route.ts` - ❌ Usa `getSupabaseServerClient()`

* `app/api/admin/register/route.ts` - ❌ Usa `getSupabaseServerClient()`

* `app/api/admin/password/route.ts` - ❌ Usa `getSupabaseServerClient()`

#### Produtos e Categorias

* `app/api/products/route.ts` - ✅ Já usa `query()` do `lib/database.ts`

* `app/api/categories/route.ts` - ❌ Provavelmente usa Supabase

#### Pedidos

* `app/api/orders/route.ts` - ❌ Provavelmente usa Supabase

* `app/api/orders/manual/route.ts` - ❌ Usa `supabase.from()`

#### Clientes

* `app/api/customers/[id]/route.ts` - ❌ Usa `getCustomerById` de `lib/db-supabase.ts`

* `app/api/customers/route.ts` - ❌ Provavelmente usa Supabase

#### Administração

* `app/api/admin/data-management/delete-clients/route.ts` - ❌ Usa `supabase.from()`

* `app/api/admin/data-management/delete-sales/route.ts` - ❌ Usa `supabase.from()`

* `app/api/admin/debug/route.ts` - ❌ Usa `getSupabaseServerClient()`

* `app/api/fix-dashboard/route.ts` - ❌ Usa `supabase.from()`

### 2.2 Categorização de Operações CRUD

**SELECT (Consultas)**:

* Busca de produtos ativos

* Listagem de pedidos

* Verificação de usuários

* Configurações administrativas

**INSERT (Inserções)**:

* Criação de usuários

* Novos pedidos

* Produtos e categorias

**UPDATE (Atualizações)**:

* Status de pedidos

* Dados de usuários

* Configurações

**DELETE (Exclusões)**:

* Remoção de clientes

* Limpeza de dados de vendas

***

## Fase 3: Auditoria de Autenticação e Middleware

### 3.1 Análise do Middleware

**Arquivo**: `middleware.ts`

**Status**: ✅ **JÁ MIGRADO**

* Usa JWT customizado (não Supabase Auth)

* Verificação de token via `verifyJWT()`

* Proteção de rotas admin e públicas

* Injeção de dados do usuário nos headers

### 3.2 Sistema de Autenticação

**Arquivo**: `lib/auth.ts`

**Status**: ✅ **JÁ IMPLEMENTADO**

* Registro e login customizados

* Hash de senhas com bcrypt

* Geração e verificação de JWT

* Gerenciamento de permissões

* Integração com PostgreSQL via `lib/database.ts`

### 3.3 Contexto de Autenticação Frontend

**Arquivo**: `contexts/auth-context.tsx`

**Status**: ✅ **JÁ MIGRADO**

* Não usa Supabase client

* Comunicação via API routes customizadas

* Gerenciamento de estado local

* Refresh token implementado

***

## Fase 4: Auditoria do Frontend

### 4.1 Componentes e Páginas

**Análise Realizada**:

* ✅ **Componentes Admin**: Não usam Supabase client diretamente

* ✅ **Páginas de Autenticação**: Usam contexto customizado

* ✅ **Cardápio**: Busca dados via API routes

* ✅ **Hooks**: `use-app-settings.ts` usa fetch para `/api/settings`

**Arquivo de Compatibilidade**:

* `lib/db-supabase.ts` - ⚠️ Arquivo deprecated que re-exporta funções

***

## Planoe d Migração Priorizado

### 🔴 **PRIORIDADE ALTA - Crítico para Funcionamento**

#### Tarefa 1: Migrar Rotas de Autenticação

**Arquivos a Modificar**:

* [ ] `app/api/auth/login/route.ts`

* [ ] `app/api/auth/register/route.ts`

* [ ] `app/api/admin/register/route.ts`

* [ ] `app/api/admin/password/route.ts`

**Ação**: Substituir `supabase.from('profiles')` por `query()` de `lib/database.ts`
**Risco**: Alto - Quebra de autenticação
**Estimativa**: 4-6 horas

#### Tarefa 2: Migrar Rotas de Pedidos

**Arquivos a Modificar**:

* [ ] `app/api/orders/route.ts`

* [ ] `app/api/orders/manual/route.ts`

* [ ] `app/api/orders/[id]/route.ts`

**Ação**: Implementar funções CRUD usando pool PostgreSQL
**Risco**: Alto - Core business logic
**Estimativa**: 6-8 horas

### 🟡 **PRIORIDADE MÉDIA - Funcionalidades Principais**

#### Tarefa 3: Migrar Rotas de Clientes

**Arquivos a Modificar**:

* [ ] `app/api/customers/route.ts`

* [ ] `app/api/customers/[id]/route.ts`

**Ação**: Substituir importações de `lib/db-supabase.ts` por `lib/db/customers.ts`
**Risco**: Médio
**Estimativa**: 3-4 horas

#### Tarefa 4: Migrar Rotas de Produtos e Categorias

**Arquivos a Modificar**:

* [ ] `app/api/categories/route.ts`

* [ ] `app/api/categories/[id]/route.ts`

**Ação**: Implementar usando funções já existentes em `lib/db/categories.ts`
**Risco**: Médio
**Estimativa**: 2-3 horas

### 🟢 **PRIORIDADE BAIXA - Funcionalidades Administrativas**

#### Tarefa 5: Migrar Rotas Administrativas

**Arquivos a Modificar**:

* [ ] `app/api/admin/data-management/delete-clients/route.ts`

* [ ] `app/api/admin/data-management/delete-sales/route.ts`

* [ ] `app/api/admin/debug/route.ts`

* [ ] `app/api/fix-dashboard/route.ts`

**Ação**: Substituir `supabase.from()` por queries PostgreSQL diretas
**Risco**: Baixo - Funcionalidades administrativas
**Estimativa**: 4-5 horas

#### Tarefa 6: Limpeza e Otimização

**Arquivos a Modificar**:

* [ ] `lib/supabase.ts` - Remover arquivo

* [ ] `lib/db-supabase.ts` - Remover arquivo deprecated

* [ ] `package.json` - Remover dependências Supabase

* [ ] `.env.example` - Remover variáveis Supabase

**Ação**: Limpeza de código e dependências
**Risco**: Baixo
**Estimativa**: 1-2 horas

***

## Estratégia de Implementação

### Abordagem Recomendada

1. **Migração Incremental**: Migrar uma rota por vez
2. **Testes Unitários**: Validar cada migração
3. **Backup de Dados**: Antes de qualquer alteração
4. **Rollback Plan**: Manter versão Supabase como fallback

### Padrão de Substituição

**Antes (Supabase)**:

```typescript
const supabase = getSupabaseServerClient()
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_id', customerId)
```

**Depois (PostgreSQL)**:

```typescript
const orders = await query(
  'SELECT * FROM orders WHERE customer_id = $1',
  [customerId]
)
```

### Validação de Migração

**Checklist por Rota**:

* [ ] Funcionalidade mantida

* [ ] Performance equivalente ou melhor

* [ ] Tratamento de erros implementado

* [ ] Logs de auditoria funcionando

* [ ] Testes passando

***

## Riscos e Mitigações

### 🔴 **Riscos Altos**

1. **Quebra de Autenticação**

   * **Mitigação**: Testar em ambiente de desenvolvimento

   * **Rollback**: Manter rotas Supabase como backup

2. **Perda de Dados**

   * **Mitigação**: Backup completo antes da migração

   * **Validação**: Comparar contagens de registros

### 🟡 **Riscos Médios**

1. **Incompatibilidade de Schema**

   * **Mitigação**: Validar schema PostgreSQL vs Supabase

   * **Ação**: Ajustar `init.sql` se necessário

2. **Performance Degradada**

   * **Mitigação**: Monitorar queries e otimizar índices

   * **Ação**: Usar EXPLAIN ANALYZE para análise

***

## Cronograma Estimado

| Fase                  | Duração | Dependências   |
| --------------------- | ------- | -------------- |
| Preparação e Backup   | 2h      | -              |
| Migração Autenticação | 6h      | Preparação     |
| Migração Pedidos      | 8h      | Autenticação   |
| Migração Clientes     | 4h      | Pedidos        |
| Migração Produtos     | 3h      | Clientes       |
| Migração Admin        | 5h      | Produtos       |
| Limpeza e Testes      | 3h      | Admin          |
| **Total**             | **31h** | **\~4-5 dias** |

***

## Conclusão

A migração é **altamente viável** devido à infraestrutura já implementada:

✅ **Vantagens**:

* PostgreSQL já configurado

* Sistema de autenticação customizado implementado

* Pool de conexão otimizado

* Middleware já migrado

* Frontend não depende do Supabase client

⚠️ **Desafios**:

* Substituição de \~15 rotas de API

* Validação de integridade de dados

* Testes de regressão

🎯 **Resultado Esperado**:

* Redução de dependências externas

* Maior controle sobre dados

* Performance potencialmente melhor

* Custos reduzidos (sem Supabase)

A migração pode ser concluída em **4-5 dias** com risco controlado seguindo este plano detalhado.
