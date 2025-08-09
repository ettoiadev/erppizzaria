import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Em ambientes Node, garantir WebSocket disponível para canais Realtime
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ws = require('ws')
    if (ws && !(globalThis as any).WebSocket) {
      ;(globalThis as any).WebSocket = ws
    }
  } catch {
    // Ignorar se já existir WebSocket global ou módulo indisponível
  }
}

// Credenciais oficiais: SUPABASE_URL e SUPABASE_KEY
const supabaseUrl = process.env.SUPABASE_URL as string | undefined
const supabaseKey = process.env.SUPABASE_KEY as string | undefined

// Validação obrigatória das variáveis de ambiente
if (!supabaseUrl) {
  throw new Error('[Supabase] SUPABASE_URL não configurada. Configure no arquivo .env.local')
}

if (!supabaseKey) {
  throw new Error('[Supabase] SUPABASE_KEY não configurada. Configure no arquivo .env.local')
}

// Cliente único para o servidor. Em rotas API (Node), este é o cliente a ser usado.
export const supabaseServer: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

export function getSupabaseServerClient(): SupabaseClient {
  return supabaseServer
}

export function assertSupabaseConfigured(context: string) {
  // As validações já são feitas na inicialização do módulo
  // Esta função é mantida para compatibilidade
  return true
}

export default supabaseServer

