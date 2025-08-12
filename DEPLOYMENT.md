# Guia de Deployment - ERP Pizzaria

## Configuração do Deploy no Vercel

### 1. Conecte seu repositório
- Acesse [vercel.com](https://vercel.com)
- Importe seu repositório do GitHub
- Selecione o framework Next.js

### 2. Configure as variáveis de ambiente

No painel do Vercel, vá em **Settings** > **Environment Variables** e adicione:

#### Supabase
```
SUPASBASE_URL=https://seu-projeto.supabase.co
SUPASBASE_KEY=sua_service_role_key_aqui
```

#### Autenticação
```
JWT_SECRET=sua_chave_secreta_super_segura_aqui_min_32_chars
```

#### Mercado Pago
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=sua_webhook_secret_aqui
```

#### URL Pública
```
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

### 3. Deploy
- O Vercel fará o deploy automático a cada push na branch principal
- Você também pode fazer deploy manual pelo painel do Vercel

## Troubleshooting

### Erro: Failed to collect page data for /api/about-content
**Solução:**
1. Simplificada a função GET para evitar verificações desnecessárias
2. Removida lógica de inserção automática durante o build
3. Melhorado tratamento de erros com try/catch

### APIs falhando após deploy
1. Verifique os logs no painel do Vercel
2. Confirme se todas as variáveis de ambiente estão configuradas
3. Teste os endpoints manualmente