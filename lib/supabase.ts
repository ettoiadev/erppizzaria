import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ewoihxpitbbypqylhdkm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2loeHBpdGJieXBxeWxoZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDM1OTQsImV4cCI6MjA2NzA3OTU5NH0.1Fpv-oQogUez8ySm-W3nRiEt0g7KsncMBDVIWEqiAwQ'

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função de conveniência para obter configurações
export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey
}) 