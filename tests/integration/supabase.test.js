/**
 * Testes de integração para verificar a configuração do Supabase
 * Execute com: npm test ou node tests/integration/supabase.test.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function assert(condition, message) {
  if (!condition) {
    log(`❌ FALHOU: ${message}`, colors.red);
    process.exit(1);
  } else {
    log(`✅ PASSOU: ${message}`, colors.green);
  }
}

async function runTests() {
  log('\n🧪 Iniciando testes de integração do Supabase...\n', colors.bright);

  // Teste 1: Verificar variáveis de ambiente
  log('1. Testando variáveis de ambiente...', colors.blue);
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  assert(supabaseUrl, 'SUPABASE_URL deve estar configurada');
  assert(supabaseKey, 'SUPABASE_KEY deve estar configurada');
  assert(supabaseUrl.startsWith('http'), 'SUPABASE_URL deve ser uma URL válida');
  assert(supabaseKey.length > 20, 'SUPABASE_KEY deve ter pelo menos 20 caracteres');

  // Teste 2: Criar cliente Supabase
  log('\n2. Testando criação do cliente Supabase...', colors.blue);
  
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    assert(supabase, 'Cliente Supabase deve ser criado com sucesso');
  } catch (error) {
    assert(false, `Erro ao criar cliente Supabase: ${error.message}`);
  }

  // Teste 3: Testar conexão básica
  log('\n3. Testando conexão com o banco...', colors.blue);
  
  try {
    const { data, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    assert(!error, `Conexão com Supabase deve funcionar: ${error?.message || 'OK'}`);
  } catch (error) {
    assert(false, `Erro na conexão: ${error.message}`);
  }

  // Teste 4: Verificar tabelas essenciais
  log('\n4. Testando existência de tabelas essenciais...', colors.blue);
  
  const essentialTables = ['profiles', 'categories', 'products', 'orders', 'order_items'];
  
  for (const table of essentialTables) {
    try {
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      assert(!error, `Tabela '${table}' deve existir e ser acessível`);
    } catch (error) {
      assert(false, `Erro ao acessar tabela '${table}': ${error.message}`);
    }
  }

  // Teste 5: Verificar configurações de autenticação
  log('\n5. Testando configurações de autenticação...', colors.blue);
  
  const jwtSecret = process.env.JWT_SECRET;
  assert(jwtSecret, 'JWT_SECRET deve estar configurado');
  assert(jwtSecret.length >= 32, 'JWT_SECRET deve ter pelo menos 32 caracteres');

  // Teste 6: Verificar configurações de ambiente
  log('\n6. Testando configurações de ambiente...', colors.blue);
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  assert(['development', 'production', 'test'].includes(nodeEnv), 'NODE_ENV deve ser válido');
  assert(siteUrl, 'NEXT_PUBLIC_SITE_URL deve estar configurado');
  assert(siteUrl.startsWith('http'), 'NEXT_PUBLIC_SITE_URL deve ser uma URL válida');

  log('\n🎉 Todos os testes passaram! Configuração do Supabase está correta.\n', colors.green);
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    log(`\n💥 Erro durante os testes: ${error.message}\n`, colors.red);
    process.exit(1);
  });
}

module.exports = { runTests };