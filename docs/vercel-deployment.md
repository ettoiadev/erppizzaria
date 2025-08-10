# Guia de Deploy no Vercel - ERP Pizzaria

Este guia fornece instruções detalhadas para fazer o deploy da aplicação ERP Pizzaria no Vercel, com foco especial na configuração segura das variáveis de ambiente.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Projeto Supabase configurado
- Conta no Mercado Pago (com credenciais de produção)
- Repositório Git com o código da aplicação

## 🚀 Processo de Deploy

### 1. Preparação do Projeto

```bash
# Validar variáveis de ambiente localmente
npm run validate-env

# Executar testes
npm test

# Build local para verificar se tudo está funcionando
npm run build
```

### 2. Configuração no Vercel

#### 2.1 Importar Projeto

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Clique em "New Project"
3. Importe seu repositório Git
4. Configure as seguintes opções:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### 2.2 Configuração de Variáveis de Ambiente

**⚠️ IMPORTANTE**: Configure as variáveis na seguinte ordem para evitar erros de build:

##### Variáveis Obrigatórias (Environment Variables)

```bash
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_supabase_aqui

# JWT
JWT_SECRET=sua_chave_jwt_super_segura_de_pelo_menos_32_caracteres

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-sua_chave_de_producao_aqui
MERCADOPAGO_WEBHOOK_SECRET=sua_chave_webhook_secreta_aqui

# URL da Aplicação
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

##### Variáveis Opcionais

```bash
# Ambiente
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_REQUESTS=100

# Logs (recomendado desabilitar em produção)
ENABLE_QUERY_LOGS=false
ENABLE_SLOW_QUERY_LOGS=false
```

### 3. Configuração de Domínio

#### 3.1 Domínio Personalizado (Opcional)

1. No dashboard do Vercel, vá para "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruído
4. **Importante**: Atualize `NEXT_PUBLIC_SITE_URL` com o novo domínio

#### 3.2 Configuração do Supabase

1. No dashboard do Supabase, vá para "Settings" > "API"
2. Em "Site URL", adicione:
   - `https://seu-dominio.vercel.app`
   - `https://seu-dominio-personalizado.com` (se aplicável)
3. Em "Redirect URLs", adicione:
   - `https://seu-dominio.vercel.app/auth/callback`
   - `https://seu-dominio-personalizado.com/auth/callback`

### 4. Configuração do Mercado Pago

1. No dashboard do Mercado Pago, configure:
   - **Webhook URL**: `https://seu-dominio.vercel.app/api/payments/webhook`
   - **Redirect URLs**:
     - Success: `https://seu-dominio.vercel.app/checkout/success`
     - Failure: `https://seu-dominio.vercel.app/checkout/failure`
     - Pending: `https://seu-dominio.vercel.app/checkout/pending`

## 🔒 Segurança das Variáveis de Ambiente

### Variáveis Privadas (Server-side apenas)

✅ **Correto**: Estas variáveis são acessíveis apenas no servidor

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `JWT_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`

### Variáveis Públicas (Client-side)

✅ **Correto**: Apenas variáveis prefixadas com `NEXT_PUBLIC_`

- `NEXT_PUBLIC_SITE_URL`

### ❌ Variáveis Legadas (NÃO usar)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🧪 Validação Pós-Deploy

### 1. Verificação Automática

O Vercel executará automaticamente `npm run validate-env` durante o build. Se houver erros, o deploy falhará.

### 2. Testes Manuais

Após o deploy, teste:

1. **Página inicial**: `https://seu-dominio.vercel.app`
2. **Login**: `https://seu-dominio.vercel.app/login`
3. **Cardápio**: `https://seu-dominio.vercel.app/cardapio`
4. **Admin**: `https://seu-dominio.vercel.app/admin`
5. **API Health**: `https://seu-dominio.vercel.app/api/health`

### 3. Monitoramento

```bash
# Verificar logs no Vercel
vercel logs seu-projeto

# Monitorar performance
vercel analytics
```

## 🔧 Troubleshooting

### Erro: "Environment variable not found"

1. Verifique se todas as variáveis obrigatórias estão configuradas
2. Execute `npm run validate-env` localmente
3. Verifique se não há espaços extras nos nomes das variáveis

### Erro: "Supabase connection failed"

1. Verifique se `SUPABASE_URL` e `SUPABASE_KEY` estão corretas
2. Confirme se o projeto Supabase está ativo
3. Verifique se o domínio está configurado no Supabase

### Erro: "JWT secret too short"

1. `JWT_SECRET` deve ter pelo menos 32 caracteres
2. Use uma chave forte e única para produção
3. Não use a chave padrão do exemplo

### Erro: "Mercado Pago authentication failed"

1. Verifique se está usando credenciais de produção (`APP_USR-`)
2. Confirme se o token não expirou
3. Verifique se o webhook está configurado corretamente

### Build falha com "Module not found"

1. Execute `npm install` localmente
2. Verifique se todas as dependências estão no `package.json`
3. Limpe o cache: `npm run build` localmente

## 📊 Monitoramento e Logs

### Configuração de Alertas

1. Configure alertas no Vercel para:
   - Falhas de build
   - Erros 5xx
   - Tempo de resposta alto

### Logs Importantes

```bash
# Ver logs em tempo real
vercel logs --follow

# Filtrar por função
vercel logs --filter="/api/"

# Ver logs de erro
vercel logs --filter="ERROR"
```

## 🔄 Atualizações e Manutenção

### Deploy Automático

O Vercel fará deploy automático a cada push para a branch principal. Para controlar isso:

1. Configure branch protection rules
2. Use preview deployments para testar
3. Configure CI/CD com validações

### Backup de Configurações

```bash
# Exportar configurações do Vercel
vercel env ls > vercel-env-backup.txt

# Backup das configurações do projeto
vercel project ls > vercel-projects-backup.txt
```

## 📚 Recursos Adicionais

- [Documentação do Vercel](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Mercado Pago Integration](https://www.mercadopago.com.br/developers)

## 🆘 Suporte

Em caso de problemas:

1. Consulte os logs do Vercel
2. Execute `npm run validate-env` localmente
3. Verifique a documentação das APIs utilizadas
4. Entre em contato com o suporte técnico

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0.0