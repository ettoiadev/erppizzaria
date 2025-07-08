import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Please set NEXT_PUBLIC_SUPABASE_URL in your .env file")
}

if (!supabaseAnonKey) {
  throw new Error("Supabase anon key not found. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file")
}

// Cliente principal com refresh automático de token habilitado
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Função para criar cliente admin (apenas no servidor)
export const getSupabaseAdmin = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceRoleKey) {
    throw new Error("Supabase service role key not found. Please set SUPABASE_SERVICE_ROLE_KEY in your .env file")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey
}) 