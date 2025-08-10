// Importar Supabase ao invés do PostgreSQL nativo
import { getSupabaseServerClient } from './supabase';
import { supabaseLogger } from './supabase-logger';
import { appLogger } from './logging';

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' || isDevelopment;
const enableSlowQueryLogs = process.env.ENABLE_SLOW_QUERY_LOGS === 'true';
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000');

// Função para executar queries usando Supabase
export async function query(table: string, action: string, options?: any) {
  const start = Date.now();
  
  try {
    if (enableQueryLogs) {
      supabaseLogger.logQuery(`${action} from ${table}`, { table, action, options });
    }
    
    const supabase = getSupabaseServerClient();
    let query = supabase.from(table);
    
    // Executar a ação apropriada
    let result;
    switch (action) {
      case 'select':
        result = await query.select(options?.columns || '*', options?.options);
        break;
      case 'insert':
        result = await query.insert(options?.data, options?.options);
        break;
      case 'update':
        result = await query.update(options?.data).match(options?.match);
        break;
      case 'delete':
        result = await query.delete().match(options?.match);
        break;
      default:
        throw new Error(`Ação não suportada: ${action}`);
    }
    
    const duration = Date.now() - start;
    
    if (enableSlowQueryLogs && duration > slowQueryThreshold) {
      supabaseLogger.logSlowQuery(`${action} from ${table}`, duration, { table, action });
    }
    
    if (enableQueryLogs) {
      supabaseLogger.logQuery(`Query executada com sucesso: ${action} from ${table}`, {
        duration,
        resultCount: result.data ? result.data.length : 0,
        table,
        action
      });
    }
    
    return result;
    
  } catch (error: any) {
    const duration = Date.now() - start;
    supabaseLogger.logError(`Database query error: ${action} from ${table}`, {
      table,
      action,
      duration,
      errorCode: error.code
    }, error);
    throw error;
  }
}

// Função para obter cliente (compatibilidade)
export async function getClient() {
  return getSupabaseServerClient();
}

// Função para logs de debug
export function debugQuery(text: string, params?: any[]) {
  if (enableQueryLogs) {
    supabaseLogger.logQuery('Debug query', {
      queryText: text.substring(0, 100),
      params: params ? JSON.stringify(params) : undefined
    });
  }
}

// Função para testar conexão
export async function testConnection() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Conexão com Supabase funcionando',
      count: count || 0
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Erro na conexão com Supabase', 
      error: error.message 
    };
  }
}