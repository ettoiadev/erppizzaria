# Guia de Implantação: Vercel + Supabase

Este guia detalha o processo de implantação da aplicação William Disk Pizza na Vercel com banco de dados Supabase em ambiente de produção.

## Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Node.js e npm instalados localmente

## 1. Preparação do Banco de Dados Supabase

### 1.1 Criar um Projeto no Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Clique em "New Project"
3. Preencha os detalhes do projeto:
   - Nome: `erppizzaria-prod` (ou outro nome de sua preferência)
   - Senha do banco de dados (guarde-a com segurança)
   - Região: escolha a mais próxima dos seus usuários
4. Clique em "Create New Project"

### 1.2 Migrar o Esquema do Banco de Dados

Utilize o CLI do Supabase para migrar seu esquema local para o projeto de produção:

```bash
# Instalar o CLI do Supabase (se ainda não estiver instalado)
npm install supabase --save-dev

# Fazer login no Supabase
npx supabase login

# Vincular o projeto local ao projeto de produção
npx supabase link --project-ref <project-id>
# O project-id pode ser encontrado nas configurações do projeto no dashboard do Supabase

# Enviar as migrações para produção
npx supabase db push
```

Alternativamente, você pode usar o editor SQL no dashboard do Supabase para executar os scripts de criação de tabelas manualmente.

### 1.3 Configurar Políticas de Segurança (RLS)

Certifique-se de configurar as políticas de Row Level Security (RLS) para proteger seus dados em produção:

1. Acesse o Editor SQL no dashboard do Supabase
2. Execute os comandos SQL para criar as políticas de segurança para cada tabela

## 2. Configuração da Vercel

### 2.1 Conectar Repositório

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Clique em "Add New..."
3. Selecione "Project"
4. Conecte sua conta do GitHub, GitLab ou Bitbucket
5. Selecione o repositório do projeto

### 2.2 Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no projeto da Vercel:

```
# Supabase
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_KEY=<sua-chave-service-role>

# Autenticação
JWT_SECRET=<sua-chave-secreta-super-segura>

# Ambiente
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://<seu-dominio.com>

# Mercado Pago (se aplicável)
MERCADOPAGO_ACCESS_TOKEN=<seu-token-de-producao>
MERCADOPAGO_WEBHOOK_SECRET=<seu-webhook-secret>

# Logs (opcional em produção)
ENABLE_QUERY_LOGS=false
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=1000
```

> **Importante**: Para `SUPABASE_KEY`, use a chave `service_role` para operações administrativas ou a chave `anon` para operações de cliente. A chave `service_role` tem permissões elevadas, então use com cautela.

### 2.3 Configurar Build

A Vercel detectará automaticamente que é um projeto Next.js. Você pode ajustar as configurações de build se necessário:

- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## 3. Deploy

### 3.1 Deploy Inicial

Clique em "Deploy" no dashboard da Vercel. A Vercel irá:

1. Clonar seu repositório
2. Instalar dependências
3. Construir o projeto
4. Implantar em sua infraestrutura global

### 3.2 Configurar Domínio Personalizado (Opcional)

1. No dashboard do projeto na Vercel, vá para "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Siga as instruções para configurar os registros DNS

## 4. Pós-Deploy

### 4.1 Verificar Conexão com o Banco de Dados

Acesse a rota de teste para verificar se a conexão com o Supabase está funcionando corretamente:

```
https://<seu-dominio>/api/test-db-connection
```

### 4.2 Configurar Webhooks (se aplicável)

Se você estiver usando webhooks do Mercado Pago ou outros serviços, atualize as URLs para apontar para seu domínio de produção.

### 4.3 Monitoramento

Utilize as ferramentas de monitoramento da Vercel para acompanhar o desempenho da aplicação:

- **Analytics**: Para métricas de performance do lado do cliente
- **Logs**: Para visualizar logs de funções serverless
- **Status**: Para monitorar o status das implantações

## 5. Implantações Contínuas

A Vercel configurará automaticamente implantações contínuas a partir do seu repositório:

- Cada push para a branch principal resultará em uma atualização do ambiente de produção
- Cada pull request criará um ambiente de preview para testes

## 6. Backup e Recuperação

### 6.1 Backup do Banco de Dados

O Supabase oferece backups automáticos diários. Para backups manuais:

1. Acesse o Editor SQL no dashboard do Supabase
2. Execute um comando pg_dump para exportar seus dados

### 6.2 Rollback de Implantação

Se necessário, você pode reverter para uma implantação anterior na Vercel:

1. Acesse "Deployments" no dashboard do projeto
2. Encontre a implantação desejada
3. Clique em "...