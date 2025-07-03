import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ewoihxpitbbypqylhdkm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2loeHBpdGJieXBxeWxoZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDM1OTQsImV4cCI6MjA2NzA3OTU5NH0.1Fpv-oQogUez8ySm-W3nRiEt0g7KsncMBDVIWEqiAwQ';

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Controle de logs baseado em ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogs = process.env.ENABLE_QUERY_LOGS === 'true' || isDevelopment;
const enableSlowQueryLogs = process.env.ENABLE_SLOW_QUERY_LOGS !== 'false'; // habilitado por padrão
const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'); // 1 segundo

// Função principal para executar queries usando Supabase
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  
  try {
    if (enableQueryLogs) {
      console.log('🔍 Executing query:', text.substring(0, 100));
      console.log('📝 With params:', params);
    }
    
    // Normalizar query para comparação
    const normalizedQuery = text.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Query para buscar usuário por email (login)
    if (normalizedQuery.includes('select') && normalizedQuery.includes('profiles') && normalizedQuery.includes('where email = $1')) {
      const email = params?.[0];
      if (!email) {
        throw new Error('Email parameter is required');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, password_hash')
        .eq('email', email.toLowerCase())
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - retornar resultado vazio
          return {
            rows: [],
            rowCount: 0
          };
        }
        throw error;
      }
      
      return {
        rows: data ? [data] : [],
        rowCount: data ? 1 : 0
      };
    }
    
    // Query para inserir perfil (registro)
    if (normalizedQuery.includes('insert into profiles')) {
      if (normalizedQuery.includes('returning *')) {
        // INSERT com RETURNING
        const emailParam = params?.find(p => p?.includes('@'));
        const fullNameParam = params?.find(p => typeof p === 'string' && !p.includes('@') && !p.startsWith('$'));
        const roleParam = params?.find(p => ['customer', 'admin', 'kitchen', 'delivery'].includes(p));
        const passwordParam = params?.find(p => typeof p === 'string' && p.startsWith('$'));
        
        if (!emailParam || !fullNameParam || !passwordParam) {
          throw new Error('Missing required parameters for profile creation');
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            email: emailParam.toLowerCase(),
            full_name: fullNameParam,
            role: roleParam || 'customer',
            password_hash: passwordParam
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return {
          rows: data ? [data] : [],
          rowCount: data ? 1 : 0
        };
      }
    }
    
    // Query genérica de teste (SELECT NOW(), etc.)
    if (normalizedQuery.includes('select now()') || normalizedQuery.includes('select version()')) {
      return {
        rows: [{
          current_time: new Date().toISOString(),
          db_version: 'Supabase PostgreSQL 15.x'
        }],
        rowCount: 1
      };
    }
    
    // Se chegou até aqui, a query não é suportada
    console.warn('⚠️ Query não suportada pelo adaptador Supabase:', text.substring(0, 100));
    throw new Error(`Query não suportada: ${text.substring(0, 50)}...`);
    
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error('❌ Database query error', { 
      text: text.substring(0, 100), 
      error: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      params: params ? JSON.stringify(params).substring(0, 100) : undefined,
      duration: `${duration}ms`
    });
    throw error;
  }
}

// Função para obter cliente (compatibilidade)
export async function getClient() {
  return {
    query: async (text: string, params?: any[]) => await query(text, params),
    release: () => {
      // No-op para compatibilidade
    }
  };
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
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    
    return { success: true, message: 'Conexão com Supabase funcionando' };
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Erro na conexão com Supabase', 
      error: error.message 
    };
  }
}

// Exportar o cliente Supabase
export { supabase }; 