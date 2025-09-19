# Migração Frontend: Supabase para PostgreSQL Self-Hosted

## 1. Visão Geral do Projeto

O projeto **ERP Pizzaria** atualmente utiliza uma arquitetura híbrida onde o frontend consome dados principalmente através de API routes Next.js, mas ainda mantém algumas integrações diretas com Supabase. A migração visa eliminar completamente a dependência do Supabase no frontend, mantendo toda funcionalidade, UI/UX e fluxos existentes.

## 2. Análise da Arquitetura Atual

### 2.1 Estrutura Identificada
- **Frontend**: React/Next.js com TypeScript
- **Backend**: API Routes Next.js + Supabase
- **Database**: PostgreSQL via Supabase
- **Realtime**: Supabase Realtime para atualizações em tempo real
- **Autenticação**: Sistema híbrido (API routes + Supabase Auth)

### 2.2 Pontos de Integração Supabase no Frontend

Após análise detalhada, foram identificados os seguintes arquivos que precisam de migração:

| Arquivo | Tipo de Uso | Prioridade |
|---------|-------------|------------|
| `lib/supabase.ts` | Cliente Supabase | Alta |
| `lib/db-supabase.ts` | Queries diretas | Alta |
| `use-orders-data-optimized.ts` | Realtime subscriptions | Alta |
| `lib/notifications.ts` | Realtime notifications | Média |
| API Routes (backend) | Server-side Supabase | Alta |

## 3. Estratégia de Migração

### 3.1 Princípios da Migração
- ✅ Manter 100% da funcionalidade existente
- ✅ Preservar UI/UX e fluxos de usuário
- ✅ Migração incremental e testável
- ✅ Zero downtime durante a transição
- ✅ Compatibilidade com PostgreSQL existente no Docker

### 3.2 Fases da Migração

#### Fase 1: Preparação da Infraestrutura
- Configurar conexão direta com PostgreSQL
- Implementar pool de conexões
- Configurar variáveis de ambiente

#### Fase 2: Migração das API Routes
- Substituir Supabase client por conexão PostgreSQL direta
- Manter mesmas interfaces de API
- Implementar queries SQL equivalentes

#### Fase 3: Substituição do Realtime
- Implementar WebSockets ou Server-Sent Events
- Migrar notificações em tempo real
- Manter mesma experiência de usuário

#### Fase 4: Limpeza e Otimização
- Remover dependências Supabase
- Otimizar queries PostgreSQL
- Testes finais

## 4. Implementação Detalhada

### 4.1 Configuração PostgreSQL

**Arquivo: `lib/postgresql.ts`** (Novo)
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'erppizzaria',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export { pool };

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
```

### 4.2 Migração do `lib/supabase.ts`

**Antes (Supabase):**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Depois (PostgreSQL via API):**
```typescript
// lib/api-client.ts
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  async get(endpoint: string, params?: Record<string, any>) {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async post(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async put(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### 4.3 Migração do Realtime

**Arquivo: `lib/realtime-client.ts`** (Novo)
```typescript
type RealtimeCallback = (data: any) => void;

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private callbacks: Map<string, RealtimeCallback[]> = new Map();

  connect() {
    if (this.eventSource) return;

    this.eventSource = new EventSource('/api/realtime/events');
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { channel, payload } = data;
        
        const channelCallbacks = this.callbacks.get(channel) || [];
        channelCallbacks.forEach(callback => callback(payload));
      } catch (error) {
        console.error('Erro ao processar evento realtime:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('Erro na conexão realtime:', error);
      // Reconectar após 5 segundos
      setTimeout(() => {
        this.disconnect();
        this.connect();
      }, 5000);
    };
  }

  subscribe(channel: string, callback: RealtimeCallback) {
    if (!this.callbacks.has(channel)) {
      this.callbacks.set(channel, []);
    }
    this.callbacks.get(channel)!.push(callback);

    // Conectar se ainda não estiver conectado
    if (!this.eventSource) {
      this.connect();
    }

    return () => {
      const callbacks = this.callbacks.get(channel) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const realtimeClient = new RealtimeClient();

// Hook para usar no React
export function useRealtime(channel: string, callback: RealtimeCallback) {
  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe(channel, callback);
    return unsubscribe;
  }, [channel, callback]);
}
```

### 4.4 Migração do `use-orders-data-optimized.ts`

**Antes (com Supabase Realtime):**
```typescript
import { subscribeOrdersRealtime } from '@/lib/realtime';

// No useEffect
useEffect(() => {
  const unsubscribe = subscribeOrdersRealtime(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  });
  return unsubscribe;
}, [queryClient]);
```

**Depois (com Realtime Client):**
```typescript
import { useRealtime } from '@/lib/realtime-client';

// No componente
useRealtime('orders', (data) => {
  queryClient.invalidateQueries({ queryKey: ['orders'] });
});
```

### 4.5 API Route para Realtime

**Arquivo: `pages/api/realtime/events.ts`** (Novo)
```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Configurar Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Manter conexão viva
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);

  // Cleanup na desconexão
  req.on('close', () => {
    clearInterval(keepAlive);
  });

  // Registrar cliente para receber eventos
  // (implementar lógica de registro de clientes)
}
```

## 5. Variáveis de Ambiente

### 5.1 Adicionar ao `.env.local`
```env
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=erppizzaria
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_aqui

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 6. Plano de Execução

### 6.1 Checklist de Migração

#### Preparação
- [ ] Backup completo do banco Supabase
- [ ] Configurar PostgreSQL local
- [ ] Migrar schema do banco
- [ ] Configurar variáveis de ambiente

#### Implementação
- [ ] Criar `lib/postgresql.ts`
- [ ] Criar `lib/api-client.ts`
- [ ] Criar `lib/realtime-client.ts`
- [ ] Migrar API routes para PostgreSQL
- [ ] Atualizar hooks e componentes
- [ ] Implementar realtime com SSE

#### Testes
- [ ] Testar todas as funcionalidades
- [ ] Verificar realtime funcionando
- [ ] Testar performance
- [ ] Validar UI/UX inalterada

#### Finalização
- [ ] Remover dependências Supabase
- [ ] Limpar código não utilizado
- [ ] Documentar mudanças
- [ ] Deploy em produção

## 7. Considerações Importantes

### 7.1 Compatibilidade
- Manter mesmas interfaces de API
- Preservar estrutura de dados
- Garantir mesma performance

### 7.2 Segurança
- Implementar autenticação robusta
- Validar todas as entradas
- Usar prepared statements

### 7.3 Performance
- Implementar connection pooling
- Otimizar queries SQL
- Configurar índices adequados

### 7.4 Monitoramento
- Logs detalhados
- Métricas de performance
- Alertas de erro

Esta migração manterá toda a funcionalidade existente enquanto remove a dependência do Supabase, utilizando o PostgreSQL self-hosted já configurado no Docker.