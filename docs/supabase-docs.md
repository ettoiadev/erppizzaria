# Documentação Supabase

## Índice

- [Banco de Dados](#banco-de-dados)
  - [Postgres e Extensões](#postgres-e-extensões)
  - [Row Level Security (RLS)](#row-level-security-rls)
  - [Funções RPC](#funções-rpc)
- [Autenticação](#autenticação)
  - [Integração com Next.js](#integração-com-nextjs)
- [Storage](#storage)
  - [Integração com Next.js](#integração-com-nextjs-1)
- [Edge Functions](#edge-functions)
- [Webhooks](#webhooks)
- [Realtime](#realtime)
- [CLI e Desenvolvimento Local](#cli-e-desenvolvimento-local)
  - [Migrações de Banco de Dados](#migrações-de-banco-de-dados)

## Banco de Dados

### Postgres e Extensões

O Supabase é baseado em PostgreSQL e oferece várias extensões poderosas:

#### pgvector

- Extensão para busca de similaridade de vetores e armazenamento de embeddings
- Útil para IA e machine learning
- Adiciona o tipo de dado `vector`
- Permite consultas de similaridade
- Pode ser ativado via painel do Supabase ou comandos SQL

```sql
-- Ativar a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar uma tabela com campo de vetor
CREATE TABLE documents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content text,
  embedding vector(384)
);

-- Consulta de similaridade
SELECT content, embedding <-> '[0.1, 0.2, ...]'::vector AS distance
FROM documents
ORDER BY distance
LIMIT 5;
```

#### PostGIS

- Extensão para trabalhar com dados geoespaciais
- Oferece tipos especiais (Point, Polygon, LineString)
- Funções para consultas geográficas eficientes
- Permite ordenar por distância (`<->` operador)
- Encontrar dados dentro de limites geográficos (`&&` operador)

```sql
-- Ativar a extensão PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Criar uma tabela com campo geográfico
CREATE TABLE places (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text,
  location geography(POINT)
);

-- Inserir um ponto
INSERT INTO places (name, location)
VALUES ('Restaurante', ST_MakePoint(-46.633308, -23.550520)::geography);

-- Consulta por distância
SELECT name, ST_Distance(location, ST_MakePoint(-46.633308, -23.550520)::geography) as distance
FROM places
ORDER BY location <-> ST_MakePoint(-46.633308, -23.550520)::geography
LIMIT 5;
```

#### Outras extensões

- **pgcrypto**: Funções criptográficas
- **pg_net**: Requisições HTTP do banco de dados

### Row Level Security (RLS)

O RLS do Supabase permite controle granular de acesso a linhas de dados através de políticas SQL, integrando-se com o Supabase Auth para segurança de ponta a ponta.

- As políticas atuam como cláusulas `WHERE` implícitas
- Podem ser definidas para operações `SELECT`, `INSERT`, `UPDATE` e `DELETE`
- Utilizam funções auxiliares como `auth.uid()`

```sql
-- Criar tabela com RLS ativado
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  private_data TEXT
);

-- Ativar RLS na tabela
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir usuários verem apenas seus próprios dados
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para permitir usuários atualizarem apenas seus próprios dados
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

### Funções RPC

O Supabase permite chamar funções Postgres como RPCs a partir de bibliotecas cliente (JavaScript, Python, Swift).

- Residem no banco de dados
- Encapsulam operações complexas
- Otimizam performance
- Garantem adesão a políticas de segurança

```sql
-- Criar uma função RPC
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile JSONB;
BEGIN
  SELECT json_build_object(
    'id', id,
    'name', name,
    'email', email
  ) INTO profile
  FROM profiles
  WHERE id = user_id;
  
  RETURN profile;
END;
$$;
```

Chamada do cliente:

```javascript
const { data, error } = await supabase
  .rpc('get_user_profile', { user_id: '123e4567-e89b-12d3-a456-426614174000' })
```

## Autenticação

O sistema de autenticação do Supabase utiliza JWTs para autenticação e se integra com o Row Level Security (RLS) do Postgres para autorização. Suporta diversos métodos:

- Senha
- Magic link
- OTP (One-Time Password)
- Social login (Google, GitHub, etc.)
- SSO (Single Sign-On)

Os JWTs contêm informações de identidade e autorização, sendo verificados por cada produto Supabase. As sessões de usuário são representadas por um JWT de acesso de curta duração e um refresh token.

### Integração com Next.js

A configuração da autenticação server-side no Next.js com Supabase requer:

1. Instalação dos pacotes `@supabase/supabase-js` e `@supabase/ssr`
2. Configuração de variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_KEY`) - apenas server-side
3. Criação de clientes Supabase separados para Client Components e Server Components
4. Implementação de middleware para refrescar tokens de autenticação

**⚠️ Importante**: Este projeto usa variáveis de ambiente server-side apenas (`SUPABASE_URL`, `SUPABASE_KEY`) para maior segurança, ao invés das variáveis públicas (`NEXT_PUBLIC_SUPABASE_*`).

**Exemplo de configuração atual:**

```typescript
// lib/supabase.ts - Cliente unificado (server-side)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**Configuração legada (NÃO usar):**

```typescript
// ❌ NÃO usar - expõe credenciais no cliente
export const createClient = (cookies: () => RequestCookies) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // ❌ Público
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ❌ Público
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies().set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookies().set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}
```

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  await supabase.auth.getSession()

  return response
}
```

## Storage

O Supabase Storage permite armazenar e servir arquivos de qualquer tamanho, com:

- Controle de acesso robusto via políticas RLS
- Otimizador de imagem integrado
- CDN global

Organiza arquivos em "buckets" (públicos ou privados) e "pastas", com controle de acesso via políticas de RLS na tabela `storage.objects`.

```sql
-- Política para permitir acesso público a um bucket
CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'public');

-- Política para permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Política para permitir usuários gerenciarem apenas seus próprios arquivos
CREATE POLICY "Users can manage their own files"
  ON storage.objects
  USING (auth.uid() = owner);
```

### Integração com Next.js

A integração com Next.js envolve:

1. Criação de um projeto Supabase
2. Configuração de buckets de armazenamento
3. Instalação da biblioteca `@supabase/supabase-js`
4. Configuração de variáveis de ambiente
5. Utilização do cliente Supabase para upload de arquivos

```typescript
// Exemplo de upload de arquivo
import { createClient } from '@/lib/supabase-client'

export default function UploadForm() {
  const supabase = createClient()
  
  const handleUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .upload(`public/${Date.now()}_${file.name}`, file)
      
    if (error) {
      console.error('Erro no upload:', error)
    } else {
      console.log('Upload realizado com sucesso:', data)
    }
  }
  
  return (
    <input type="file" onChange={handleUpload} />
  )
}
```

## Edge Functions

Edge Functions são funções TypeScript server-side, desenvolvidas com Deno, distribuídas globalmente para baixa latência e alta performance.

Características principais:

- Desenvolvidas usando Deno (runtime JavaScript/TypeScript open source)
- Experiência de desenvolvimento local com hot code reloading
- Paridade dev/prod
- Suporte a módulos NPM
- Escalabilidade automática
- Conexão ao banco de dados Postgres via `supabase-js` client

Casos de uso:

- Webhooks
- Integração com serviços de terceiros (Stripe, OpenAI, etc.)
- Processamento de dados em tempo real
- Fluxos de autenticação e autorização personalizados
- Construção de bots para plataformas como Discord e Telegram

**Exemplo de Edge Function:**

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    // Processar webhook do Stripe
    const payload = await req.json()
    
    // Atualizar banco de dados
    const { error } = await supabaseClient
      .from('payments')
      .insert({
        payment_id: payload.id,
        status: payload.status,
        amount: payload.amount,
        customer_id: payload.customer
      })
      
    if (error) throw error
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

**Implantação:**

```bash
# Criar uma nova função
supabase functions new stripe-webhook

# Executar localmente
supabase functions serve stripe-webhook

# Implantar
supabase functions deploy stripe-webhook
```

## Webhooks

Os Supabase Database Webhooks permitem enviar dados em tempo real do banco de dados para outros sistemas em resposta a eventos de tabela (INSERT, UPDATE, DELETE).

- Funcionam como um wrapper em torno de triggers do Postgres
- Usam a extensão `pg_net` para processamento assíncrono
- Podem ser configurados via Dashboard ou SQL
- O payload é gerado automaticamente a partir do registro da tabela

```sql
-- Criar um webhook que envia dados para um endpoint externo quando um novo pedido é criado
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://meu-servidor.com/webhook/novos-pedidos',
      headers := '{"Content-Type": "application/json"}',
      body := json_build_object(
        'id', NEW.id,
        'customer_id', NEW.customer_id,
        'total', NEW.total,
        'created_at', NEW.created_at
      )::text
    );
  RETURN NEW;
END;
$$;

-- Criar o trigger que chama a função quando um novo registro é inserido
CREATE TRIGGER on_new_order
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_new_order();
```

## Realtime

O Supabase Realtime permite enviar mensagens efêmeras, rastrear e sincronizar estados compartilhados, e escutar mudanças no Postgres via WebSockets.

Oferece três funcionalidades principais:

1. **Broadcast**: Mensagens de baixa latência
2. **Presence**: Sincronização de estado entre clientes
3. **Postgres Changes**: Escuta de mudanças no banco de dados

```javascript
// Configurar cliente Supabase (server-side)
import { supabase } from '../lib/supabase'

// OU para uso em API Routes:
// const supabaseUrl = process.env.SUPABASE_URL
// const supabaseKey = process.env.SUPABASE_KEY
// const supabase = createClient(supabaseUrl, supabaseKey)

// Escutar mudanças em uma tabela
const channel = supabase
  .channel('table-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',  // ou 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'orders',
    },
    (payload) => {
      console.log('Mudança recebida!', payload)
      // Atualizar UI com os novos dados
    }
  )
  .subscribe()

// Broadcast de mensagens
const chatChannel = supabase
  .channel('chat-room')
  .on('broadcast', { event: 'message' }, (payload) => {
    console.log('Nova mensagem recebida:', payload)
  })
  .subscribe()

// Enviar mensagem
await chatChannel.send({
  type: 'broadcast',
  event: 'message',
  payload: { text: 'Olá, mundo!' }
})

// Presence (status online)
const presenceChannel = supabase
  .channel('online-users')
  .on('presence', { event: 'sync' }, () => {
    const newState = presenceChannel.presenceState()
    console.log('Status online atualizado:', newState)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('Usuários entraram:', newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('Usuários saíram:', leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({ user_id: 'user_123', status: 'online' })
    }
  })
```

## CLI e Desenvolvimento Local

O Supabase CLI permite o desenvolvimento local completo do stack Supabase usando contêineres Docker.

Para iniciar:

1. Instalar o CLI: `npm install supabase --save-dev`
2. Inicializar um projeto: `npx supabase init`
3. Iniciar os serviços: `npx supabase start`

Recursos principais:

- Servidor SMTP local
- Ferramenta de diff de banco de dados
- Migrações de esquema (manuais ou automáticas via `supabase db diff`)
- Gerenciamento de ambientes com GitHub Actions
- Ferramentas para depuração, backup e teste
- Geração de tipos TypeScript

```bash
# Instalar o CLI
npm install supabase --save-dev

# Inicializar um projeto
npx supabase init

# Iniciar os serviços
npx supabase start

# Parar os serviços
npx supabase stop

# Gerar tipos TypeScript
npx supabase gen types typescript --local > types/supabase.ts
```

### Migrações de Banco de Dados

O Supabase CLI facilita o gerenciamento de migrações de banco de dados:

```bash
# Criar uma nova migração
npx supabase migration new nome_da_migracao

# Aplicar migrações
npx supabase migration up

# Resetar o banco de dados e aplicar todas as migrações
npx supabase db reset

# Gerar diff de esquema
npx supabase db diff -f nome_do_arquivo

# Implantar migrações
npx supabase db push
```

Exemplo de fluxo de trabalho:

1. Criar uma migração para uma nova tabela:

```bash
npx supabase migration new create_products_table
```

2. Editar o arquivo de migração gerado em `supabase/migrations/<timestamp>_create_products_table.sql`:

```sql
create table if not exists products (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  price decimal(10, 2) not null,
  created_at timestamptz default now()
);
```

3. Aplicar a migração:

```bash
npx supabase db reset
```

4. Criar dados de seed em `supabase/seed.sql`:

```sql
insert into products (name, description, price)
values
  ('Pizza Margherita', 'Molho de tomate, mussarela e manjericão', 45.90),
  ('Pizza Pepperoni', 'Molho de tomate, mussarela e pepperoni', 55.90),
  ('Pizza Quatro Queijos', 'Molho de tomate, mussarela, provolone, gorgonzola e parmesão', 59.90);
```

5. Implantar para produção:

```bash
npx supabase login
npx supabase link --project-ref <project-id>
npx supabase db push
```