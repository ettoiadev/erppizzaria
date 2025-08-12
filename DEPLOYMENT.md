# Guia de Deployment - ERP Pizzaria

## Configuração de Variáveis de Ambiente no Vercel

Para fazer o deployment da aplicação no Vercel, você precisa configurar as seguintes variáveis de ambiente no painel do Vercel:

### 1. Acesse o painel do Vercel
- Vá para [vercel.com](https://vercel.com)
- Acesse seu projeto
- Vá em **Settings** > **Environment Variables**

### ⚠️ Importante: Remover Variáveis Legadas

Se você tiver as seguintes variáveis configuradas no Vercel, **REMOVA-AS** pois são legadas e podem causar conflitos:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

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

## Troubleshooting

### Erro: "SUPABASE_URL não configurada"
- Verifique se a variável `SUPABASE_URL` está configurada no Vercel
- Certifique-se de que não há espaços em branco no valor

### Erro: "Token de teste em produção"
- Configure `ALLOW_TEST_TOKENS=true` se quiser usar tokens de teste temporariamente
- Para produção, use um token que comece com `APP_USR-`

### Erro: "TypeError: e.from(...).select(...).eq is not a function"
- Este erro indica problema na instrumentação do cliente Supabase
- Verifique se o build local funciona com `npm run build`
- Se persistir, pode ser um problema de cache do Vercel - tente um novo deploy

### Avisos sobre variáveis legadas
- Remova `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` do Vercel
- Use apenas `SUPABASE_URL` e `SUPABASE_KEY`

### Build falha com erro de validação
- Verifique se todas as variáveis obrigatórias estão configuradas
- Remova variáveis legadas como `NEXT_PUBLIC_SUPABASE_*`
- Certifique-se de que os valores não contêm caracteres especiais não escapados

### Deploy bem-sucedido mas APIs falhando
- Verifique se as variáveis de ambiente estão corretas no Vercel
- Teste a conexão com Supabase usando a rota `/api/test-db-connection`
- Verifique os logs do Vercel para erros específicos