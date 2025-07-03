// Teste rápido da API de login
const testLogin = async () => {
  try {
    console.log('Testando login admin...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@williamdiskpizza.com',
        password: 'admin123'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login success:', data);
    } else {
      const error = await response.text();
      console.log('Login error:', error);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Para Node.js
if (typeof window === 'undefined') {
  // Importar fetch para Node.js
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    testLogin();
  }).catch(() => {
    console.log('Para executar no Node.js, instale node-fetch: npm install node-fetch');
  });
} else {
  // Para navegador
  testLogin();
} 