# 🔧 CRIAR USUÁRIO ADMIN: ettoiadev@gmail.com

## 📋 **Credenciais Solicitadas**
- **Email:** `ettoiadev@gmail.com`
- **Senha:** `admin123`
- **Role:** `admin`

## 🎯 **MÉTODO RECOMENDADO: Supabase Dashboard**

### **Passo 1: Acessar Supabase Dashboard**
1. **Acesse:** [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Login:** Na conta do projeto ERP Pizzaria
3. **Selecione:** O projeto correto

### **Passo 2: Criar Usuário no Auth**
1. **Menu lateral:** **Authentication**
2. **Submenu:** **Users**
3. **Botão:** **"Add user"** ou **"Invite user"**
4. **Preencher:**
   - Email: `ettoiadev@gmail.com`
   - Password: `admin123`
   - Confirm password: `admin123`
5. **Criar:** Clique em **"Create user"**

### **Passo 3: Promover para Admin**
1. **SQL Editor:** No Supabase Dashboard
2. **Execute o comando:**

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'ettoiadev@gmail.com';
```

3. **Verificar:** Execute para confirmar:

```sql
SELECT email, role, created_at 
FROM profiles 
WHERE email = 'ettoiadev@gmail.com';
```

## 🧪 **TESTE DO LOGIN**

Após criação, teste:

1. **Acesse:** [https://erppizzaria.vercel.app/admin/login](https://erppizzaria.vercel.app/admin/login)
2. **Login com:**
   - Email: `ettoiadev@gmail.com`
   - Senha: `admin123`
3. **Verificar:** Redirecionamento para dashboard admin
4. **Teste:** [/admin/configuracoes](https://erppizzaria.vercel.app/admin/configuracoes)

## 🔄 **MÉTODO ALTERNATIVO: Via Console**

Se você tem acesso ao console do navegador, pode testar após criar via Dashboard:

```javascript
// Execute no console do navegador (F12)
async function testarLoginEttoia() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ettoiadev@gmail.com',
      password: 'admin123'
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

testarLoginEttoia()
```

## ❌ **Por que o Script Falhou?**

O registro via API está retornando erro 500, provavelmente por:
- Configuração de segurança do Supabase
- Políticas RLS (Row Level Security)
- Validações específicas no servidor

## ✅ **Vantagens do Método Dashboard**

- ✅ **Mais seguro:** Interface oficial do Supabase
- ✅ **Mais confiável:** Sem dependência de APIs customizadas
- ✅ **Controle total:** Visualização direta dos usuários
- ✅ **Debug fácil:** Interface gráfica para troubleshooting

## 🎯 **Resultado Esperado**

Após criação e promoção:

✅ **Usuário existe no Supabase Auth**  
✅ **Profile criado com role 'admin'**  
✅ **Login funciona em /admin/login**  
✅ **Acesso completo a /admin/configuracoes**  
✅ **Sem erros 401/403**

## 📱 **Links Úteis**

- **Supabase Dashboard:** [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Admin Login:** [/admin/login](https://erppizzaria.vercel.app/admin/login)
- **Admin Config:** [/admin/configuracoes](https://erppizzaria.vercel.app/admin/configuracoes)

---

**💡 Dica:** O método via Dashboard é o mais rápido e confiável! 