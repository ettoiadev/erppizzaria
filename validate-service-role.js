require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('=== VALIDAÇÃO DA CHAVE SERVICE_ROLE ===\n');

// Verificar se as variáveis estão definidas
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

console.log('1. Variáveis encontradas:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Role Key: ${serviceRoleKey.substring(0, 50)}...`);
console.log();

// Criar cliente com service_role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function validateServiceRole() {
  try {
    console.log('2. Testando operação administrativa (listar tabelas):');
    
    // Tentar uma operação que requer privilégios administrativos
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao acessar informações do schema:');
      console.log('   Código:', error.code);
      console.log('   Mensagem:', error.message);
      
      if (error.message.includes('Invalid API key') || error.code === 'PGRST301') {
        console.log('\n🔑 PROBLEMA: A chave service_role é inválida!');
        console.log('   Solução: Obtenha a chave correta do dashboard do Supabase');
        console.log('   Veja: get-service-role-key.md');
      }
      return false;
    }
    
    console.log('✅ Chave service_role válida!');
    console.log(`   Encontradas ${data?.length || 0} tabelas no schema público`);
    
    if (data && data.length > 0) {
      console.log('   Tabelas:', data.map(t => t.table_name).join(', '));
    }
    
    return true;
    
  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
    return false;
  }
}

// Executar validação
validateServiceRole().then(isValid => {
  console.log();
  if (isValid) {
    console.log('🎉 SUCESSO: A chave service_role está funcionando corretamente!');
    console.log('   Agora você pode usar operações administrativas no Supabase.');
  } else {
    console.log('⚠️  AÇÃO NECESSÁRIA: Atualize a chave service_role no arquivo .env.local');
    console.log('   Consulte o arquivo get-service-role-key.md para instruções.');
  }
}).catch(err => {
  console.log('💥 Erro fatal:', err.message);
});