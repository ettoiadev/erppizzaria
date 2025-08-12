# Guia de Deployment - ERP Pizzaria

## Configuração de Variáveis de Ambiente no Vercel

Para fazer o deployment da aplicação no Vercel, você precisa configurar as seguintes variáveis de ambiente no painel do Vercel:

### 1. Acesse o painel do Vercel
- Vá para [vercel.com](https://vercel.com)
- Acesse seu projeto
- Vá em **Settings** > **Environment Variables**

### ⚠️ AVISOS IMPORTANTES

#### Variáveis Legadas do Supabase
Se você tiver as seguintes variáveis configuradas no Vercel, **REMOVA-AS** pois são legadas e podem causar conflitos:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Estas são variáveis legadas que podem causar conflitos. Use apenas:
- `SUPABASE_URL`
- `SUPABASE_KEY`

#### Configurações do NPM
O arquivo `.npmrc` foi otimizado para evitar problemas no GitHub Actions:
- Removidas configurações problemáticas de CI
- Ajustadas configurações de cache
- Mantidas apenas configurações essenciais

### 2. Configure as seguintes variáveis:

#### Supabase (Obrigatórias)
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_service_role_key_aqui
```

#### Autenticação (Obrigatória)
```
JWT_SECRET=sua_chave_secreta_super_segura_aqui_min_32_chars
```

#### Mercado Pago (Obrigatórias)
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=sua_webhook_secret_aqui
ALLOW_TEST_TOKENS=false
```

#### URL Pública (Obrigatória)
```
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

### 3. Valores para cada ambiente:

#### Development
- Use as chaves de teste do Mercado Pago (TEST-xxxx)
- Use a URL de desenvolvimento

#### Production
- Use as chaves de produção do Mercado Pago (APP_USR-xxxx)
- Use a URL final do seu domínio

### 4. Importante:
- **NUNCA** commite chaves sensíveis no código
- Use sempre a **service role key** do Supabase em produção
- Configure as variáveis para os ambientes corretos (Development/Preview/Production)

### 5. Após configurar:
1. Faça um novo deployment ou redeploy
2. Verifique se todas as variáveis estão sendo carregadas corretamente
3. Teste as funcionalidades principais

## 🚀 Deploy no Vercel via GitHub Actions

O projeto está configurado para deploy automático via GitHub Actions quando há push na branch `main`.

### Configuração dos Secrets no GitHub:

1. Vá em **Settings** > **Secrets and variables** > **Actions**
2. Adicione os seguintes secrets:

#### Secrets do Vercel (obrigatórios):
- `VERCEL_TOKEN`: Token de acesso do Vercel (Settings > Tokens)
- `VERCEL_ORG_ID`: ID da organização/usuário no Vercel
- `VERCEL_PROJECT_ID`: ID do projeto no Vercel

#### Como obter os IDs do Vercel:
1. Instale a CLI do Vercel: `npm i -g vercel`
2. Execute `vercel link` no projeto
3. Os IDs serão salvos em `.vercel/project.json`

## 🔧 Troubleshooting

### Erro: "SUPABASE_URL não configurada"
- Verifique se a variável `SUPABASE_URL` está configurada no Vercel
- Certifique-se de que não há espaços em branco no valor

### Erro: "Token de teste em produção"
- Configure `ALLOW_TEST_TOKENS=true` se quiser usar tokens de teste temporariamente
- Para produção, use um token que comece com `APP_USR-`

### Erro: `TypeError: e.from(...).select(...).eq is not a function`
**Causa:** Problema com a instrumentação do Supabase que quebra a cadeia de métodos.
**Solução:** Verificar se o arquivo `lib/supabase-logger.ts` está usando Proxy corretamente.

### Aviso sobre variáveis legadas do Supabase
**Causa:** Presença de `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no ambiente.
**Solução:** Remover essas variáveis do Vercel e manter apenas `SUPABASE_URL` e `SUPABASE_KEY`.

### Falha no GitHub Actions - Install dependencies
**Causa:** Configurações problemáticas no `.npmrc` (ci=true, cache-max, optional=false).
**Solução:** 
1. Arquivo `.npmrc` foi corrigido
2. Removidas configurações conflitantes
3. Adicionada variável `ALLOW_TEST_TOKENS=true` no workflow

### Erro: Git author must have access to the project on Vercel
**Causa:** O usuário do Git não tem permissões adequadas no projeto Vercel.
**Solução:**
1. Adicionar o usuário como colaborador no projeto Vercel
2. Ou usar o token do GitHub no workflow (já configurado)
3. Verificar se `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` estão corretos nos secrets

### Erro: Failed to collect page data for /api/about-content
**Causa:** Lógica complexa na API route causando falhas durante o build.
**Solução:**
1. Simplificada a função GET para evitar verificações desnecessárias
2. Removida lógica de inserção automática durante o build
3. Melhorado tratamento de erros com try/catch

### Build falha com erro de validação
- Verifique se todas as variáveis obrigatórias estão configuradas
- Remova variáveis legadas como `NEXT_PUBLIC_SUPABASE_*`
- Certifique-se de que os valores não contêm caracteres especiais não escapados

### APIs falhando após deploy bem-sucedido
**Causa:** Conflitos de configuração ou problemas de instrumentação.
**Solução:** 
1. Verificar logs do Vercel
2. Confirmar variáveis de ambiente
3. Testar endpoints individualmente