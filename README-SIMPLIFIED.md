# 🍕 William Disk Pizza - Versão Simplificada

Sistema de delivery de pizza simplificado e organizado.

## 🚀 Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Banco de dados
- **Radix UI** - Componentes acessíveis

## 📁 Estrutura Simplificada

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── api/               # API Routes
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   └── ui/               # Componentes base
├── lib/                  # Utilitários
│   ├── supabase.ts       # Cliente Supabase
│   ├── auth.ts           # Autenticação
│   ├── utils.ts          # Utilitários gerais
│   └── validations.ts    # Schemas Zod
└── types/                # Tipos TypeScript
```

## ⚙️ Configuração

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.simplified .env.local
```

Edite `.env.local` com suas configurações:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. **Executar aplicação:**
```bash
npm run dev
```

## 🗄️ Banco de Dados

Estrutura básica das tabelas no Supabase:

```sql
-- Usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  role VARCHAR DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categorias
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Produtos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  image_url VARCHAR,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pedidos
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Itens do pedido
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  notes TEXT
);
```

## 🎯 Funcionalidades

### ✅ Implementadas
- Autenticação (login/registro)
- Estrutura básica de componentes
- API Routes essenciais
- Configuração simplificada

### 🔄 Para Implementar
- Cardápio de produtos
- Carrinho de compras
- Sistema de pedidos
- Painel administrativo

## 🔧 Scripts Disponíveis

- `npm run dev` - Executar em desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Executar build de produção
- `npm run lint` - Verificar código
- `npm run type-check` - Verificar tipos TypeScript

## 📝 Benefícios da Simplificação

1. **Código mais limpo** - Estrutura organizada e intuitiva
2. **Menos dependências** - Apenas o essencial
3. **Melhor performance** - Menos overhead
4. **Fácil manutenção** - Código mais legível
5. **Onboarding rápido** - Estrutura simples de entender

## 🚀 Deploy

Para deploy em produção:

1. Configure as variáveis de ambiente na plataforma de deploy
2. Execute `npm run build`
3. Deploy dos arquivos gerados

Recomendado: Vercel para Next.js