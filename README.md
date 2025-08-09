# 🍕 William Disk Pizza - Sistema de Delivery

Sistema completo de delivery de pizza desenvolvido com Next.js 14 e Supabase (PostgreSQL) usando o cliente oficial.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Supabase (cliente @supabase/supabase-js)
- **Autenticação**: JWT com bcrypt
- **Banco de Dados**: Supabase (PostgreSQL via cliente oficial)
- **Styling**: Tailwind CSS, Radix UI
- **Estado**: React Context API, TanStack Query

- **Pagamentos**: Mercado Pago integrado
- **Impressão**: Servidor térmico dedicado

## 🎯 Funcionalidades

### Para Clientes
- ✅ Cadastro e login de usuários
- ✅ Navegação de cardápio por categorias
- ✅ Carrinho de compras
- ✅ Sistema de pedidos
- ✅ Acompanhamento de status em tempo real
- ✅ Histórico de pedidos
- ✅ Gerenciamento de endereços

### Para Administradores
- ✅ Dashboard administrativo
- ✅ Gerenciamento de produtos e categorias
- ✅ Gerenciamento de pedidos com Kanban
- ✅ Sistema de arquivamento de pedidos
- ✅ Relatórios de vendas
- ✅ Configurações do sistema
- ✅ Notificações em tempo real

## 🔧 Configuração

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure as variáveis de ambiente
Crie um arquivo `.env.local` baseado no `env.example`:
```env
# Supabase (uso oficial)
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=your-service-role-or-anon-key

# Autenticação
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Ambiente
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret_here

# Logs
ENABLE_QUERY_LOGS=true
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=1000
```

### 3. Banco de Dados
- Não é mais usado `DATABASE_URL` nem conexões diretas via `pg`.
- Toda comunicação é feita via Supabase. Certifique-se de ter criado o projeto e tabelas ou use seus scripts existentes dentro do Supabase.

### 4. Execute a aplicação

#### Opção 1: Script automático (Windows)
```bash
start-dev.bat
```

#### Opção 2: Comando manual
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
├── hooks/                # Hooks customizados
├── lib/                   # Utilitários (auth.ts, db.ts)
├── scripts/               # Scripts SQL
└── types/                 # Definições TypeScript
```



## 🖨️ Sistema de Impressão

Servidor dedicado para impressão térmica:
```bash
cd print-server
npm install
npm start
```

## 📊 Status do Projeto

### ✅ Implementado (100%)
- Sistema de pedidos completo
- Arquivamento de pedidos
- Autenticação JWT
- Banco Supabase (cliente oficial)
- Interface admin
- Geolocalização

### 🔄 Em Desenvolvimento (80%)
- Integração Mercado Pago
- Sistema de impressão

### 📋 Próximos Passos
1. Completar integração de pagamentos
2. Testes de impressão térmica
3. Deploy em VPS

## 🛠️ Troubleshooting



### Banco de dados não conecta
1. Verifique `SUPABASE_URL` e `SUPABASE_KEY` no `.env.local`
2. Confirme se o projeto Supabase está rodando (local ou cloud)
3. Verifique políticas RLS e permissões das tabelas

### Erro de autenticação
1. Verifique o JWT_SECRET no .env.local
2. Limpe o localStorage do navegador
3. Faça login novamente

## 📞 Suporte

Para dúvidas ou problemas:
- Email: contato@williamdiskpizza.com.br
- Documentação: Consulte os arquivos .md na pasta `md/`
