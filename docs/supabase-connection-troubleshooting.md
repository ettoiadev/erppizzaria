# Guia de Solução de Problemas de Conexão com Supabase

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Verificação de Variáveis de Ambiente](#verificação-de-variáveis-de-ambiente)
3. [Teste de Conexão](#teste-de-conexão)
4. [Problemas Comuns e Soluções](#problemas-comuns-e-soluções)
5. [Ferramentas de Diagnóstico](#ferramentas-de-diagnóstico)

## Pré-requisitos

Antes de começar a solucionar problemas de conexão com o Supabase, certifique-se de que você tem:

- Node.js instalado (versão 18 ou superior)
- Supabase CLI instalado (para desenvolvimento local)
- Arquivo `.env.local` configurado com as variáveis de ambiente necessárias

## Verificação de Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias para a conexão com o Supabase:

```env
# Variáveis oficiais (preferidas)
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=sua-chave-aqui

# Variáveis alternativas (legado/fallback)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

### Como verificar

1. Abra o arquivo `.env.local` na raiz do projeto
2. Verifique se as variáveis `SUPABASE_URL` e `SUPABASE_KEY` estão definidas
3. Se estiver usando o Supabase local, as URLs e chaves padrão são:
   - URL: `http://localhost:54321`
   - Chave anônima: Disponível após executar `supabase start`

## Teste de Conexão

Para testar a conexão com o Supabase, você pode usar os scripts de diagnóstico incluídos no projeto:

### Usando o script de teste

```bash
# Usando o script batch (Windows)
scripts\run-supabase-test.bat

# Ou diretamente com Node.js
node scripts/test-supabase-connection.js

# Ou com TypeScript
npx ts-node scripts/test-supabase-connection.ts
```

### Usando a API de teste

Você também pode testar a conexão através da API de teste:

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Acesse: `http://localhost:3000/api/test-db-connection`

## Problemas Comuns e Soluções

### 1. Variáveis de ambiente não configuradas

**Problema**: As variáveis `SUPABASE_URL` e `SUPABASE_KEY` não estão definidas no arquivo `.env.local`.

**Solução**: 
- Crie ou edite o arquivo `.env.local` na raiz do projeto
- Adicione as variáveis necessárias conforme mostrado acima

### 2. Supabase local não está em execução

**Problema**: O servidor Supabase local não está em execução.

**Solução**:
```bash
# Iniciar o Supabase local
supabase start

# Verificar o status
supabase status
```

### 3. Erro de conexão recusada

**Problema**: A conexão com o Supabase é recusada.

**Solução**:
- Verifique se o Supabase está em execução
- Verifique se a URL está correta
- Verifique se não há firewall bloqueando a conexão

### 4. Erro de autenticação

**Problema**: A chave do Supabase é inválida ou expirou.

**Solução**:
- Para Supabase local: reinicie o servidor com `supabase restart`
- Para Supabase em nuvem: gere uma nova chave no painel do Supabase

### 5. Tabelas não encontradas

**Problema**: As tabelas necessárias não existem no banco de dados.

**Solução**:
- Execute as migrações: `supabase migration up`
- Ou restaure o banco de dados a partir de um backup

## Ferramentas de Diagnóstico

### Scripts de Diagnóstico

O projeto inclui os seguintes scripts para ajudar no diagnóstico de problemas:

1. **test-supabase-connection.js/.ts**: Testa a conexão com o Supabase e verifica as tabelas principais
2. **fix-supabase-connection.js**: Verifica e tenta corrigir problemas comuns de configuração
3. **run-supabase-test.bat**: Script para Windows que executa o teste de conexão

### APIs de Diagnóstico

O projeto também inclui as seguintes APIs para diagnóstico:

1. **/api/test-db-connection**: Testa a conexão básica com o Supabase
2. **/api/test-connection**: Teste mais completo que verifica tabelas e estruturas
3. **/api/audit-test**: Executa uma auditoria completa da conexão e estrutura do banco de dados

### Logs

Para habilitar logs detalhados de consultas ao banco de dados, configure as seguintes variáveis no `.env.local`:

```env
ENABLE_QUERY_LOGS=true
ENABLE_SLOW_QUERY_LOGS=true
SLOW_QUERY_THRESHOLD=1000
```

Isso ajudará a identificar problemas específicos com consultas ao banco de dados.