# 🚨 SOLUÇÃO IMEDIATA: Erro Login Admin

## 📍 **Problema Confirmado**
```
POST /api/auth/login 401 (Unauthorized)
{"error":"Credenciais inválidas"}
```

**Email tentado:** `admin@williamdiskpizza.com`  
**Status:** ✅ Conta existe no Supabase Auth  
**Problema:** ❌ Senha incorreta/não definida

## 🎯 **SOLUÇÕES IMEDIATAS**

### **OPÇÃO 1: Resetar Senha via Supabase Dashboard (MAIS RÁPIDA)**

1. **Acesse:** [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Projeto:** Selecione o projeto do ERP Pizzaria
3. **Menu:** Authentication → Users
4. **Buscar:** `admin@williamdiskpizza.com`
5. **Ação:** Clique no usuário → "Reset password"
6. **Nova senha:** `AdminPizza2024!`
7. **Teste:** Login em [/admin/login](https://erppizzaria.vercel.app/admin/login)

### **OPÇÃO 2: Criar Nova Conta Admin**

**Via Supabase Dashboard:**
1. **Authentication → Users**
2. **"Add user"** ou "Invite user"
3. **Email:** `novo.admin@pizzaria.com`
4. **Password:** `NovoAdmin123!`
5. **Depois:** Execute SQL para promover:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'novo.admin@pizzaria.com';
```

### **OPÇÃO 3: Usar Conta Existente Promovida**

Se `joicephf@gmail.com` foi promovida para admin, tente:
1. **Email:** `joicephf@gmail.com`
2. **Senhas possíveis:** (se conhece a senha original)
3. **Ou:** Reset senha desta conta também

## 🧪 **TESTE RÁPIDO**

Após resetar senha, teste no console do navegador:

```javascript
// Console do navegador (F12)
async function testarLoginAdmin() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@williamdiskpizza.com',
      password: 'AdminPizza2024!'  // Ou a senha que você definiu
    })
  })
  
  const data = await response.json()
  console.log('🔐 Login result:', data)
  
  if (data.token) {
    localStorage.setItem('auth-token', data.token)
    localStorage.setItem('user-data', JSON.stringify(data.user))
    console.log('✅ Login OK! Redirecionando...')
    window.location.href = '/admin/configuracoes'
  } else {
    console.log('❌ Login falhou:', data.error)
  }
}

testarLoginAdmin()
```

## 🔑 **CREDENCIAIS SUGERIDAS**

Após reset, use:

**Admin Principal:**
- 📧 **Email:** `admin@williamdiskpizza.com`
- 🔐 **Senha:** `AdminPizza2024!`

**Admin Alternativo:**
- 📧 **Email:** `novo.admin@pizzaria.com`
- 🔐 **Senha:** `NovoAdmin123!`

## ⚡ **VERIFICAÇÃO FINAL**

Após login bem-sucedido:
- ✅ Token salvo no localStorage
- ✅ Redirecionamento para `/admin/configuracoes`
- ✅ Página carrega sem erros 401/403
- ✅ Todas as 7 abas funcionais

## 🎯 **PRÓXIMOS PASSOS**

1. **Reset senha** via Supabase Dashboard
2. **Login** em [/admin/login](https://erppizzaria.vercel.app/admin/login)
3. **Teste** em [/admin/configuracoes](https://erppizzaria.vercel.app/admin/configuracoes)
4. **Confirmar** que não há mais erros 401/403

---

**💡 A correção das APIs está OK - só precisa de login válido!** 