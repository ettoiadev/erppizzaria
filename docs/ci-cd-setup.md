# Configuração de CI/CD

Este documento descreve como configurar o pipeline de CI/CD para o projeto ERP Pizzaria.

## Visão Geral

O pipeline de CI/CD é executado automaticamente através do GitHub Actions e inclui:

- ✅ Testes automatizados
- 🔍 Verificação de tipos TypeScript
- 🧹 Linting de código
- 🏗️ Build da aplicação
- 🚀 Deploy automático no Vercel
- 🔒 Verificações de segurança
- ⚡ Testes de performance

## Configuração de Secrets

Para que o pipeline funcione corretamente, você precisa configurar os seguintes secrets no GitHub:

### Secrets Obrigatórios

1. **VERCEL_TOKEN**
   - Acesse: https://vercel.com/account/tokens
   - Crie um novo token
   - Adicione como secret no GitHub

2. **VERCEL_ORG_ID**
   - Execute: `vercel link` no projeto local
   - Copie o valor de `orgId` do arquivo `.vercel/project.json`
   - Adicione como secret no GitHub

3. **VERCEL_PROJECT_ID**
   - Execute: `vercel link` no projeto local
   - Copie o valor de `projectId` do arquivo `.vercel/project.json`
   - Adicione como secret no GitHub

### Como Adicionar Secrets no GitHub

1. Vá para o repositório no GitHub
2. Clique em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione o nome e valor do secret
5. Clique em **Add secret**

## Fluxo de Trabalho

### Pull Requests

Quando um Pull Request é criado:

1. **Testes** são executados automaticamente
2. **Build** é realizado para verificar se não há erros
3. **Deploy de preview** é criado no Vercel
4. **Comentário automático** é adicionado ao PR com o link do preview

### Push para Main

Quando código é enviado para a branch `main`:

1. **Todos os testes** são executados
2. **Build de produção** é realizado
3. **Deploy automático** para produção no Vercel
4. **Testes de performance** são executados
5. **Verificações de segurança** são realizadas

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Inicia servidor de produção

# Testes
npm test                 # Executa todos os testes
npm run test:watch       # Executa testes em modo watch
npm run test:coverage    # Executa testes com cobertura
npm run test:ci          # Executa testes para CI

# Qualidade de Código
npm run lint             # Executa linting
npm run type-check       # Verifica tipos TypeScript

# Validações
npm run validate-env     # Valida variáveis de ambiente
npm run validate-security # Valida configurações de segurança
```

## Configuração Local

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Vercel
- Conta no Supabase

### Variáveis de Ambiente

Crie um arquivo `.env.local` baseado no `.env.example`:

```bash
cp .env.example .env.local
```

Preencha todas as variáveis necessárias:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_mercadopago_public_key

# Outras configurações
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Monitoramento

### Cobertura de Testes

A cobertura de testes é automaticamente enviada para o Codecov após cada execução do pipeline.

### Performance

Os testes de performance são executados usando Lighthouse CI e geram relatórios detalhados sobre:

- Performance
- Acessibilidade
- Melhores práticas
- SEO

### Segurança

Verificações de segurança incluem:

- Auditoria de dependências (`npm audit`)
- Revisão de dependências em PRs
- Verificação de vulnerabilidades conhecidas

## Troubleshooting

### Falhas Comuns

1. **Testes falhando**
   - Verifique se todas as dependências estão instaladas
   - Execute `npm run test:ci` localmente
   - Verifique logs detalhados no GitHub Actions

2. **Deploy falhando**
   - Verifique se os secrets do Vercel estão configurados
   - Verifique se o build local funciona: `npm run build`
   - Verifique variáveis de ambiente no Vercel

3. **Type checking falhando**
   - Execute `npm run type-check` localmente
   - Corrija erros de TypeScript antes do commit

### Logs e Debugging

- Acesse os logs detalhados em **Actions** no GitHub
- Use `console.log` temporariamente para debugging
- Execute testes localmente antes de fazer push

## Contribuindo

Antes de fazer um Pull Request:

1. Execute todos os testes: `npm test`
2. Verifique linting: `npm run lint`
3. Verifique tipos: `npm run type-check`
4. Teste o build: `npm run build`

O pipeline irá verificar automaticamente todos esses pontos, mas executá-los localmente economiza tempo.