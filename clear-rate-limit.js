const fetch = require('node-fetch');

async function clearRateLimit() {
  try {
    console.log('🧹 Limpando cache do rate limiter...');
    
    // Fazer uma requisição para limpar o cache
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'GET'
    });

    console.log('✅ Cache limpo');
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Testar login novamente
    console.log('🔐 Testando login após limpeza...');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@pizzaria.com',
        password: 'password'
      })
    });

    console.log('📊 Status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✅ Login funcionando!');
      console.log('👤 Usuário:', data.user.email);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Erro:', errorText);
    }

  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

clearRateLimit(); 