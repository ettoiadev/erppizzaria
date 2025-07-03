# 🐛 Debug do Erro HTTP 405 - Login

## 📋 Problema
- Erro: `POST https://erppizzaria.vercel.app/api/auth/login 405 (Method Not Allowed)`
- Response text vazio
- Funciona localmente, falha na Vercel

## 🧪 Rotas de Teste Criadas

### 1. `/api/simple-test` - Rota Ultra Simples
```bash
# GET
curl https://erppizzaria.vercel.app/api/simple-test

# POST
curl -X POST https://erppizzaria.vercel.app/api/simple-test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 2. `/api/test-login` - Rota Intermediária
```bash
# GET
curl https://erppizzaria.vercel.app/api/test-login

# POST
curl -X POST https://erppizzaria.vercel.app/api/test-login \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 3. `/api/login-test` - Rota com Lógica de Login
```bash
# POST com credenciais válidas
curl -X POST https://erppizzaria.vercel.app/api/login-test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@williamdiskpizza.com",
    "password": "admin123"
  }'
```

### 4. `/api/auth/login` - Rota Original (Simplificada)
```bash
# GET para teste
curl https://erppizzaria.vercel.app/api/auth/login

# POST
curl -X POST https://erppizzaria.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@williamdiskpizza.com",
    "password": "admin123"
  }'
```

## 🎯 Como Testar via Interface

1. **Acesse:** `https://erppizzaria.vercel.app/admin/login`
2. **Preencha:**
   - Email: `admin@williamdiskpizza.com`
   - Senha: `admin123`
3. **Tente:**
   - Botão **"Entrar"** (rota original)
   - Botão **"🧪 Testar Rota Alternativa"** (rota `/api/login-test`)
4. **Verifique** os logs no console do navegador (F12)

## 📊 Resultados Esperados

Se as rotas simples funcionarem, o problema está na lógica específica.
Se nenhuma funcionar, o problema é estrutural/configuração da Vercel.

## 🔍 Logs de Debug

Todos os endpoints agora geram logs detalhados:
- 🚀 Início da requisição
- 📥 Dados recebidos
- ✅ Sucesso ou ❌ Erro
- 📡 Status da resposta

## 🛠️ Próximos Passos

1. **Teste as rotas simples** primeiro
2. **Compare os logs** entre rotas que funcionam vs que não funcionam
3. **Identifique o padrão** do que está causando o 405
4. **Implemente a correção** baseada nos resultados

## 📱 Credenciais de Teste

- **Email:** `admin@williamdiskpizza.com`
- **Senha:** `admin123`
- **Role:** `admin`

---

**🎯 Objetivo:** Identificar exatamente onde e por que o erro 405 está ocorrendo. 