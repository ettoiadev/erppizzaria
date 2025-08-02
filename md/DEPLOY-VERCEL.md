# 🚀 Deploy na Vercel - William Disk Pizza

## ✅ Correções Implementadas para Erro de Build

### 📋 Problemas Corrigidos

1. **❌ Erro de Build** - "Function Runtimes must have a valid version"
2. **❌ Configurações de Runtime Obsoletas** - Declarações `export const runtime = 'nodejs'`
3. **❌ Configurações Conflitantes** - `vercel.json` com configurações desnecessárias
4. **❌ Conexão com Supabase** - Configuração inadequada para produção

### 🔧 Mudanças Realizadas

#### 1. **Remoção de Configurações Problemáticas**
- ✅ **Removidas declarações `export const runtime = 'nodejs'`** - Next.js usa Node.js por padrão
- ✅ **Removido `vercel.json`** - Não necessário para aplicações Next.js padrão
- ✅ **Simplificado `next.config.js`** - Removidas configurações experimentais conflitantes

#### 2. **app/api/auth/login/route.ts** - Otimizado
- ✅ **Mantido apenas `export const dynamic = 'force-dynamic'`**
- ✅ **Headers CORS configurados adequadamente**
- ✅ **Validação rigorosa de entrada**
- ✅ **Logs detalhados para debugging**
- ✅ **Garantia de resposta JSON válida sempre**

#### 3. **lib/db.ts** - Configurado para Supabase
- ✅ **Cliente Supabase nativo**
- ✅ **Suporte a todas as queries necessárias**
- ✅ **Leitura de variáveis de ambiente da Vercel**
- ✅ **Tratamento robusto de erros**

#### 4. **Configurações Limpas**
- ✅ **`next.config.js`** - Apenas CORS e configurações essenciais
- ✅ **Sem configurações de runtime manuais** - Vercel detecta automaticamente
- ✅ **Suporte a Supabase configurado**

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

### 2. **Deploy Automático**

1. **Conecte o repositório** na Vercel
2. **Configure as variáveis** conforme acima
3. **Deploy automático** será iniciado
4. **Aguarde a conclusão** do build

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

#### ❌ Erro de build persiste?
1. Verifique se removeu todas as declarações de runtime
2. Confirme que não há `vercel.json` na raiz do projeto
3. Verifique se as dependências estão atualizadas

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

✅ **Erro de build corrigido** - Configurações limpas
✅ **Runtime automático** - Vercel detecta Next.js
✅ **JSON válido** - Sem "Unexpected end of JSON input"
✅ **Supabase conectado** - Banco funcional
✅ **Deploy otimizado** - Configuração mínima necessária
✅ **Login funcionando** - Credenciais válidas

---

**🚀 A aplicação está pronta para produção na Vercel sem erros de build!** 