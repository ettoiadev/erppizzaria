# Guia de Variáveis de Ambiente - ERP Pizzaria

## Visão Geral

Este documento descreve todas as variáveis de ambiente utilizadas no projeto ERP Pizzaria, suas finalidades, configurações recomendadas e boas práticas de segurança.

## Princípios de Segurança

### ✅ Variáveis Públicas (Frontend)
- **Prefixo**: `NEXT_PUBLIC_`
- **Exposição**: Acessíveis no navegador
- **Uso**: Configurações não sensíveis necessárias no frontend
- **Exemplo**: URLs base, configurações de UI

### 🔒 Variáveis Privadas (Servidor)
- **Prefixo**: Nenhum
- **Exposição**: Apenas no servidor (API Routes, Server Components)
- **Uso**: Chaves de API, segredos, credenciais de banco
- **Exemplo**: JWT secrets, tokens de pagamento

## Variáveis Obrigatórias

### Supabase (Banco de Dados)

#### `SUPABASE_URL`
- **Tipo**: Privada (servidor)
- **Descrição**: URL do projeto Supabase
- **Desenvolvimento**: `http://localhost:54321`
- **Produção**: `https://seu-projeto.supabase.co`
- **Uso**: Conexão com banco de dados

#### `SUPABASE_KEY`
- **Tipo**: Privada (servidor)
- **Descrição**: Chave de autenticação do Supabase
- **Desenvolvimento**: Anon key (público, mas limitado)
- **Produção**: Service role key (acesso completo)
- **Segurança**: ⚠️ NUNCA exponha service role key ao frontend

### Autenticação

#### `JWT_SECRET`
- **Tipo**: Privada (servidor)
- **Descrição**: Chave secreta para assinatura de tokens JWT
- **Geração**: `openssl rand -base64 32`
- **Requisitos**: Mínimo 32 caracteres, alta entropia
- **Segurança**: 🔴 CRÍTICO - Nunca exponha esta chave

### Pagamentos (Mercado Pago)

#### `MERCADOPAGO_ACCESS_TOKEN`
- **Tipo**: Privada (servidor)
- **Descrição**: Token de acesso para API do Mercado Pago
- **Desenvolvimento**: `TEST-xxxx` (sandbox)
- **Produção**: `APP_USR-xxxx` (produção)
- **Uso**: Criação de pagamentos, consultas

#### `MERCADOPAGO_WEBHOOK_SECRET`
- **Tipo**: Privada (servidor)
- **Descrição**: Chave para validação de webhooks
- **Uso**: Verificar autenticidade de notificações
- **Segurança**: Essencial para prevenir fraudes

### Configurações Públicas

#### `NEXT_PUBLIC_SITE_URL`
- **Tipo**: Pública (frontend + servidor)
- **Descrição**: URL base da aplicação
- **Desenvolvimento**: `http://localhost:3000`
- **Produção**: `https://seu-dominio.vercel.app`
- **Uso**: Redirects, webhooks, links absolutos

## Variáveis Opcionais

### Desenvolvimento

#### `NODE_ENV`
- **Valores**: `development`, `production`, `test`
- **Uso**: Controle de comportamento por ambiente

#### `ENABLE_QUERY_LOGS`
- **Tipo**: Boolean (`true`/`false`)
- **Uso**: Habilitar logs de consultas SQL
- **Recomendação**: `true` em desenvolvimento, `false` em produção

#### `ENABLE_SLOW_QUERY_LOGS`
- **Tipo**: Boolean
- **Uso**: Log de consultas lentas

#### `SLOW_QUERY_THRESHOLD`
- **Tipo**: Number (milissegundos)
- **Padrão**: `1000`
- **Uso**: Limite para considerar consulta lenta

### Performance

#### `RATE_LIMIT_REQUESTS`
- **Tipo**: Number
- **Padrão**: `100`
- **Uso**: Limite de requisições por minuto

#### `DATABASE_TIMEOUT`
- **Tipo**: Number (milissegundos)
- **Padrão**: `30000`
- **Uso**: Timeout para consultas de banco

## Configuração por Ambiente

### Desenvolvimento Local

```bash
# .env.local
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=sua_chave_local_desenvolvimento
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890
MERCADOPAGO_WEBHOOK_SECRET=webhook_secret_test
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
ENABLE_QUERY_LOGS=true
```

### Produção (Vercel)

```bash
# Configurar via Vercel Dashboard ou CLI
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # SERVICE ROLE
JWT_SECRET=chave_super_segura_producao_32_chars_min
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890
MERCADOPAGO_WEBHOOK_SECRET=webhook_secret_producao
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
NODE_ENV=production
```

## Migração de Variáveis Legadas

### ❌ Variáveis Descontinuadas

As seguintes variáveis foram removidas por questões de segurança:

- `NEXT_PUBLIC_SUPABASE_URL` → Use `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Use `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` → Use `SUPABASE_KEY`

### Processo de Migração

1. **Remover variáveis legadas** do arquivo `.env`
2. **Atualizar código** que referencia variáveis antigas
3. **Configurar novas variáveis** seguindo este guia
4. **Testar funcionalidade** em desenvolvimento
5. **Atualizar produção** com novas variáveis

## Boas Práticas de Segurança

### ✅ Fazer

- Use `SUPABASE_KEY` apenas no servidor
- Mantenha `JWT_SECRET` com alta entropia (32+ chars)
- Use tokens de teste em desenvolvimento
- Configure rate limiting adequado
- Monitore logs de acesso

### ❌ Não Fazer

- Nunca exponha service role key ao frontend
- Não commite arquivos `.env` no Git
- Não use tokens de produção em desenvolvimento
- Não reutilize secrets entre ambientes
- Não ignore validação de webhooks

## Validação de Configuração

### Checklist de Desenvolvimento

- [ ] Arquivo `.env.local` criado
- [ ] Todas as variáveis obrigatórias configuradas
- [ ] Supabase local funcionando
- [ ] JWT secret configurado
- [ ] Mercado Pago em modo teste

### Checklist de Produção

- [ ] Variáveis configuradas no Vercel
- [ ] Service role key do Supabase
- [ ] JWT secret único e seguro
- [ ] Tokens de produção do Mercado Pago
- [ ] URL de produção correta
- [ ] Logs de produção desabilitados

## Troubleshooting

### Erro: "SUPABASE_URL não configurada"

**Causa**: Variável não definida ou mal configurada

**Solução**:
1. Verificar arquivo `.env.local`
2. Confirmar sintaxe correta
3. Reiniciar servidor de desenvolvimento

### Erro: "JWT verification failed"

**Causa**: `JWT_SECRET` inconsistente entre ambientes

**Solução**:
1. Usar mesmo secret em todos os ambientes
2. Verificar se não há espaços extras
3. Confirmar encoding correto

### Erro: "Mercado Pago authentication failed"

**Causa**: Token inválido ou expirado

**Solução**:
1. Verificar token no dashboard do MP
2. Confirmar ambiente (TEST vs PROD)
3. Regenerar token se necessário

## Monitoramento

### Logs Importantes

- Falhas de autenticação
- Timeouts de banco
- Erros de webhook
- Rate limiting ativado

### Métricas de Segurança

- Tentativas de acesso não autorizado
- Uso de tokens inválidos
- Padrões de tráfego suspeitos

## Contato

Para dúvidas sobre configuração de variáveis de ambiente:

- Documentação Supabase: https://supabase.com/docs
- Documentação Vercel: https://vercel.com/docs
- Documentação Mercado Pago: https://www.mercadopago.com.br/developers