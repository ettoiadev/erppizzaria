// Importar PostgreSQL nativo
import { query as dbQuery } from './database';
import { appLogger } from './logging';

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' || isDevelopment;
const enableSlowQueryLogs = process.env.ENABLE_SLOW_QUERY_LOGS === 'true';
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000');

// Função para executar queries usando PostgreSQL
export async function query(sql: string, params?: any[]) {
  const start = Date.now();
  
  try {
    if (enableQueryLogs) {
      appLogger.info('general', 'Executing query', {
        query: sql.substring(0, 100),
        params: params ? JSON.stringify(params) : undefined
      });
    }
    
    const result = await dbQuery(sql, params);
    
    const duration = Date.now() - start;
    
    if (enableSlowQueryLogs && duration > slowQueryThreshold) {
      appLogger.warn('general', 'Slow query detected', {
        query: sql.substring(0, 100),
        duration,
        isSlowQuery: true
      });
    }
    
    if (enableQueryLogs) {
      appLogger.info('general', 'Query executed successfully', {
        duration,
        resultCount: Array.isArray(result) ? result.length : 1
      });
    }
    
    return result;
    
  } catch (error: any) {
    const duration = Date.now() - start;
    appLogger.error('general', 'Database query error', error, {
      query: sql.substring(0, 100),
      duration,
      errorCode: error.code
    });
    throw error;
  }
}

// Função para obter cliente (compatibilidade)
export async function getClient() {
  // Retorna um objeto simples para compatibilidade
  return {
    query: dbQuery
  };
}

// Função para logs de debug
export function debugQuery(text: string, params?: any[]) {
  if (enableQueryLogs) {
    appLogger.debug('general', 'Debug query', {
      query: text.substring(0, 100),
      params: params ? JSON.stringify(params) : undefined
    });
  }
}

// Função para testar conexão
export async function testConnection() {
  try {
    const result = await dbQuery('SELECT 1 as test');
    
    return { 
      success: true, 
      message: 'Conexão com PostgreSQL funcionando',
      result
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Erro na conexão com PostgreSQL', 
      error: error.message 
    };
  }
}