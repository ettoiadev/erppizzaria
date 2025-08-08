const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🔐 Testando login...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@pizzaria.com',
        password: 'password'
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', response.headers);

    const data = await response.text();
    console.log('📄 Response:', data);

    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('✅ Login bem-sucedido!');
      console.log('👤 Usuário:', jsonData.user);
      console.log('🔑 Token:', jsonData.token ? 'Presente' : 'Ausente');
    } else {
      console.log('❌ Login falhou');
    }

  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

testLogin(); 