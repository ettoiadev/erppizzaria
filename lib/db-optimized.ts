import { Pool } from 'pg';

// Configuração básica do PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' || isDevelopment;
const enableSlowQueryLogs = process.env.ENABLE_SLOW_QUERY_LOGS !== 'false'; // habilitado por padrão
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'); // 1 segundo

// Função para executar queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log baseado em configuração e performance
    if (enableQueryLogs) {
      // Log normal em desenvolvimento - apenas queries > 200ms
      if (duration > 200) {
        console.log('🐌 Query (slow)', { 
          text: text.substring(0, 60) + '...', 
          duration: `${duration}ms`, 
          rows: res.rowCount 
        });
      }
    }
    
    // Log de queries muito lentas (sempre, mesmo em produção)
    if (enableSlowQueryLogs && duration > slowQueryThreshold) {
      console.warn('🚨 Slow query detected', { 
        text: text.substring(0, 100),
        duration: `${duration}ms`, 
        rows: res.rowCount,
        params: params ? JSON.stringify(params).substring(0, 100) : undefined
      });
    }
    
    return res;
  } catch (error) {
    // Sempre logar erros
    console.error('❌ Database query error', { 
      text: text.substring(0, 100), 
      error: error.message,
      params: params ? JSON.stringify(params).substring(0, 100) : undefined
    });
    throw error;
  }
}

// Função para obter uma conexão do pool
export async function getClient() {
  const client = await pool.connect();
  const queryFn = client.query.bind(client);
  const release = client.release.bind(client);

  // Sobrescreve o método de release apenas se logs estiverem habilitados
  client.release = () => {
    if (enableQueryLogs) {
      console.log('🔌 Cliente retornado ao pool');
    }
    release();
  };

  return { client, query: queryFn, release };
}

// Função para logs de debug específicos (apenas quando necessário)
export function debugQuery(text: string, params?: any[]) {
  if (enableQueryLogs) {
    console.log('🔍 Debug query', { 
      text: text.substring(0, 100),
      params: params ? JSON.stringify(params) : undefined
    });
  }
}

// Exporta o pool para uso direto se necessário
export { pool }; 