import { Pool, PoolClient } from 'pg'

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de 20 conexões no pool
  idleTimeoutMillis: 30000, // timeout de 30 segundos para conexões inativas
  connectionTimeoutMillis: 2000, // timeout de 2 segundos para estabelecer conexão
})

// Event listeners para debugging
pool.on('connect', () => {
  console.log('✅ Nova conexão estabelecida com PostgreSQL')
})

pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexões PostgreSQL:', err)
  process.exit(-1)
})

// Função para executar queries
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.ENABLE_QUERY_LOGS === 'true') {
      console.log('📊 Query executada:', { text, duration, rows: result.rowCount })
    }
    
    if (process.env.ENABLE_SLOW_QUERY_LOGS === 'true' && duration > parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000')) {
      console.warn('⚠️ Query lenta detectada:', { text, duration })
    }
    
    return result
  } catch (error: any) {
    console.error('❌ Erro na query:', { text, params, error: error.message })
    throw error
  }
}

// Função para obter um cliente do pool (para transações)
export async function getClient(): Promise<PoolClient> {
  return await pool.connect()
}

// Função para executar transações
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Função para testar a conexão
export async function testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version')
    return {
      success: true,
      message: `Conexão PostgreSQL funcionando. Versão: ${result.rows[0].version}`
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro na conexão com PostgreSQL',
      error: error.message
    }
  }
}

// Função para encerrar o pool (usado no shutdown da aplicação)
export async function closePool(): Promise<void> {
  await pool.end()
  console.log('🔌 Pool de conexões PostgreSQL encerrado')
}

export default pool