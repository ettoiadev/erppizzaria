# Guia de Deploy na Vercel - ERP Pizzaria

## Problema Identificado

O erro de deploy ocorre porque as variáveis de ambiente do Supabase não estão configuradas na Vercel:

```
Error: [Supabase] SUPABASE_KEY não configurada. Configure no arquivo .env.local
```

## Solução: Configurar Variáveis de Ambiente na Vercel

### 1. Acesse o Painel da Vercel

1. Vá para [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Selecione o projeto `erppizzaria`
4. Vá para **Settings** > **Environment Variables**

### 2. Configure as Variáveis Obrigatórias

Adicione as seguintes variáveis de ambiente:

#### Supabase (OBRIGATÓRIAS)
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-ou-service-role
```

#### Autenticação
```
JWT_SECRET=sua_chave_secreta_super_segura_aqui
```

#### Ambiente
```
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

#### Mercado Pago (se usar pagamentos)
```
MERCADOPAGO_ACCESS_TOKEN=PROD-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_producao
```

### 3. Como Obter as Credenciais do Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Vá para o seu projeto
3. Clique em **Settings** > **API**
4. Copie:
   - **URL**: Para `SUPABASE_URL`
   - **anon/public key**: Para `SUPABASE_KEY` (recomendado para produção)
   - **service_role key**: Apenas se precisar de acesso administrativo

### 4. Configuração no Painel da Vercel

Para cada variável:

1. Clique em **Add New**
2. Digite o **Name** (ex: `SUPABASE_URL`)
3. Digite o **Value** (ex: `https://seu-projeto.supabase.co`)
4. Selecione os ambientes:
   - ✅ **Production**
   - ✅ **Preview** 
   - ✅ **Development**
5. Clique em **Save**

### 5. Redeploy do Projeto

Após configurar todas as variáveis:

1. Vá para **Deployments**
2. Clique nos **três pontos** do último deploy
3. Selecione **Redeploy**
4. Confirme o redeploy

## Arquivos Criados/Modificados

### ✅ `vercel.json`
- Configurações específicas da Vercel
- Mapeamento de variáveis de ambiente
- Configurações de timeout para APIs

### ✅ `next.config.js`
- Configuração de variáveis de ambiente
- Otimizações para WebSocket (Supabase Realtime)
- Configurações para fontes externas

### ✅ `.env.production`
- Template para variáveis de produção
- Valores de exemplo (não usar em produção)

### ✅ `lib/supabase.ts`
- Melhor tratamento de erros
- Logs de debug para produção
- Mensagens mais informativas

## Verificação do Deploy

Após o redeploy, verifique:

1. **Build Success**: O build deve completar sem erros
2. **Environment Variables**: Logs devem mostrar variáveis configuradas
3. **Supabase Connection**: APIs devem conectar com o Supabase
4. **Functionality**: Teste login, cadastro e funcionalidades principais

## Troubleshooting

### Se ainda houver erro de variáveis:

1. Verifique se todas as variáveis estão salvas
2. Confirme que os valores estão corretos
3. Tente um novo deploy (não redeploy)
4. Verifique os logs de build na Vercel

### Se houver erro de conexão com Supabase:

1. Verifique se a URL do Supabase está correta
2. Confirme se a chave tem as permissões necessárias
3. Teste a conexão localmente primeiro

### Logs de Debug

Os logs agora mostram informações úteis:
```
[Supabase Debug] Environment variables check:
- SUPABASE_URL exists: true
- SUPABASE_KEY exists: true
- NODE_ENV: production
```

## Próximos Passos

1. Configure as variáveis na Vercel
2. Faça o redeploy
3. Teste todas as funcionalidades
4. Configure domínio personalizado (opcional)
5. Configure monitoramento (opcional)

---

**Importante**: Nunca commite credenciais reais no código. Use sempre as variáveis de ambiente da Vercel para dados sensíveis.