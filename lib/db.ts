// Importar Supabase ao invés do PostgreSQL nativo
import { getSupabaseServerClient } from './supabase';

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
      console.log('🔍 Executing Supabase query:', { table, action, options });
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
      console.warn('⚠️ Query lenta detectada:', { table, action, duration });
    }
    
    if (enableQueryLogs) {
      console.log('✅ Query executada com sucesso:', { 
        duration: `${duration}ms`, 
        data: result.data ? result.data.length : 0
      });
    }
    
    return result;
    
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error('❌ Database query error', { 
      table, 
      action,
      error: error.message,
      code: error.code,
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