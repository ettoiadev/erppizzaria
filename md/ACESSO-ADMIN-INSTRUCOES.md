# 🔑 COMO ACESSAR O ADMIN - INSTRUÇÕES DEFINITIVAS

## 🚨 **PROBLEMA ATUAL**
- Senha do `joicephf@gmail.com` é desconhecida
- Conta `admin@williamdiskpizza.com` também sem senha conhecida
- Precisa de acesso admin para testar a correção

## 🎯 **SOLUÇÕES (EM ORDEM DE FACILIDADE)**

### **OPÇÃO 1: Reset via Supabase Dashboard (RECOMENDADO)**

1. **Acesse o Supabase Dashboard:**
   - URL: [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na conta do projeto

2. **Navegue para Authentication:**
   - Menu lateral: **Authentication**
   - Submenu: **Users**

3. **Encontre o usuário admin:**
   - Procure por: `admin@williamdiskpizza.com`
   - OU procure por: `joicephf@gmail.com`

4. **Reset a senha:**
   - Clique no usuário
   - Botão **"Reset password"**
   - Defina nova senha: `AdminPizza2024!`

5. **Teste o login:**
   - Acesse: [https://erppizzaria.vercel.app/admin/login](https://erppizzaria.vercel.app/admin/login)
   - Use email + nova senha

### **OPÇÃO 2: Script via Console do Navegador**

1. **Abra o navegador** em [https://erppizzaria.vercel.app](https://erppizzaria.vercel.app)
2. **Console (F12)** e execute:

```javascript
// Simular login direto (apenas para teste)
async function loginAdmin() {
  // Definir token manualmente (necessário acesso ao Supabase)
  const fakeToken = "eyJ...token_do_supabase...";
  const adminUser = {
    id: "90752a32-3773-4e62-a571-43d0779b838f",
    email: "admin@williamdiskpizza.com",
    role: "ADMIN"
  };
  
  localStorage.setItem("auth-token", fakeToken);
  localStorage.setItem("user-data", JSON.stringify(adminUser));
  
  console.log("✅ Token definido! Redirecionando...");
  window.location.href = "/admin/configuracoes";
}
```

### **OPÇÃO 3: Criar Novo Admin via SQL**

Execute no **SQL Editor do Supabase**:

```sql
-- 1. Primeiro, criar usuário no Supabase Auth via Dashboard
-- Email: novo.admin@pizzaria.com
-- Senha: NovoAdmin123!

-- 2. Depois, atualizar role no profiles
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'novo.admin@pizzaria.com';
```

## 🧪 **VERIFICAÇÃO RÁPIDA**

Se você tem acesso ao **SQL Editor do Supabase**, execute:

```sql
-- Ver todos os admins
SELECT email, role, user_id, created_at 
FROM profiles 
WHERE role = 'admin' 
ORDER BY created_at DESC;
```

## 📱 **CREDENCIAIS SUGERIDAS**

Após reset, use uma destas combinações:

### **Admin Principal:**
- 📧 **Email:** `admin@williamdiskpizza.com`
- 🔐 **Senha:** `WilliamPizza2024!`

### **Admin Backup:**
- 📧 **Email:** `joicephf@gmail.com`  
- 🔐 **Senha:** `PizzaAdmin123!`

## ⚡ **TESTE RÁPIDO**

Após definir a senha, teste:

1. **Login:** [/admin/login](https://erppizzaria.vercel.app/admin/login)
2. **Configurações:** [/admin/configuracoes](https://erppizzaria.vercel.app/admin/configuracoes)
3. **Verifique:** Se não aparecem mais os erros 401/403

## 🎯 **RESULTADO ESPERADO**

✅ **Login bem-sucedido**  
✅ **Token salvo no localStorage**  
✅ **Página `/admin/configuracoes` carrega sem erros**  
✅ **Todas as 7 abas funcionais**  
✅ **APIs retornam 200 OK**

---

**💡 Dica:** A solução mais rápida é o reset via Supabase Dashboard! 