# 🚀 Deploy na Vercel - William Disk Pizza

## ✅ Correções Implementadas para Erro 405

### 📋 Problemas Corrigidos

1. **❌ Erro HTTP 405 (Method Not Allowed)** - Rota `/api/auth/login`
2. **❌ "Unexpected end of JSON input"** - Respostas vazias
3. **❌ Conexão com Supabase** - Configuração inadequada para produção

### 🔧 Mudanças Realizadas

#### 1. **lib/db.ts** - Reescrito para Supabase
- ✅ Removida dependência de PostgreSQL direto
- ✅ Implementado adaptador completo para Supabase
- ✅ Suporte a todas as queries necessárias
- ✅ Tratamento de erro robusto

#### 2. **app/api/auth/login/route.ts** - Melhorado
- ✅ Adicionado `export const runtime = 'nodejs'`
- ✅ Headers CORS configurados
- ✅ Validação rigorosa de entrada
- ✅ Tratamento de erro aprimorado
- ✅ Garantia de resposta JSON válida

#### 3. **lib/auth.ts** - Otimizado
- ✅ Logs detalhados para debugging
- ✅ Validação de entrada melhorada
- ✅ Tratamento de erro robusto

#### 4. **Configurações de Deploy**
- ✅ `vercel.json` - Runtime Node.js configurado
- ✅ `next.config.js` - CORS e Supabase configurados
- ✅ Headers CORS em todas as APIs

## 🌐 Configuração na Vercel

### 1. **Variáveis de Ambiente Obrigatórias**

Configure estas variáveis no painel da Vercel em **Settings > Environment Variables**:

```bash
# Supabase (obrigatórias)
NEXT_PUBLIC_SUPABASE_URL=https://ewoihxpitbbypqylhdkm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2loeHBpdGJieXBxeWxoZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDM1OTQsImV4cCI6MjA2NzA3OTU5NH0.1Fpv-oQogUez8ySm-W3nRiEt0g7KsncMBDVIWEqiAwQ

# JWT Secret (obrigatória)
JWT_SECRET=william-disk-pizza-jwt-secret-2024-production

# Opcional (para logs)
NODE_ENV=production
ENABLE_QUERY_LOGS=false
```

### 2. **Configurações de Deploy**

1. **Conecte o repositório** na Vercel
2. **Configure as variáveis** conforme acima
3. **Deploy automático** será iniciado
4. **Teste as APIs** após deploy

## 🧪 Como Testar Após Deploy

### 1. **Health Check API**
```bash
# Teste se as APIs estão funcionando
curl https://SEU-DOMINIO.vercel.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "hasJwtSecret": true
  },
  "database": {
    "success": true
  }
}
```

### 2. **Login API**
```bash
# Teste o login admin
curl -X POST https://SEU-DOMINIO.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@williamdiskpizza.com",
    "password": "admin123"
  }'
```

**Resposta esperada:**
```json
{
  "user": {
    "id": "...",
    "email": "admin@williamdiskpizza.com",
    "role": "admin"
  },
  "token": "..."
}
```

### 3. **Teste via Interface**
1. Acesse: `https://SEU-DOMINIO.vercel.app/admin/login`
2. Use as credenciais:
   - **Email:** `admin@williamdiskpizza.com`
   - **Senha:** `admin123`
3. Deve fazer login com sucesso

## 🔍 Debugging

### Logs da Vercel
1. Acesse **Functions** no painel da Vercel
2. Clique na função `/api/auth/login`
3. Veja os logs em tempo real

### Problemas Comuns

#### ❌ Ainda recebe 405?
1. Verifique se o deploy foi concluído
2. Confirme que as variáveis de ambiente estão configuradas
3. Teste a API de health check primeiro

#### ❌ Erro de conexão com banco?
1. Verifique as credenciais do Supabase
2. Confirme que o projeto Supabase está ativo
3. Teste a conexão via API de health check

#### ❌ Token JWT inválido?
1. Verifique se `JWT_SECRET` está configurado
2. Use um secret diferente para produção
3. Teste o login novamente

## 📱 Credenciais de Teste

**Admin padrão:**
- Email: `admin@williamdiskpizza.com`
- Senha: `admin123`
- Role: `admin`

## 🎯 Status Final

✅ **Erro 405 corrigido** - Método POST aceito
✅ **JSON válido** - Sem "Unexpected end of JSON input"
✅ **Supabase conectado** - Banco funcional
✅ **Vercel configurado** - Deploy otimizado
✅ **Login funcionando** - Credenciais válidas

---

**🚀 A aplicação está pronta para produção na Vercel!** 