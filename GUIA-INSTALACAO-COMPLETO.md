# Guia de Instalação - Pizzaria Next.js com PostgreSQL, Mercado Pago e Socket.io

Este guia mostra como configurar a aplicação completa da pizzaria com todas as funcionalidades implementadas.

## 🚀 Funcionalidades Implementadas

✅ **PostgreSQL Nativo**: Substituição completa do Supabase por PostgreSQL direto
✅ **Mercado Pago**: Integração completa com API REST para pagamentos
✅ **Socket.io**: Atualizações em tempo real para a cozinha
✅ **Painel da Cozinha**: Interface reativa com notificações em tempo real
✅ **Webhooks**: Processamento automático de pagamentos
✅ **Checkout Integrado**: Pagamento via cartão, boleto e PIX

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- Conta no Mercado Pago (para pagamentos)
- Git

## 🛠️ Instalação

### 1. Clonar e Instalar Dependências

```bash
# Clonar o repositório
git clone <seu-repositorio>
cd erppizzaria

# Instalar dependências
npm install
```

### 2. Configurar Banco PostgreSQL

#### Opção A: PostgreSQL Local

```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar banco e usuário
sudo -u postgres psql
CREATE DATABASE williamdiskpizza;
CREATE USER pizzaria_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE williamdiskpizza TO pizzaria_user;
\q
```

#### Opção B: PostgreSQL na Nuvem

Use serviços como:
- **Supabase** (PostgreSQL gerenciado)
- **Railway** 
- **Neon**
- **AWS RDS**
- **Google Cloud SQL**

### 3. Executar Script de Criação do Banco

```bash
# Executar o script SQL
psql -h localhost -U pizzaria_user -d williamdiskpizza -f scripts/create-database.sql
```

### 4. Configurar Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Obtenha suas credenciais:
   - **Access Token** (para servidor)
   - **Public Key** (para frontend)
   - **Webhook Secret** (opcional, para validação)

### 5. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.example .env.local

# Editar .env.local
nano .env.local
```

Configurar as seguintes variáveis:

```env
# PostgreSQL
DATABASE_URL=postgresql://pizzaria_user:sua_senha@localhost:5432/williamdiskpizza

# JWT
JWT_SECRET=sua_chave_jwt_super_segura_aqui

# Aplicação
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-abcdef  # Use TEST- para desenvolvimento
MERCADOPAGO_PUBLIC_KEY=TEST-abcdef-1234567890    # Use TEST- para desenvolvimento
MERCADOPAGO_WEBHOOK_SECRET=sua_webhook_secret

# Socket.io
SOCKET_IO_SECRET=sua_socket_secret

# Logs
ENABLE_QUERY_LOGS=true
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=1000
```

### 6. Executar a Aplicação

```bash
# Modo desenvolvimento
npm run dev

# A aplicação estará disponível em http://localhost:3000
```

## 🔧 Configuração de Produção

### 1. Variáveis de Ambiente de Produção

```env
# PostgreSQL (URL de produção)
DATABASE_URL=postgresql://usuario:senha@seu-servidor:5432/williamdiskpizza

# JWT (chave mais segura)
JWT_SECRET=chave_jwt_production_muito_segura_256_bits

# Aplicação
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://sua-pizzaria.com

# Mercado Pago (credenciais de produção)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-abcdef
MERCADOPAGO_PUBLIC_KEY=APP_USR-abcdef-1234567890
MERCADOPAGO_WEBHOOK_SECRET=webhook_secret_production

# Logs (desabilitar em produção)
ENABLE_QUERY_LOGS=false
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=2000
```

### 2. Build e Deploy

```bash
# Build da aplicação
npm run build

# Executar em produção
npm start
```

## 📱 Como Usar

### 1. Acesso Administrativo

- URL: `http://localhost:3000/admin`
- Email: `admin@pizzaria.com`
- Senha: `admin123`

### 2. Painel da Cozinha

- URL: `http://localhost:3000/cozinha`
- Mostra pedidos em tempo real
- Atualiza automaticamente via Socket.io

### 3. Fazer Pedidos

1. Acesse o cardápio
2. Adicione produtos ao carrinho
3. Finalize o pedido
4. Escolha método de pagamento:
   - **Cartão/Boleto**: Redireciona para Mercado Pago
   - **PIX**: Mostra QR Code para pagamento

### 4. Fluxo de Pagamento

1. **Cliente** faz pedido → Status: `PENDING`
2. **Pagamento aprovado** → Status: `RECEIVED`
3. **Cozinha** inicia preparo → Status: `PREPARING`
4. **Cozinha** finaliza → Status: `READY`
5. **Entregador** pega → Status: `OUT_FOR_DELIVERY`
6. **Entregue** → Status: `DELIVERED`

## 🔄 Funcionalidades em Tempo Real

### Socket.io Implementado

- **Novos pedidos**: Notificação automática na cozinha
- **Mudanças de status**: Atualizações em tempo real
- **Pagamentos aprovados**: Notificação instantânea
- **Reconexão automática**: Mantém conexão estável

### Salas do Socket.io

- `kitchen`: Para o painel da cozinha
- `admin`: Para administradores
- `delivery`: Para entregadores
- `order-{id}`: Para acompanhar pedido específico

## 💳 Integração Mercado Pago

### Métodos de Pagamento

1. **Checkout Pro**: Cartão, boleto, Pix (página do MP)
2. **PIX Direto**: QR Code gerado na aplicação
3. **Webhooks**: Confirmação automática de pagamentos

### Endpoints de Pagamento

- `POST /api/payments/create`: Criar pagamento
- `POST /api/payments/webhook`: Receber notificações do MP
- `GET /api/payments/webhook`: Verificar webhook

## 🗃️ Banco de Dados

### Tabelas Principais

- `profiles`: Usuários do sistema
- `orders`: Pedidos
- `order_items`: Itens dos pedidos
- `products`: Produtos do cardápio
- `categories`: Categorias de produtos
- `admin_settings`: Configurações do sistema

### Migração do Supabase

Se você estava usando Supabase, os dados podem ser migrados:

1. Exporte dados do Supabase
2. Execute o script `create-database.sql`
3. Importe os dados para PostgreSQL
4. Atualize as referências no código

## 🚨 Troubleshooting

### Erro de Conexão PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conexão
psql -h localhost -U pizzaria_user -d williamdiskpizza -c "SELECT NOW();"
```

### Erro Socket.io

```bash
# Verificar porta 3000
netstat -tulpn | grep :3000

# Limpar cache Next.js
rm -rf .next
npm run dev
```

### Erro Mercado Pago

1. Verificar credenciais no `.env.local`
2. Confirmar se está usando credenciais de teste (`TEST-`)
3. Verificar se a aplicação tem permissões necessárias

### Logs de Debug

```bash
# Ativar logs detalhados
export ENABLE_QUERY_LOGS=true
export NODE_ENV=development
npm run dev
```

## 📚 Estrutura do Projeto

```
├── app/
│   ├── api/
│   │   ├── orders/          # API de pedidos
│   │   ├── payments/        # API de pagamentos
│   │   └── socket/          # Socket.io
│   ├── admin/               # Painel administrativo
│   ├── cozinha/            # Painel da cozinha
│   └── checkout/           # Finalização de pedidos
├── components/
│   ├── kitchen/            # Componentes da cozinha
│   └── checkout/           # Componentes de pagamento
├── hooks/
│   └── use-socket.ts       # Hook do Socket.io
├── lib/
│   ├── db-native.ts        # PostgreSQL nativo
│   ├── orders.ts           # Operações de pedidos
│   ├── mercadopago.ts      # Integração MP
│   └── socket-server.ts    # Servidor Socket.io
└── scripts/
    └── create-database.sql # Script de criação do BD
```

## 🎯 Próximos Passos

1. **Configurar SSL** em produção
2. **Implementar cache** (Redis)
3. **Adicionar testes** automatizados
4. **Monitoramento** (Sentry, LogRocket)
5. **PWA** para mobile
6. **Notificações push**

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs da aplicação
2. Consulte a documentação do Mercado Pago
3. Teste a conexão com PostgreSQL
4. Verifique se todas as variáveis de ambiente estão configuradas

---

## ⚡ Comandos Rápidos

```bash
# Instalar e configurar tudo
npm install
cp env.example .env.local
# Editar .env.local com suas configurações
psql -f scripts/create-database.sql
npm run dev

# Verificar se tudo está funcionando
curl http://localhost:3000/api/socket
curl http://localhost:3000/api/orders
```

🍕 **Sua pizzaria está pronta para funcionar!**