# Guia de Deployment - ERP Pizzaria

## Configuração de Variáveis de Ambiente no Vercel

Para fazer o deployment da aplicação no Vercel, você precisa configurar as seguintes variáveis de ambiente no painel do Vercel:

### 1. Acesse o painel do Vercel
- Vá para [vercel.com](https://vercel.com)
- Acesse seu projeto
- Vá em **Settings** > **Environment Variables**

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

### Erro: "Environment Variable references Secret which does not exist"
- Este erro foi corrigido removendo as referências a secrets no `vercel.json`
- Configure as variáveis diretamente no painel do Vercel

### Erro: "SUPABASE_URL is not defined"
- Verifique se a variável está configurada no ambiente correto
- Certifique-se de que o deployment está usando o ambiente correto

### Erro de autenticação Supabase
- Verifique se está usando a service role key correta
- Confirme se a URL do Supabase está correta