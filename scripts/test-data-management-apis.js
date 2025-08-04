// Script de teste para APIs de gerenciamento de dados
// Execute com: node scripts/test-data-management-apis.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'seu_token_admin_aqui'; // Substitua pelo token real

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`🔍 Testando ${method} ${endpoint}...`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Sucesso:`, data);
      return { success: true, data };
    } else {
      console.log(`❌ Erro ${response.status}:`, data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`❌ Erro de conexão:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes das APIs de gerenciamento de dados...\n');

  // Teste 1: Verificar status do servidor
  console.log('1️⃣ Testando status do servidor...');
  await testAPI('/api/health');

  // Teste 2: Verificar configurações admin
  console.log('\n2️⃣ Testando configurações admin...');
  await testAPI('/api/admin/settings');

  // Teste 3: Contar clientes antes da exclusão
  console.log('\n3️⃣ Contando clientes existentes...');
  await testAPI('/api/customers');

  // Teste 4: Contar produtos antes da exclusão
  console.log('\n4️⃣ Contando produtos existentes...');
  await testAPI('/api/products');

  // Teste 5: Contar pedidos antes da exclusão
  console.log('\n5️⃣ Contando pedidos existentes...');
  await testAPI('/api/orders');

  console.log('\n📋 Resumo dos testes:');
  console.log('- Se todos os testes passaram, as APIs estão funcionando');
  console.log('- Se algum teste falhou, verifique os logs acima');
  console.log('- Para testar exclusão, use as APIs DELETE manualmente');
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAPI, runTests }; 