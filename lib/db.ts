import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://ewoihxpitbbypqylhdkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2loeHBpdGJieXBxeWxoZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDM1OTQsImV4cCI6MjA2NzA3OTU5NH0.1Fpv-oQogUez8ySm-W3nRiEt0g7KsncMBDVIWEqiAwQ';

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' || isDevelopment;
const enableSlowQueryLogs = process.env.ENABLE_SLOW_QUERY_LOGS !== 'false'; // habilitado por padrão
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'); // 1 segundo

// Função para executar queries usando Supabase
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    console.log('Executing query:', text.substring(0, 100));
    console.log('With params:', params);
    
    // Converter query PostgreSQL simples para Supabase
    if (text.includes('SELECT') && text.includes('profiles')) {
      // Query para profiles
      if (text.includes('WHERE email = $1')) {
        const email = params?.[0];
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          throw error;
        }
        
        return {
          rows: data ? [data] : [],
          rowCount: data ? 1 : 0
        };
      }
    }
    
    // Para outras queries, ainda tentar usar pool se disponível
    throw new Error('Query não suportada pelo adaptador Supabase');
    
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
  }
}

// Função de fallback para pool (se necessário)
let pool: Pool | null = null;

export async function initPool() {
  if (!pool) {
    try {
      pool = new Pool({
        host: 'db.ewoihxpitbbypqylhdkm.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD || 'postgres',
        ssl: {
          rejectUnauthorized: false
        }
      });
    } catch (error) {
      console.error('Failed to initialize pool:', error);
    }
  }
  return pool;
}

// Função para obter uma conexão do pool
export async function getClient() {
  const poolInstance = await initPool();
  if (!poolInstance) {
    throw new Error('Database pool not available');
  }
  
  const client = await poolInstance.connect();
  const queryFn = client.query.bind(client);
  const release = client.release.bind(client);

  client.release = () => {
    if (enableQueryLogs) {
      console.log('🔌 Cliente retornado ao pool');
    }
    release();
  };

  return { client, query: queryFn, release };
}

// Função para logs de debug específicos
export function debugQuery(text: string, params?: any[]) {
  if (enableQueryLogs) {
    console.log('🔍 Debug query', { 
      text: text.substring(0, 100),
      params: params ? JSON.stringify(params) : undefined
    });
  }
}

// Exportar o supabase client também
export { supabase }; 