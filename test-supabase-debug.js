const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('=== TESTE DE CONEXÃO SUPABASE ===');
  
  // Verificar variáveis de ambiente
  console.log('\n1. Verificando variáveis de ambiente:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);
  console.log('SUPABASE_KEY (primeiros 20 chars):', process.env.SUPABASE_KEY?.substring(0, 20) + '...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    return;
  }
  
  // Criar cliente Supabase
  console.log('\n2. Criando cliente Supabase...');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
  
  try {
    // Teste 1: Verificar conexão básica
    console.log('\n3. Testando conexão básica...');
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (tablesError) {
      console.error('❌ Erro na conexão básica:', tablesError);
      return;
    }
    
    console.log('✅ Conexão básica OK. Total de registros na tabela profiles:', tables);
    
    // Teste 2: Buscar usuário específico
    console.log('\n4. Buscando usuário admin@pizzaria.com...');
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, password_hash, full_name, role')
      .eq('email', 'admin@pizzaria.com')
      .maybeSingle();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    if (!user) {
      console.log('❌ Usuário admin@pizzaria.com não encontrado');
    } else {
      console.log('✅ Usuário encontrado:');
      console.log('  - ID:', user.id);
      console.log('  - Email:', user.email);
      console.log('  - Nome:', user.full_name);
      console.log('  - Role:', user.role);
      console.log('  - Tem password_hash:', !!user.password_hash);
      console.log('  - Password hash (primeiros 20 chars):', user.password_hash?.substring(0, 20) + '...');
    }
    
    // Teste 3: Listar todos os usuários
    console.log('\n5. Listando todos os usuários...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .order('email');
    
    if (allUsersError) {
      console.error('❌ Erro ao listar usuários:', allUsersError);
      return;
    }
    
    console.log('✅ Usuários encontrados:');
    allUsers?.forEach((u, index) => {
      console.log(`  ${index + 1}. ${u.email} (${u.role}) - ID: ${u.id}`);
    });
    
    // Teste 4: Verificar RLS (Row Level Security)
    console.log('\n6. Testando políticas RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (rlsError) {
      console.log('⚠️  RLS pode estar bloqueando acesso:', rlsError.message);
    } else {
      console.log('✅ RLS permite acesso com chave anon');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSupabaseConnection().catch(console.error);