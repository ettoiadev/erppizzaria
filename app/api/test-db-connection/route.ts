import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST_DB_CONNECTION] Testando conexão com banco de dados...')

    const hasSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY
    console.log('[TEST_DB_CONNECTION] SUPABASE_URL/KEY configurados:', hasSupabase)

    if (!hasSupabase) {
      return NextResponse.json({ 
        error: 'Supabase não configurado',
        message: 'As variáveis SUPABASE_URL e SUPABASE_KEY não foram encontradas'
      }, { status: 500 })
    }

    console.log('[TEST_DB_CONNECTION] Testando conexão básica (Supabase)...')
    const supabase = getSupabaseServerClient()
    // Teste simples: contar perfis
    const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    if (error) throw error

    const profilesExists = true
    const profilesStructure = null
    const profilesCount = count ?? null

    return NextResponse.json({
      success: true,
      message: 'Conexão com banco de dados funcionando',
      database: { connected: true },
      tables: {
        total: null,
        list: null,
        profilesExists,
        profilesStructure,
        profilesCount
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