# 🍕 William Disk Pizza - Sistema de Delivery

Sistema completo de delivery de pizza desenvolvido com Next.js 14 e PostgreSQL.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, PostgreSQL direto
- **Autenticação**: JWT com bcrypt
- **Banco de Dados**: PostgreSQL direto (sem Supabase)
- **Styling**: Tailwind CSS, Radix UI
- **Estado**: React Context API, TanStack Query

## 🎯 Funcionalidades

### Para Clientes
- ✅ Cadastro e login de usuários
- ✅ Navegação de cardápio por categorias
- ✅ Carrinho de compras
- ✅ Sistema de pedidos
- ✅ Acompanhamento de status
- ✅ Histórico de pedidos
- ✅ Gerenciamento de endereços

### Para Administradores
- ✅ Dashboard administrativo
- ✅ Gerenciamento de produtos e categorias
- ✅ Gerenciamento de pedidos
- ✅ Relatórios de vendas
- ✅ Configurações do sistema

## 🔧 Configuração

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure as variáveis de ambiente
Crie um arquivo `.env.local`:
```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/williamdiskpizza
JWT_SECRET=sua_chave_secreta_super_segura_aqui
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Configure o Banco PostgreSQL
Execute o script completo no PostgreSQL:
```bash
# Execute no seu cliente PostgreSQL
scripts/setup-postgresql-complete.sql
```

### 4. Execute a aplicação
```bash
npm run dev
```

## 👨‍💼 Acesso Admin
- Email: `admin@williamdiskpizza.com`
- Senha: `admin123`
- URL: `http://localhost:3000/admin`

## 📁 Estrutura
```
williamdiskpizza/
├── app/                    # Pages e API Routes
├── components/            # Componentes React
├── lib/                   # Utilitários (auth.ts, db.ts)
├── scripts/               # Scripts SQL
└── types/                 # Definições TypeScript
```
