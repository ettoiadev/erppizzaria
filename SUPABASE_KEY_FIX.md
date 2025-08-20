# Correção do Erro 401 - Chave Supabase Inválida

## Problema Identificado
O erro 401 (Unauthorized) na API de login é causado por uma chave `SUPABASE_SERVICE_ROLE_KEY` inválida no arquivo `.env`.

## Solução

### 1. Obter a Chave Service Role Correta

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto: **zrkxsetbsyecbatqbojr**
3. Vá para **Settings** → **API**
4. Na seção "Project API keys", localize a chave **service_role**
5. Clique em "Reveal" para mostrar a chave completa
6. Copie a chave service_role

### 2. Atualizar o Arquivo .env

Substitua a linha no arquivo `.env`:

```env
# ANTES (chave inválida)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3hzZXRic3llY2JhdHFib2pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY5NDAyNSwiZXhwIjoyMDcwMjcwMDI1fQ.YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE

# DEPOIS (chave real do dashboard)
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_real_aqui
```

### 3. Reiniciar o Servidor

Após atualizar o `.env`:

```bash
# Parar o servidor atual (Ctrl+C)
# Reiniciar
npm run dev
```

### 4. Testar a Correção

Teste o login com:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@williamdiskpizza.com","password":"123456"}'
```

## Usuários Disponíveis para Teste

- **admin@williamdiskpizza.com** (role: admin)
- **admin@pizzaria.com** (role: admin)  
- **ettobr@gmail.com** (role: admin)

## Verificação de Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite o arquivo `.env` com chaves reais
- A chave service_role tem privilégios administrativos completos
- Use apenas em ambiente servidor (backend), nunca no frontend

## Status das Configurações

✅ **Corretas**:
- SUPABASE_URL: `https://zrkxsetbsyecbatqbojr.supabase.co`
- SUPABASE_KEY (anon): Configurada corretamente
- JWT_SECRET: Configurado
- Banco de dados: Conectado e funcionando

❌ **Pendente**:
- SUPABASE_SERVICE_ROLE_KEY: Precisa ser atualizada com a chave real

---

**Após seguir estes passos, o erro 401 será resolvido e o sistema de autenticação funcionará corretamente.**