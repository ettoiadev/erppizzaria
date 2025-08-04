import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST_DB_CONNECTION] Testando conexão com banco de dados...')

    // Verificar se DATABASE_URL está configurada
    const databaseUrl = process.env.DATABASE_URL
    console.log('[TEST_DB_CONNECTION] DATABASE_URL configurada:', !!databaseUrl)

    if (!databaseUrl) {
      return NextResponse.json({ 
        error: 'DATABASE_URL não configurada',
        message: 'A variável de ambiente DATABASE_URL não foi encontrada'
      }, { status: 500 })
    }

    // Teste 1: Conexão básica
    console.log('[TEST_DB_CONNECTION] Testando conexão básica...')
    const connectionTest = await query('SELECT NOW() as current_time, version() as version')
    
    console.log('[TEST_DB_CONNECTION] Conexão estabelecida:', connectionTest.rows[0])

    // Teste 2: Verificar tabelas existentes
    console.log('[TEST_DB_CONNECTION] Verificando tabelas existentes...')
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    const tables = tablesResult.rows.map(row => row.table_name)
    console.log('[TEST_DB_CONNECTION] Tabelas encontradas:', tables)

    // Teste 3: Verificar se a tabela profiles existe
    const profilesExists = tables.includes('profiles')
    console.log('[TEST_DB_CONNECTION] Tabela profiles existe:', profilesExists)

    // Teste 4: Se profiles existe, verificar estrutura
    let profilesStructure = null
    if (profilesExists) {
      console.log('[TEST_DB_CONNECTION] Verificando estrutura da tabela profiles...')
      const structureResult = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'profiles'
        ORDER BY ordinal_position
      `)
      profilesStructure = structureResult.rows
      console.log('[TEST_DB_CONNECTION] Estrutura da tabela profiles:', profilesStructure)
    }

    // Teste 5: Se profiles existe, contar registros
    let profilesCount = null
    if (profilesExists) {
      console.log('[TEST_DB_CONNECTION] Contando registros na tabela profiles...')
      const countResult = await query('SELECT COUNT(*) as count FROM profiles')
      profilesCount = parseInt(countResult.rows[0].count)
      console.log('[TEST_DB_CONNECTION] Total de registros em profiles:', profilesCount)
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão com banco de dados funcionando',
      database: {
        connected: true,
        version: connectionTest.rows[0].version,
        currentTime: connectionTest.rows[0].current_time
      },
      tables: {
        total: tables.length,
        list: tables,
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