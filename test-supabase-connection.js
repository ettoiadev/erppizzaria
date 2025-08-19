// Teste de conexão direta com Supabase usando as mesmas configurações do código
const { createClient } = require('@supabase/supabase-js');

// Usar as mesmas variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Configuração Supabase:');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);
console.log('Key length:', supabaseKey?.length);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Criar cliente com as mesmas configurações do código
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testConnection() {
  try {
    console.log('\n🔍 Testando conexão com Supabase...');
    
    // Teste 1: Listar tabelas (teste básico de conectividade)
    console.log('\n1. Testando conectividade básica...');
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (tablesError) {
      console.error('❌ Erro na conectividade:', tablesError);
      return;
    }
    
    console.log('✅ Conectividade OK');
    
    // Teste 2: Buscar usuário específico
    console.log('\n2. Buscando usuário admin@pizzaria.com...');
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
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Full Name:', user.full_name);
    console.log('- Has Password Hash:', !!user.password_hash);
    console.log('- Password Hash Length:', user.password_hash?.length);
    
    // Teste 3: Verificar senha
    console.log('\n3. Testando verificação de senha...');
    const bcrypt = require('bcryptjs');
    
    const passwords = ['password', '123456', 'admin'];
    
    for (const pwd of passwords) {
      const isValid = bcrypt.compareSync(pwd, user.password_hash);
      console.log(`- Senha '${pwd}': ${isValid ? '✅ VÁLIDA' : '❌ inválida'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testConnection();