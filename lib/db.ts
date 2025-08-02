// Importar PostgreSQL nativo ao invés do Supabase
import { query as pgQuery, getClient as pgGetClient } from './postgres';

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' || isDevelopment;
const enableSlowQueryLogs = process.env.ENABLE_SLOW_QUERY_LOGS === 'true';
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000');

// Função principal para executar queries usando PostgreSQL nativo
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  
  try {
    if (enableQueryLogs) {
      console.log('🔍 Executing PostgreSQL query:', text.substring(0, 100));
      console.log('📝 With params:', params);
    }
    
    // Executar query diretamente no PostgreSQL
    const result = await pgQuery(text, params);
    
    const duration = Date.now() - start;
    
    if (enableSlowQueryLogs && duration > slowQueryThreshold) {
      console.warn('⚠️ Query lenta detectada:', { text: text.substring(0, 100), duration });
    }
    
    if (enableQueryLogs) {
      console.log('✅ Query executada com sucesso:', { 
        duration: `${duration}ms`, 
        rows: result.rowCount || 0 
      });
    }
    
    return result;
    
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error('❌ Database query error', { 
      text: text.substring(0, 100), 
      error: error.message,
      code: error.code,
      hint: error.hint,
      detail: error.detail,
      params: params ? JSON.stringify(params).substring(0, 100) : undefined,
      duration: `${duration}ms`
    });
    throw error;
  }
}

// Função para obter cliente (compatibilidade)
export async function getClient() {
  return await pgGetClient();
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

// Função para testar conexão
export async function testConnection() {
  try {
    const result = await pgQuery('SELECT COUNT(*) as count FROM profiles LIMIT 1');
    
    return { 
      success: true, 
      message: 'Conexão com PostgreSQL funcionando',
      count: result.rows[0]?.count || 0
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Erro na conexão com PostgreSQL', 
      error: error.message 
    };
  }
} 