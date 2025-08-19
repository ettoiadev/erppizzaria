// Debug para identificar qual padrão está sendo detectado
const MALICIOUS_PATTERNS = {
  sql: [
    /(union\s+select|insert\s+into|delete\s+from|update\s+set|drop\s+table|create\s+table|alter\s+table|exec\s+|execute\s+)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i
  ],
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ],
  pathTraversal: [
    /\.\.\/|\.\.\\/gi,
    /%2e%2e%2f|%2e%2e%5c/gi,
    /\.\.\.%2f|\.\.\.%5c/gi
  ],
  commandInjection: [
    /[;&|`$(){}\[\]].*[;&|`$(){}\[\]]/,
    /(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\s+/i
  ]
};

function detectMaliciousPattern(value) {
  console.log('Testando valor:', value);
  
  for (const [category, patterns] of Object.entries(MALICIOUS_PATTERNS)) {
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      if (pattern.test(value)) {
        console.log(`❌ Padrão malicioso detectado em ${category}[${i}]:`, pattern);
        console.log('Match:', value.match(pattern));
        return true;
      }
    }
  }
  
  console.log('✅ Nenhum padrão malicioso detectado');
  return false;
}

// Testar dados de login
const loginData = {
  email: 'admin@pizzaria.com',
  password: '123456'
};

const jsonString = JSON.stringify(loginData);
console.log('JSON string:', jsonString);
detectMaliciousPattern(jsonString);

// Testar cada campo individualmente
console.log('\n--- Testando email ---');
detectMaliciousPattern(loginData.email);

console.log('\n--- Testando password ---');
detectMaliciousPattern(loginData.password);