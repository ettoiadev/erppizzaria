# 🍕 William Disk Pizza - Sistema de Delivery

Sistema completo de delivery de pizza desenvolvido com Next.js 14 e PostgreSQL.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, PostgreSQL direto
- **Autenticação**: JWT com bcrypt
- **Banco de Dados**: PostgreSQL direto (sem Supabase)
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
# Configurações do Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/williamdiskpizza

# Configurações de Autenticação
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# Configurações do Ambiente
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000



# Configurações do Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret_here

# Configurações de Logs
ENABLE_QUERY_LOGS=true
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=1000
```

### 3. Configure o Banco PostgreSQL
Execute o script completo no PostgreSQL:
```bash
# Execute no seu cliente PostgreSQL
scripts/setup-postgresql-complete.sql
```

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
- Banco PostgreSQL
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
1. Verifique a URL de conexão no .env.local
2. Confirme se o PostgreSQL está rodando
3. Execute os scripts SQL de setup

### Erro de autenticação
1. Verifique o JWT_SECRET no .env.local
2. Limpe o localStorage do navegador
3. Faça login novamente

## 📞 Suporte

Para dúvidas ou problemas:
- Email: contato@williamdiskpizza.com.br
- Documentação: Consulte os arquivos .md na pasta `md/`
