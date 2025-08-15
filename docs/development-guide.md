# Guia de Desenvolvimento - ERP Pizzaria

Este guia fornece todas as informações necessárias para desenvolvedores que irão trabalhar no projeto ERP Pizzaria.

## Índice

- [Visão Geral](#visão-geral)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Padrões de Código](#padrões-de-código)
- [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
- [Testes](#testes)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

## Visão Geral

O ERP Pizzaria é uma plataforma completa de delivery de pizzas construída com Next.js 14, React 18, TypeScript e Supabase. O sistema inclui:

- **Frontend**: Interface para clientes e administradores
- **Backend**: APIs RESTful para todas as operações
- **Banco de Dados**: PostgreSQL via Supabase
- **Autenticação**: JWT com middleware personalizado
- **Pagamentos**: Integração com MercadoPago
- **Deploy**: Vercel com CI/CD automatizado

## Configuração do Ambiente

### Pré-requisitos

- **Node.js**: 18.0.0 ou superior
- **npm**: 9.0.0 ou superior
- **Git**: Para controle de versão
- **VS Code**: Editor recomendado

### Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd erppizzaria
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env.local
```

Preencha o arquivo `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_mercadopago_public_key

# Autenticação
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Outros
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Execute o projeto:**
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`.

### Extensões Recomendadas do VS Code

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "yzhang.markdown-all-in-one"
  ]
}
```

## Estrutura do Projeto

```
erppizzaria/
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticação
│   │   ├── products/      # Produtos
│   │   ├── orders/        # Pedidos
│   │   └── ...
│   ├── admin/             # Páginas administrativas
│   ├── cardapio/          # Cardápio público
│   └── layout.tsx         # Layout principal
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── layout/           # Componentes de layout
│   ├── admin/            # Componentes administrativos
│   └── forms/            # Formulários
├── contexts/             # React Contexts
├── hooks/                # Custom Hooks
├── lib/                  # Utilitários e configurações
│   ├── supabase.ts       # Cliente Supabase
│   ├── auth.ts           # Utilitários de autenticação
│   ├── validation-schemas.ts # Schemas Zod
│   └── middlewares/      # Middlewares personalizados
├── public/               # Arquivos estáticos
├── styles/               # Estilos globais
├── __tests__/            # Testes
├── docs/                 # Documentação
└── scripts/              # Scripts utilitários
```

### Convenções de Nomenclatura

- **Arquivos**: kebab-case (`user-profile.tsx`)
- **Componentes**: PascalCase (`UserProfile`)
- **Funções**: camelCase (`getUserProfile`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Tipos**: PascalCase (`UserProfile`)
- **Interfaces**: PascalCase com prefixo I (`IUserProfile`)

## Tecnologias Utilizadas

### Frontend

- **Next.js 14**: Framework React com App Router
- **React 18**: Biblioteca de interface
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework CSS utilitário
- **shadcn/ui**: Componentes de interface
- **Framer Motion**: Animações
- **React Query**: Gerenciamento de estado servidor

### Backend

- **Next.js API Routes**: APIs serverless
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Banco de dados
- **JWT**: Autenticação
- **Zod**: Validação de schemas

### Ferramentas

- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **Jest**: Framework de testes
- **Testing Library**: Testes de componentes
- **Husky**: Git hooks
- **Vercel**: Deploy e hosting

## Padrões de Código

### Estrutura de Componentes

```tsx
// components/ui/button.tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium',
          {
            'bg-primary text-primary-foreground': variant === 'default',
            'bg-destructive text-destructive-foreground': variant === 'destructive',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
```

### Estrutura de API Routes

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withValidation } from '@/lib/validation-middleware'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { productSchema } from '@/lib/validation-schemas'
import { getProductsActive, createProduct } from '@/lib/db-supabase'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET Handler
async function getProductsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const products = await getProductsActive()
    return NextResponse.json({ products, total: products.length })
  } catch (error) {
    throw error // Middleware irá tratar
  }
}

// POST Handler
async function createProductHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const product = await createProduct(body)
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    throw error // Middleware irá tratar
  }
}

// Aplicar middlewares
const enhancedGetHandler = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getProductsHandler,
      { logErrors: true }
    )
  )
)

const enhancedPostHandler = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('create', {},
      withValidation(productSchema,
        withDatabaseErrorHandling(
          createProductHandler,
          { logErrors: true }
        )
      )
    )
  )
)

export const GET = enhancedGetHandler
export const POST = enhancedPostHandler
```

### Hooks Personalizados

```typescript
// hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Product } from '@/types'

interface UseProductsOptions {
  categoryId?: string
  search?: string
}

export function useProducts(options: UseProductsOptions = {}) {
  return useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.categoryId) params.set('category_id', options.categoryId)
      if (options.search) params.set('search', options.search)
      
      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at'>) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      
      if (!response.ok) throw new Error('Failed to create product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

### Validação com Zod

```typescript
// lib/validation-schemas.ts
import { z } from 'zod'

export const productSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  price: z.number()
    .positive('Preço deve ser positivo')
    .max(1000, 'Preço deve ser menor que R$ 1000'),
  category_id: z.string().uuid('ID da categoria inválido'),
  image_url: z.string().url('URL da imagem inválida').optional(),
  is_active: z.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>
```

## Fluxo de Desenvolvimento

### 1. Criando uma Nova Feature

1. **Crie uma branch:**
```bash
git checkout -b feature/nova-funcionalidade
```

2. **Implemente a feature:**
   - Crie/modifique componentes
   - Adicione APIs se necessário
   - Implemente testes
   - Atualize documentação

3. **Execute os testes:**
```bash
npm test
npm run lint
npm run type-check
```

4. **Commit e push:**
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

5. **Crie um Pull Request**

### 2. Convenções de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de manutenção

### 3. Code Review

Todos os PRs devem passar por code review:

- ✅ Testes passando
- ✅ Linting sem erros
- ✅ TypeScript sem erros
- ✅ Documentação atualizada
- ✅ Performance considerada
- ✅ Segurança verificada

## Testes

### Estrutura de Testes

```
__tests__/
├── components/           # Testes de componentes
├── pages/               # Testes de páginas
├── api/                 # Testes de API
├── lib/                 # Testes de utilitários
└── integration/         # Testes de integração
```

### Exemplo de Teste de Componente

```typescript
// __tests__/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })
})
```

### Exemplo de Teste de API

```typescript
// __tests__/api/products.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/products/route'

describe('/api/products', () => {
  it('returns products list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('products')
    expect(Array.isArray(data.products)).toBe(true)
  })

  it('creates a new product', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Pizza Test',
        description: 'Pizza para teste',
        price: 25.90,
        category_id: 'test-category-id'
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.product).toHaveProperty('id')
    expect(data.product.name).toBe('Pizza Test')
  })
})
```

### Comandos de Teste

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage

# Executar testes específicos
npm test -- --testPathPattern=button

# Executar testes de API
npm run test:api

# Executar testes de integração
npm run test:integration
```

## Deploy

### Ambientes

- **Development**: `http://localhost:3000`
- **Preview**: Branches automáticas no Vercel
- **Production**: `https://erppizzaria-tau.vercel.app`

### Pipeline CI/CD

O deploy é automatizado via GitHub Actions:

1. **Pull Request**: Deploy de preview
2. **Merge para main**: Deploy de produção
3. **Testes**: Executados em todos os deploys
4. **Verificações**: Linting, TypeScript, segurança

### Configuração Manual

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Link do projeto
vercel link

# Deploy de preview
vercel

# Deploy de produção
vercel --prod
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Supabase

```bash
# Verificar variáveis de ambiente
node scripts/validate-env.js

# Testar conexão
node scripts/test-supabase-connection.js
```

#### 2. Erro de Build

```bash
# Limpar cache
npm run build
rm -rf .next
npm run build

# Verificar TypeScript
npm run type-check
```

#### 3. Testes Falhando

```bash
# Executar testes específicos
npm test -- --verbose

# Limpar cache do Jest
npm test -- --clearCache
```

#### 4. Problemas de Performance

```bash
# Analisar bundle
npm run build
npx @next/bundle-analyzer

# Verificar Lighthouse
npm run lighthouse
```

### Logs e Debugging

#### Frontend

```typescript
// Usar o logger frontend
import { frontendLogger } from '@/lib/frontend-logger'

frontendLogger.info('user', 'User logged in', { userId: '123' })
frontendLogger.error('api', 'API call failed', { error: 'Network error' })
```

#### Backend

```typescript
// Usar o logger da aplicação
import { appLogger } from '@/lib/logging'

appLogger.info('api', 'Processing request', { endpoint: '/api/products' })
appLogger.error('database', 'Query failed', { error: error.message })
```

#### Supabase

```sql
-- Verificar logs no Supabase Dashboard
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 10;
SELECT * FROM public.orders WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Ferramentas de Debug

- **React DevTools**: Para componentes React
- **Network Tab**: Para requisições HTTP
- **Supabase Dashboard**: Para banco de dados
- **Vercel Dashboard**: Para logs de produção
- **GitHub Actions**: Para logs de CI/CD

## Recursos Adicionais

### Documentação

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Comunidade

- [Next.js Discord](https://discord.gg/nextjs)
- [React Discord](https://discord.gg/react)
- [Supabase Discord](https://discord.supabase.com)

### Ferramentas Úteis

- [shadcn/ui](https://ui.shadcn.com): Componentes de interface
- [Lucide Icons](https://lucide.dev): Ícones
- [Tailwind UI](https://tailwindui.com): Templates Tailwind
- [React Hook Form](https://react-hook-form.com): Formulários
- [Zod](https://zod.dev): Validação de schemas

---

**Última atualização**: Janeiro 2024

Para dúvidas ou sugestões, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.