# Configuração do GitHub Actions para Deploy Automático

Este documento explica como configurar os segredos necessários no GitHub para permitir o deploy automático na Vercel usando GitHub Actions.

## Pré-requisitos

- Repositório no GitHub
- Conta na Vercel
- Projeto configurado na Vercel
- Projeto configurado no Supabase

## Configuração dos Segredos no GitHub

Para que o workflow de deploy funcione corretamente, você precisa configurar os seguintes segredos no seu repositório GitHub:

### 1. Acesse as Configurações do Repositório

1. Vá para seu repositório no GitHub
2. Clique na aba "Settings" (Configurações)
3. No menu lateral, clique em "Secrets and variables" > "Actions"
4. Clique em "New repository secret" para adicionar cada um dos segredos abaixo

### 2. Segredos da Vercel

| Nome do Segredo | Descrição | Como Obter |
|-----------------|-----------|------------|
| `VERCEL_TOKEN` | Token de API da Vercel | 1. Acesse [Vercel Account Settings](https://vercel.com/account/tokens)<br>2. Clique em "Create" para gerar um novo token<br>3. Copie o token gerado |
| `VERCEL_ORG_ID` | ID da organização na Vercel | 1. Execute `vercel whoami` no terminal<br>2. Copie o valor de "id" sob "User" |
| `VERCEL_PROJECT_ID` | ID do projeto na Vercel | 1. Acesse a pasta do projeto<br>2. Execute `vercel link`<br>3. O ID do projeto será mostrado ou salvo em `.vercel/project.json` |

### 3. Segredos do Supabase e da Aplicação

| Nome do Segredo | Descrição | Como Obter |
|-----------------|-----------|------------|
| `SUPABASE_URL` | URL do projeto Supabase | Dashboard do Supabase > Configurações do Projeto > API > URL |
| `SUPABASE_KEY` | Chave de API do Supabase | Dashboard do Supabase > Configurações do Projeto > API > `service_role` key |
| `JWT_SECRET` | Chave secreta para autenticação JWT | Gere uma string aleatória segura |
| `NEXT_PUBLIC_SITE_URL` | URL do site em produção | URL do seu site na Vercel (ex: https://seu-app.vercel.app) |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso do Mercado Pago | Dashboard do Mercado Pago > Developers > Access token |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret para webhooks do Mercado Pago | Dashboard do Mercado Pago > Webhooks > Configurações |

## Verificação da Configuração

Após configurar todos os segredos, você pode verificar se estão corretos:

1. Vá para a aba "Actions" no seu repositório
2. Clique no workflow "Deploy to Vercel"
3. Clique em "Run workflow" > "Run workflow"

Isto iniciará manualmente o processo de deploy, que deve completar com sucesso se todos os segredos estiverem configurados corretamente.

## Solução de Problemas

Se o workflow falhar, verifique os logs de erro na aba "Actions" para identificar qual segredo pode estar faltando ou incorreto.

Problemas comuns incluem:

- Tokens de API expirados
- IDs de projeto incorretos
- Variáveis de ambiente faltando
- Erros de build devido a configurações incorretas

## Próximos Passos

Após configurar o GitHub Actions com sucesso:

1. Qualquer push para a branch principal (main/master) iniciará automaticamente o deploy
2. Você pode acompanhar o progresso na aba "Actions" do GitHub
3. Após o deploy, verifique se a aplicação está funcionando corretamente na Vercel