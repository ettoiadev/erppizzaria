# 🔧 SOLUÇÃO: Erro Admin Configurações - 401/403

## 🚨 **Problema Identificado**

**Erro:** `GET /api/admin/settings 401 (Unauthorized)` e `GET /api/admin/profile 403 (Forbidden)`

**Causa Raiz:** Usuário não está logado como administrador ou token inválido.

## 🔍 **Diagnóstico Realizado**

### ✅ **Status do Sistema:**
1. **Banco de Dados:** ✅ Funcionando
2. **APIs Admin:** ✅ Implementadas corretamente
3. **Autenticação:** ❌ **PROBLEMA AQUI**
4. **Conta Admin:** ✅ Existe (`admin@williamdiskpizza.com`)

### 🔑 **Problema de Autenticação:**
- Sistema usa **Supabase Auth** (não hash local)
- Login falha: credenciais não conhecidas para o admin
- Token não é enviado ou é inválido

## 🛠️ **SOLUÇÕES**

### **Opção 1: Reset da Senha Admin (RECOMENDADO)**

1. **Acesse o painel do Supabase:**
   - Vá para [Dashboard Supabase](https://supabase.com/dashboard)
   - Navegue para **Authentication > Users**

2. **Localize o usuário admin:**
   - Procure por: `admin@williamdiskpizza.com`
   - User ID: `90752a32-3773-4e62-a571-43d0779b838f`

3. **Reset da senha:**
   - Clique no usuário admin
   - Clique em "Send password recovery email" OU
   - Clique em "Reset password" e defina nova senha

4. **Teste o login:**
   - Acesse: [https://erppizzaria.vercel.app/admin/login](https://erppizzaria.vercel.app/admin/login)
   - Use: `admin@williamdiskpizza.com` + nova senha

### **Opção 2: Criar Nova Conta Admin**

```sql
-- Execute no SQL Editor do Supabase
-- 1. Criar usuário no Auth (fazer via Dashboard é mais fácil)
-- 2. Após criar, execute:

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'novo-admin@pizzaria.com';
```

### **Opção 3: Login Alternativo (Temporário)**

Use estas credenciais de teste se existirem:
- Email: `joicephf@gmail.com` (promover para admin)
- Verificar se tem senha definida

## 🧪 **Script de Teste Atualizado**

```javascript
// Use este script no console do navegador para testar:
async function testarLogin() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@williamdiskpizza.com',
      password: 'SUA_NOVA_SENHA_AQUI'
    })
  })
  
  const data = await response.json()
  console.log('Login result:', data)
  
  if (data.token) {
    localStorage.setItem('auth-token', data.token)
    localStorage.setItem('user-data', JSON.stringify(data.user))
    console.log('✅ Token salvo! Recarregue a página.')
  }
}

testarLogin()
```

## 🎯 **Passos Imediatos**

1. **AGORA:** Reset senha do admin via Supabase Dashboard
2. **Teste:** Login em [/admin/login](https://erppizzaria.vercel.app/admin/login)
3. **Acesse:** [/admin/configuracoes](https://erppizzaria.vercel.app/admin/configuracoes)
4. **Verifique:** Se APIs funcionam corretamente

## 🔐 **Credenciais Sugeridas**

Após reset, use:
- **Email:** `admin@williamdiskpizza.com`
- **Senha:** `WilliamPizza2024!` (ou qualquer senha forte)

## 📋 **Checklist de Verificação**

- [ ] Admin existe no Supabase Auth
- [ ] Senha foi resetada/definida
- [ ] Login funciona em `/admin/login`
- [ ] Token é salvo no localStorage
- [ ] API `/api/admin/settings` retorna 200
- [ ] API `/api/admin/profile` retorna 200
- [ ] Página `/admin/configuracoes` carrega sem erros

## 🚀 **Após a Correção**

O sistema voltará a funcionar completamente:
- ✅ Página de configurações carregará
- ✅ Todas as abas (Perfil, Geral, etc.) funcionarão
- ✅ Diagnóstico integrado mostrará status OK
- ✅ Logs detalhados no console para debug

---

**💡 Dica:** Use o botão "Mostrar Diagnóstico" na interface de erro para debug adicional. 