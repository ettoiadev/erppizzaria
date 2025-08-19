# Como Obter a Chave Service Role do Supabase

A chave `SUPABASE_SERVICE_ROLE_KEY` atual no arquivo `.env.local` é um placeholder e precisa ser substituída pela chave real do seu projeto.

## Passos para obter a chave correta:

### 1. Acesse o Dashboard do Supabase
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta

### 2. Selecione seu projeto
- Clique no projeto: **zrkxsetbsyecbatqbojr**
- URL do projeto: https://zrkxsetbsyecbatqbojr.supabase.co

### 3. Navegue para as configurações de API
- No menu lateral, clique em **"Settings"** (Configurações)
- Clique em **"API"**
- Ou acesse diretamente: https://supabase.com/dashboard/project/zrkxsetbsyecbatqbojr/settings/api

### 4. Localize a chave service_role
- Na seção **"Project API keys"**
- Procure pela chave **"service_role"**
- Clique no ícone de "olho" para revelar a chave
- A chave começará com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. Substitua no arquivo .env.local
- Copie a chave service_role completa
- Substitua o valor atual de `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.local`
- Também atualize o arquivo `.env` se necessário

## ⚠️ IMPORTANTE:
- **NUNCA** compartilhe esta chave publicamente
- **NUNCA** comite esta chave no Git
- Esta chave tem acesso total ao seu banco de dados
- Use apenas em componentes backend seguros

## Verificação:
Após atualizar a chave, execute:
```bash
node test-login-fix.js
```

Se tudo estiver correto, você verá:
- ✅ Variáveis de ambiente configuradas
- ✅ Conexão com Supabase funcionando
- ✅ Busca de usuário funcionando (mesmo que retorne "não encontrado")