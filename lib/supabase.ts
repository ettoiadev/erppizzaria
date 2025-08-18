import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { appLogger } from './logging'
import { supabaseLogger, instrumentSupabaseClient } from './supabase-logger'
import { validateAndLogEnvironment } from './environment-validator'

// Em ambientes Node, garantir WebSocket disponível para canais Realtime
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ws = require('ws')
    if (ws && !(globalThis as any).WebSocket) {
      ;(globalThis as any).WebSocket = ws
      appLogger.debug('supabase', 'WebSocket configurado para ambiente Node.js')
    }
  } catch (error) {
    appLogger.warn('supabase', 'Falha ao configurar WebSocket para Node.js', { error: error instanceof Error ? error.message : 'Unknown error' })
  }
}

// Credenciais oficiais: SUPABASE_URL e SUPABASE_KEY
const supabaseUrl = process.env.SUPABASE_URL as string | undefined
const supabaseKey = process.env.SUPABASE_KEY as string | undefined

// Debug para ambiente de produção
if (process.env.NODE_ENV === 'production') {
  appLogger.info('supabase', 'Verificação de variáveis de ambiente em produção', {
    supabaseUrlExists: !!supabaseUrl,
    supabaseKeyExists: !!supabaseKey,
    nodeEnv: process.env.NODE_ENV
  })
} else {
  appLogger.debug('supabase', 'Configuração Supabase carregada', {
    supabaseUrlExists: !!supabaseUrl,
    supabaseKeyExists: !!supabaseKey,
    nodeEnv: process.env.NODE_ENV
  })
}

// Validar configuração de ambiente
const isValidEnvironment = validateAndLogEnvironment()
if (!isValidEnvironment) {
  throw new Error('[Supabase] Configuração de ambiente inválida. Verifique os logs para detalhes.')
}

// Validação específica do Supabase
if (!supabaseUrl) {
  const errorMsg = 'SUPABASE_URL não configurada. Configure as variáveis de ambiente na Vercel ou no arquivo .env.local'
  appLogger.critical('supabase', errorMsg)
  supabaseLogger.logConnection(false, undefined, new Error(`[Supabase] ${errorMsg}`))
  throw new Error(`[Supabase] ${errorMsg}`)
}

if (!supabaseKey) {
  const errorMsg = 'SUPABASE_KEY não configurada. Configure as variáveis de ambiente na Vercel ou no arquivo .env.local'
  appLogger.critical('supabase', errorMsg)
  supabaseLogger.logConnection(false, undefined, new Error(`[Supabase] ${errorMsg}`))
  throw new Error(`[Supabase] ${errorMsg}`)
}

// Cliente único para o servidor. Em rotas API (Node), este é o cliente a ser usado.
const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Cliente administrativo para operações que precisam contornar RLS
// NOTA: Temporariamente usando anon key até obtermos a service_role key
const supabaseAdminClient: SupabaseClient = createClient(
  supabaseUrl, 
  supabaseKey, // Usando anon key temporariamente
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

appLogger.info('supabase', 'Cliente Supabase inicializado com sucesso', {
  url: supabaseUrl?.substring(0, 30) + '...',
  hasKey: !!supabaseKey,
  authConfig: { autoRefreshToken: false, persistSession: false }
})

// Log específico de conexão
supabaseLogger.logConnection(true, supabaseUrl)

// Instrumentar cliente para logging automático
export const supabaseServer: SupabaseClient = instrumentSupabaseClient(supabaseClient)

// Exportar também como 'supabase' para compatibilidade
export const supabase: SupabaseClient = supabaseServer

// Cliente administrativo instrumentado para operações que precisam contornar RLS
export const supabaseAdmin: SupabaseClient = instrumentSupabaseClient(supabaseAdminClient)

export function getSupabaseServerClient(): SupabaseClient {
  appLogger.debug('supabase', 'Cliente Supabase solicitado')
  return supabaseServer
}

export function assertSupabaseConfigured(context: string) {
  // As validações já são feitas na inicialização do módulo
  // Esta função é mantida para compatibilidade
  appLogger.debug('supabase', `Verificação de configuração solicitada`, { context })
  
  if (!supabaseUrl || !supabaseKey) {
    const error = new Error('Supabase is not properly configured')
    supabaseLogger.logConnection(false, undefined, error)
    throw error
  }
  
  return true
}

export async function getUserByEmail(email: string) {
  // Usando RPC function para contornar RLS temporariamente
  const { data, error } = await supabaseAdminClient
    .rpc('get_user_by_email', { user_email: email })

  if (error) {
    console.error('Erro ao buscar usuário por email:', error)
    return null
  }

  // Retorna o primeiro resultado ou null se não encontrar
  return data && data.length > 0 ? data[0] : null
}

export default supabaseServer

