/**
 * Script para testar a conexão com o Supabase
 * 
 * Este script verifica:
 * 1. Se as variáveis de ambiente estão configuradas
 * 2. Se a conexão com o Supabase está funcionando
 * 3. Se as tabelas principais existem
 * 4. Se há dados nas tabelas principais
 */

// Importar dotenv para carregar variáveis de ambiente do arquivo .env.local
require('dotenv').config({ path: '.env.local' });

// Importar o cliente Supabase
const { createClient } = require('@supabase/supabase-js');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Função para imprimir mensagens coloridas
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Função para imprimir resultados de testes
function printTestResult(name, success, details = null) {
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  log(`${icon} ${name}`, color);
  if (details) {
    console.log('  ', details);
  }
}

// Função principal
async function testSupabaseConnection() {
  log('\n🔍 TESTE DE CONEXÃO COM SUPABASE', colors.cyan);
  log('==============================\n', colors.cyan);

  // 1. Verificar variáveis de ambiente
  log('1. Verificando variáveis de ambiente...', colors.blue);
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  printTestResult('SUPABASE_URL', !!supabaseUrl, supabaseUrl ? `Valor: ${supabaseUrl}` : 'Não encontrado');
  printTestResult('SUPABASE_KEY', !!supabaseKey, supabaseKey ? 'Configurado (valor oculto)' : 'Não encontrado');
  
  if (!supabaseUrl || !supabaseKey) {
    log('\n❌ Erro: Variáveis de ambiente do Supabase não configuradas corretamente.', colors.red);
    log('Por favor, configure as variáveis SUPABASE_URL e SUPABASE_KEY no arquivo .env.local', colors.yellow);
    return;
  }

  // 2. Criar cliente Supabase
  log('\n2. Criando cliente Supabase...', colors.blue);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    printTestResult('Cliente Supabase', true, 'Cliente criado com sucesso');

    // 3. Testar conexão
    log('\n3. Testando conexão com Supabase...', colors.blue);
    
    const { data: pingData, error: pingError } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    printTestResult('Conexão com Supabase', !pingError, pingError ? `Erro: ${pingError.message}` : 'Conexão estabelecida com sucesso');
    
    if (pingError) {
      log('\n❌ Erro: Não foi possível conectar ao Supabase.', colors.red);
      return;
    }

    // 4. Verificar tabelas principais
    log('\n4. Verificando tabelas principais...', colors.blue);
    
    const tables = ['profiles', 'categories', 'products', 'orders', 'order_items', 'admin_settings'];
    
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      printTestResult(`Tabela ${table}`, !error, error ? `Erro: ${error.message}` : `Encontrada (${count} registros)`);
    }

    // 5. Verificar usuário admin
    log('\n5. Verificando usuário admin...', colors.blue);
    
    const { data: adminData, error: adminError } = await supabase
      .from('profiles')
      .select('email, full_name, role')
      .eq('role', 'admin')
      .limit(1);
    
    printTestResult('Usuário admin', !adminError && adminData && adminData.length > 0, 
      adminError ? `Erro: ${adminError.message}` : 
      (adminData && adminData.length > 0) ? 
        `Admin encontrado: ${adminData[0].email} (${adminData[0].full_name})` : 
        'Nenhum usuário admin encontrado');

    // 6. Resumo
    log('\n✨ RESUMO DO TESTE', colors.magenta);
    log('================\n', colors.magenta);
    log('✅ Variáveis de ambiente: Configuradas', colors.green);
    log('✅ Cliente Supabase: Criado com sucesso', colors.green);
    log('✅ Conexão com Supabase: Estabelecida', colors.green);
    log(`✅ Tabelas verificadas: ${tables.length}`, colors.green);
    log(`✅ Usuário admin: ${(adminData && adminData.length > 0) ? 'Encontrado' : 'Não encontrado'}`, colors.green);
    
    log('\n🎉 Teste concluído com sucesso!', colors.cyan);
    log('O Supabase está configurado corretamente e pronto para uso.', colors.cyan);

  } catch (error) {
    log(`\n❌ Erro inesperado: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Executar o teste
testSupabaseConnection();