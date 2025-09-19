# Auditoria e Plano de Migração: Supabase → PostgreSQL Self-Hosted

## 1. Resumo Executivo

Este documento apresenta uma auditoria completa da aplicação ERP Pizzaria e um plano detalhado para migração do Supabase para PostgreSQL self-hosted rodando no Docker Desktop.

**Status Atual**: A aplicação está 100% dependente do Supabase para:
- Autenticação e autorização
- Operações CRUD no banco de dados
- Middleware de autenticação
- Logging e monitoramento

**Objetivo**: Migrar para PostgreSQL mantendo toda funcionalidade existente intacta.

## 2. Auditoria de Dependências do Supabase

### 2.1 Dependências no package.json

```json
{
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/ssr": "^0.6.1",
  "@supabase/supabase-js": "^2.45.4"
}
```

### 2.2 Arquivos que Usam Supabase

#### Configuração Principal
- `lib/supabase.ts` - Cliente principal do Supabase
- `middleware.ts` - Autenticação via Supabase SSR
- `lib/supabase-logger.ts` - Sistema de logging específico

#### Operações de Banco de Dados
- `lib/db/users.ts` - Operações de usuários
- `lib/db/products.ts` - Operações de produtos
- `lib/db/addresses.ts` - Operações de endereços
- `lib/db/categories.ts` - Operações de categorias
- `lib/db/orders.ts` - Operações de pedidos
- `lib/db/customers.ts` - Operações de clientes
- `lib/db/settings.ts` - Configurações do sistema

#### Rotas da API (Principais)
- `app/api/auth/login/route.ts` - Autenticação
- `app/api/products/route.ts` - Gestão de produtos
- `app/api/orders/route.ts` - Gestão de pedidos
- `app/api/customers/route.ts` - Gestão de clientes
- `app/api/admin/**` - Rotas administrativas
- `app/api/system-status/route.ts` - Status do sistema

#### Utilitários
- `lib/auth-utils.ts` - Utilitários de autenticação

### 2.3 Variáveis de Ambiente Atuais

```env
# Supabase
SUPABASE_URL=https://zrkxsetbsyecbatqbojr.supabase.co
SUPABASE_KEY=sua_chave_publica_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Autenticação
JWT_SECRET=sua_chave_jwt_super_segura
REFRESH_TOKEN_SECRET=sua_chave_refresh_super_segura
```

## 3. Estrutura do Banco de Dados

### 3.1 Tabelas Identificadas

Baseado na análise do código, as seguintes tabelas são utilizadas:

- `profiles` - Perfis de usuários
- `products` - Produtos da pizzaria
- `categories` - Categorias de produtos
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `customers` - Clientes
- `customer_addresses` - Endereços dos clientes
- `admin_settings` - Configurações administrativas

### 3.2 Funcionalidades de Autenticação

- Sistema de login/logout
- Verificação de roles (admin, customer, kitchen, delivery)
- Middleware de autenticação
- Tokens JWT e refresh tokens
- Row Level Security (RLS)

## 4. Plano de Migração Passo-a-Passo

### Fase 1: Preparação do Ambiente PostgreSQL

#### 4.1 Configuração do Docker PostgreSQL

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: erppizzaria_db
    environment:
      POSTGRES_DB: erppizzaria
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 4.2 Novas Variáveis de Ambiente

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/erppizzaria
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erppizzaria
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Autenticação (manter existentes)
JWT_SECRET=sua_chave_jwt_super_segura
REFRESH_TOKEN_SECRET=sua_chave_refresh_super_segura
```

### Fase 2: Instalação de Dependências

#### 4.3 Novas Dependências

```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "@types/pg": "^8.10.9",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  }
}
```

#### 4.4 Remover Dependências do Supabase

```bash
npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
```

### Fase 3: Criação do Schema do Banco

#### 4.5 Script de Inicialização (init.sql)

```sql
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de perfis de usuários
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'kitchen', 'delivery')),
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    image VARCHAR(500),
    active BOOLEAN DEFAULT true,
    has_sizes BOOLEAN DEFAULT false,
    has_toppings BOOLEAN DEFAULT false,
    preparation_time INTEGER DEFAULT 30,
    sort_order INTEGER,
    sizes JSONB,
    toppings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    customer_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de endereços de clientes
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20),
    complement VARCHAR(255),
    neighborhood VARCHAR(255),
    city VARCHAR(255) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    delivery_address JSONB,
    notes TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do pedido
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    size_info JSONB,
    toppings_info JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações administrativas
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário admin padrão
INSERT INTO profiles (email, full_name, role, password_hash) 
VALUES ('admin@erppizzaria.com', 'Administrador', 'admin', crypt('admin123', gen_salt('bf')));
```

### Fase 4: Refatoração do Código

#### 4.6 Novo Cliente de Banco de Dados (lib/database.ts)

```typescript
import { Pool, PoolClient } from 'pg'
import { appLogger } from './logging'

// Configuração do pool de conexões
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'erppizzaria',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Função para executar queries
export async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect()
  try {
    const start = Date.now()
    const result = await client.query(text, params)
    const duration = Date.now() - start
    
    appLogger.debug('database', 'Query executada', {
      query: text.substring(0, 100),
      duration,
      rows: result.rowCount
    })
    
    return result
  } catch (error) {
    appLogger.error('database', 'Erro na query', { query: text, error })
    throw error
  } finally {
    client.release()
  }
}

// Função para transações
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export default pool
```

#### 4.7 Novo Sistema de Autenticação (lib/auth.ts)

```typescript
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from './database'
import { appLogger } from './logging'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'admin' | 'kitchen' | 'delivery'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// Verificar credenciais de login
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT id, email, full_name, role, password_hash FROM profiles WHERE email = $1',
      [email.toLowerCase()]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    const user = result.rows[0]
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    }
  } catch (error) {
    appLogger.error('auth', 'Erro ao verificar credenciais', error)
    throw error
  }
}

// Gerar tokens JWT
export function generateTokens(user: User): AuthTokens {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: '7d' }
  )
  
  return { accessToken, refreshToken }
}

// Verificar token JWT
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    throw new Error('Token inválido')
  }
}

// Verificar refresh token
export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!)
  } catch (error) {
    throw new Error('Refresh token inválido')
  }
}

// Buscar usuário por ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT id, email, full_name, role FROM profiles WHERE id = $1',
      [id]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    return result.rows[0]
  } catch (error) {
    appLogger.error('auth', 'Erro ao buscar usuário', error)
    throw error
  }
}
```

#### 4.8 Refatoração das Operações de Banco (lib/db/users.ts)

```typescript
import { query } from '../database'
import bcrypt from 'bcryptjs'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'admin' | 'kitchen' | 'delivery'
  password_hash?: string
  phone?: string
  created_at?: string
  updated_at?: string
}

// Buscar usuário por email
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const result = await query(
      'SELECT * FROM profiles WHERE email = $1',
      [email.toLowerCase()]
    )
    
    if (result.rows.length === 0) {
      return null
    }
    
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

// Criar novo perfil de usuário
export async function createUserProfile(userData: {
  email: string
  full_name: string
  role?: string
  password_hash: string
  phone?: string
}): Promise<UserProfile | null> {
  try {
    const hashedPassword = await bcrypt.hash(userData.password_hash, 12)
    
    const result = await query(
      `INSERT INTO profiles (email, full_name, role, password_hash, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, full_name, role, phone, created_at, updated_at`,
      [
        userData.email.toLowerCase(),
        userData.full_name,
        userData.role || 'customer',
        hashedPassword,
        userData.phone || null
      ]
    )
    
    return result.rows[0]
  } catch (error) {
    throw error
  }
}
```

#### 4.9 Novo Middleware de Autenticação (middleware.ts)

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, getUserById } from '@/lib/auth'
import { appLogger } from '@/lib/logging'

// Rotas que não precisam de autenticação
const publicRoutes = ['/', '/login', '/admin/login']

// Rotas que precisam de autenticação administrativa
const adminRoutes = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    // Verificar token de acesso
    const accessToken = request.cookies.get('access-token')?.value
    
    if (!accessToken) {
      appLogger.warn('auth', 'Tentativa de acesso sem token', { path: pathname })
      return redirectToLogin(request)
    }

    // Verificar e decodificar token
    const decoded = verifyToken(accessToken)
    const user = await getUserById(decoded.userId)
    
    if (!user) {
      appLogger.warn('auth', 'Usuário não encontrado', { userId: decoded.userId })
      return redirectToLogin(request)
    }

    // Verificar permissões administrativas
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (user.role !== 'admin') {
        appLogger.warn('auth', 'Tentativa de acesso administrativo não autorizado', {
          userId: user.id,
          role: user.role,
          path: pathname
        })
        return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return NextResponse.next()
  } catch (error) {
    appLogger.error('auth', 'Erro no middleware', error)
    return redirectToLogin(request)
  }
}

function redirectToLogin(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const loginUrl = isAdminRoute ? '/admin/login' : '/login'
  
  return NextResponse.redirect(new URL(loginUrl, request.url))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}
```

### Fase 5: Atualização das Rotas da API

#### 4.10 Nova Rota de Login (app/api/auth/login/route.ts)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyCredentials, generateTokens } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'
import { userLoginSchema } from '@/lib/validation-schemas'
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validationResult = userLoginSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const { email, password } = validationResult.data
    
    // Verificar credenciais
    const user = await verifyCredentials(email, password)
    
    if (!user) {
      frontendLogger.warn('Tentativa de login com credenciais inválidas', { email })
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }
    
    // Verificar se é login administrativo
    const isAdminLogin = request.url.includes('/admin/login') || request.headers.get('x-admin-login') === 'true'
    
    if (isAdminLogin && user.role !== 'admin') {
      frontendLogger.warn('Tentativa de login administrativo não autorizado', { email, role: user.role })
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
    }
    
    // Gerar tokens
    const tokens = generateTokens(user)
    
    frontendLogger.info('Login realizado com sucesso', { email, role: user.role })
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    })
    
    // Definir cookies
    response.cookies.set('access-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    
    response.cookies.set('refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    
    return addCorsHeaders(response)
    
  } catch (error: any) {
    frontendLogger.error('Erro interno no login', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export const OPTIONS = createOptionsHandler()
```

## 5. Cronograma de Implementação

### Semana 1: Preparação
- [ ] Configurar Docker PostgreSQL
- [ ] Criar schema do banco de dados
- [ ] Instalar novas dependências
- [ ] Configurar variáveis de ambiente

### Semana 2: Refatoração Core
- [ ] Implementar cliente de banco PostgreSQL
- [ ] Refatorar sistema de autenticação
- [ ] Atualizar middleware
- [ ] Migrar operações de usuários

### Semana 3: Migração de Dados
- [ ] Migrar operações de produtos
- [ ] Migrar operações de pedidos
- [ ] Migrar operações de clientes
- [ ] Atualizar rotas da API

### Semana 4: Testes e Validação
- [ ] Testes de integração
- [ ] Validação de funcionalidades
- [ ] Otimização de performance
- [ ] Documentação final

## 6. Riscos e Mitigações

### 6.1 Riscos Identificados

1. **Perda de dados durante migração**
   - Mitigação: Backup completo antes da migração
   
2. **Incompatibilidade de tipos de dados**
   - Mitigação: Mapeamento detalhado de tipos
   
3. **Performance degradada**
   - Mitigação: Índices otimizados e pool de conexões
   
4. **Falhas de autenticação**
   - Mitigação: Testes extensivos do sistema de auth

### 6.2 Plano de Rollback

1. Manter backup do código atual
2. Manter instância Supabase ativa durante transição
3. Implementar feature flags para alternar entre sistemas

## 7. Validação e Testes

### 7.1 Checklist de Validação

- [ ] Login de usuários funcionando
- [ ] Login administrativo funcionando
- [ ] CRUD de produtos funcionando
- [ ] CRUD de pedidos funcionando
- [ ] CRUD de clientes funcionando
- [ ] Middleware de autenticação funcionando
- [ ] Todas as rotas da API respondendo
- [ ] Performance aceitável

### 7.2 Testes de Carga

- Testar com 100+ usuários simultâneos
- Validar tempo de resposta < 500ms
- Verificar estabilidade do pool de conexões

## 8. Conclusão

Esta migração permitirá:

1. **Independência**: Eliminar dependência de serviços externos
2. **Controle**: Controle total sobre o banco de dados
3. **Performance**: Otimização específica para as necessidades
4. **Custo**: Redução de custos operacionais
5. **Segurança**: Dados hospedados localmente

A migração deve ser executada de forma incremental, mantendo a funcionalidade existente intacta e garantindo que todos os fluxos de usuário continuem funcionando perfeitamente.

---

**Documento gerado em**: 2025-01-16  
**Versão**: 1.0  
**Status**: Pronto para implementação