// Script de teste para API de exclusão de clientes
// Execute com: node scripts/test-delete-clients.js

const fetch = require('node-fetch');

async function testDeleteClients() {
  try {
    console.log('🧪 Testando API de exclusão de clientes...\n');

    // Primeiro, vamos testar a API de teste
    console.log('1️⃣ Testando API de teste...');
    const testResponse = await fetch('http://localhost:3000/api/test-delete-clients', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer seu_token_aqui', // Substitua pelo token real
        'Content-Type': 'application/json'
      }
    });

    const testData = await testResponse.json();
    console.log('Status:', testResponse.status);
    console.log('Resposta:', testData);

    if (testResponse.ok) {
      console.log('✅ API de teste funcionando!');
    } else {
      console.log('❌ API de teste falhou:', testData);
    }

    console.log('\n2️⃣ Testando API real...');
    const realResponse = await fetch('http://localhost:3000/api/admin/data-management/delete-clients', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer seu_token_aqui', // Substitua pelo token real
        'Content-Type': 'application/json'
      }
    });

    const realData = await realResponse.json();
    console.log('Status:', realResponse.status);
    console.log('Resposta:', realData);

    if (realResponse.ok) {
      console.log('✅ API real funcionando!');
    } else {
      console.log('❌ API real falhou:', realData);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste se o script for chamado diretamente
if (require.main === module) {
  testDeleteClients().catch(console.error);
}

module.exports = { testDeleteClients }; 