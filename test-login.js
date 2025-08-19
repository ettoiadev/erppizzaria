const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3000';

async function testLogin() {
  try {
    // Teste GET primeiro
    console.log('Testando endpoint GET...');
    const getResponse = await fetch(`${baseUrl}/api/auth/login`);
    console.log('Status:', getResponse.status);
    const getBody = await getResponse.text();
    console.log('Response body:', getBody);
    
    if (getResponse.ok) {
      console.log('✅ GET endpoint funcionando!');
    } else {
      console.log('❌ Erro no GET:', getResponse.status);
    }
    
    console.log('Testando endpoint de login...');
    
    // Dados de login com a senha correta
    const loginData = {
      email: 'admin@pizzaria.com',
      password: 'password' // Senha correta descoberta no teste bcrypt
    };
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
    if (response.ok) {
      console.log('✅ Login realizado com sucesso!');
      const data = JSON.parse(responseBody);
      console.log('Token recebido:', data.token ? 'Sim' : 'Não');
      console.log('Usuário:', data.user?.email);
    } else {
      console.log('❌ Erro no login:', response.status);
    }
    
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
}

testLogin();