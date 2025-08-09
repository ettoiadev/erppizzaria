import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST_DB_CONNECTION] Testando conexão com banco de dados Supabase...')

    // Verificar se as variáveis de ambiente do Supabase estão configuradas
    const hasSupabaseEnv = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY
    const hasLegacySupabaseEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('[TEST_DB_CONNECTION] Variáveis de ambiente:', {
      'SUPABASE_URL/KEY': hasSupabaseEnv,
      'NEXT_PUBLIC_SUPABASE_URL/ANON_KEY': hasLegacySupabaseEnv
    })

    if (!hasSupabaseEnv && !hasLegacySupabaseEnv) {
      return NextResponse.json({ 
        error: 'Supabase não configurado',
        message: 'As variáveis de ambiente do Supabase não foram encontradas'
      }, { status: 500 })
    }

    console.log('[TEST_DB_CONNECTION] Testando conexão com Supabase...')
    const supabase = getSupabaseServerClient()
    
    // Teste simples: contar perfis
    const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    if (error) throw error

    // Verificar estrutura da tabela profiles
    const { data: profilesStructure, error: structureError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .limit(1)
    
    if (structureError) throw structureError

    return NextResponse.json({
      success: true,
      message: 'Conexão com Supabase funcionando corretamente',
      database: { 
        connected: true,
        type: 'Supabase'
      },
      tables: {
        profiles: {
          exists: true,
          count: count ?? 0,
          structure: profilesStructure && profilesStructure.length > 0 ? Object.keys(profilesStructure[0]) : []
        }
      }
    })

  } catch (error: any) {
    console.error('[TEST_DB_CONNECTION] Erro:', error)
    return NextResponse.json({ 
      error: 'Erro na conexão com banco de dados',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}