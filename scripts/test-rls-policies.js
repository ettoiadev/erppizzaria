#!/usr/bin/env node

/**
 * Script para testar as políticas RLS (Row Level Security) do Supabase
 * Este script verifica se as políticas estão funcionando corretamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPolicies() {
  console.log('🔒 Testando políticas RLS...');
  
  const tests = [
    {
      name: 'Profiles - Acesso sem autenticação',
      test: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        
        // Deve retornar erro ou dados vazios (sem acesso)
        return {
          passed: !data || data.length === 0,
          message: data && data.length > 0 ? 'FALHA: Dados expostos sem autenticação' : 'OK: Acesso negado sem autenticação'
        };
      }
    },
    {
      name: 'Categories - Leitura pública',
      test: async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .limit(1);
        
        // Deve permitir leitura pública
        return {
          passed: !error && data !== null,
          message: error ? `FALHA: ${error.message}` : 'OK: Leitura pública permitida'
        };
      }
    },
    {
      name: 'Products - Leitura pública',
      test: async () => {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price')
          .limit(1);
        
        // Deve permitir leitura pública
        return {
          passed: !error && data !== null,
          message: error ? `FALHA: ${error.message}` : 'OK: Leitura pública permitida'
        };
      }
    },
    {
      name: 'Admin Settings - Acesso sem autenticação',
      test: async () => {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*');
        
        // Deve negar acesso
        return {
          passed: !data || data.length === 0 || error,
          message: data && data.length > 0 && !error ? 'FALHA: Dados administrativos expostos' : 'OK: Acesso negado a dados administrativos'
        };
      }
    },
    {
      name: 'Orders - Acesso sem autenticação',
      test: async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*');
        
        // Deve negar acesso
        return {
          passed: !data || data.length === 0 || error,
          message: data && data.length > 0 && !error ? 'FALHA: Pedidos expostos sem autenticação' : 'OK: Acesso negado a pedidos'
        };
      }
    },
    {
      name: 'Coupons - Leitura de cupons ativos',
      test: async () => {
        const { data, error } = await supabase
          .from('coupons')
          .select('code, description')
          .eq('active', true)
          .limit(1);
        
        // Deve permitir leitura de cupons ativos
        return {
          passed: !error,
          message: error ? `FALHA: ${error.message}` : 'OK: Leitura de cupons ativos permitida'
        };
      }
    },
    {
      name: 'Delivery Zones - Leitura de zonas ativas',
      test: async () => {
        const { data, error } = await supabase
          .from('delivery_zones')
          .select('name, delivery_fee')
          .eq('active', true)
          .limit(1);
        
        // Deve permitir leitura de zonas ativas
        return {
          passed: !error,
          message: error ? `FALHA: ${error.message}` : 'OK: Leitura de zonas de entrega ativas permitida'
        };
      }
    }
  ];

  console.log('\n📋 Executando testes...');
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.test();
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${result.message}`);
      
      if (result.passed) passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: ERRO - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Resultado: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Todas as políticas RLS estão funcionando corretamente!');
  } else {
    console.log('⚠️  Algumas políticas RLS precisam de atenção.');
    process.exit(1);
  }
}

async function checkRLSStatus() {
  console.log('\n🔍 Verificando status do RLS nas tabelas...');
  
  const { data: tables, error } = await supabase
    .rpc('get_table_rls_status')
    .catch(() => {
      // Se a função não existir, vamos usar uma consulta alternativa
      return { data: null, error: 'Função RPC não disponível' };
    });
  
  if (error) {
    console.log('ℹ️  Não foi possível verificar o status RLS automaticamente.');
    console.log('   Verifique manualmente no painel do Supabase se RLS está habilitado.');
  } else if (tables) {
    tables.forEach(table => {
      const status = table.rls_enabled ? '🔒 Habilitado' : '🔓 Desabilitado';
      console.log(`   ${table.table_name}: ${status}`);
    });
  }
}

async function main() {
  try {
    await testRLSPolicies();
    await checkRLSStatus();
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testRLSPolicies, checkRLSStatus };