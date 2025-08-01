import { Pool, PoolClient } from 'pg';

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões ociosas
  connectionTimeoutMillis: 2000, // tempo limite para novas conexões
});

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' && isDevelopment;
const enableSlowQueryLogs = process.env.ENABLE_SLOW_QUERY_LOGS === 'true';
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000');

// Função principal para executar queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  let client: PoolClient | null = null;
  
  try {
    if (enableQueryLogs) {
      console.log('🔍 Executing query:', text.substring(0, 200));
      console.log('📝 With params:', params);
    }
    
    client = await pool.connect();
    const result = await client.query(text, params);
    
    const duration = Date.now() - start;
    
    if (enableSlowQueryLogs && duration > slowQueryThreshold) {
      console.warn(`⚠️ Slow query detected (${duration}ms):`, text.substring(0, 100));
    }
    
    if (enableQueryLogs) {
      console.log(`✅ Query completed in ${duration}ms, returned ${result.rowCount} rows`);
    }
    
    return result;
    
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error('❌ Database query error', { 
      text: text.substring(0, 100), 
      error: error.message,
      code: error.code,
      params: params ? JSON.stringify(params).substring(0, 100) : undefined,
      duration: `${duration}ms`
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Função para obter cliente do pool
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

// Função para executar transações
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Função para testar conexão
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    return { 
      success: true, 
      message: 'Conexão com PostgreSQL funcionando',
      data: result.rows[0]
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Erro na conexão com PostgreSQL', 
      error: error.message 
    };
  }
}

// Função para logs de debug
export function debugQuery(text: string, params?: any[]) {
  if (enableQueryLogs) {
    console.log('🔍 Debug query', { 
      text: text.substring(0, 100),
      params: params ? JSON.stringify(params) : undefined
    });
  }
}

// Função para fechar pool (útil para testes)
export async function closePool() {
  await pool.end();
}

// Event listeners para monitoramento
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

pool.on('connect', () => {
  if (enableQueryLogs) {
    console.log('🔌 New client connected to PostgreSQL');
  }
});

pool.on('remove', () => {
  if (enableQueryLogs) {
    console.log('🔌 Client removed from PostgreSQL pool');
  }
});

export default pool;