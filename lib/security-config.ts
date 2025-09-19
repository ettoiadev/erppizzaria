/**
 * Configurações centralizadas de segurança para a aplicação
 */

// Configurações de CORS
export const CORS_CONFIG = {
  development: {
    allowedOrigins: [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000',
      null // Permitir requisições sem origin em desenvolvimento (ex: same-origin)
    ],
    allowCredentials: true,
    maxAge: 86400 // 24 horas
  },
  production: {
    allowedOrigins: [
      // Adicionar domínios de produção aqui
      'https://seu-dominio.com',
      'https://www.seu-dominio.com'
    ],
    allowCredentials: true,
    maxAge: 86400 // 24 horas
  }
}

// Headers de segurança padrão
export const SECURITY_HEADERS = {
  // Previne ataques de MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Previne clickjacking
  'X-Frame-Options': 'DENY',
  
  // Proteção XSS (legacy, mas ainda útil)
  'X-XSS-Protection': '1; mode=block',
  
  // Controla informações do referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Controla permissões de APIs do navegador
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  
  // Remove header que expõe tecnologia
  'X-Powered-By': 'ERP Pizzaria'
}

// Configurações de Content Security Policy
export const CSP_CONFIG = {
  development: {
    directives: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:", // Next.js precisa
      "style-src 'self' 'unsafe-inline'", // Tailwind CSS precisa
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:*", // Hot reload
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "worker-src 'self' blob:"
    ]
  },
  production: {
    directives: [
      "default-src 'self'",
      "script-src 'self'", // Mais restritivo em produção
      "style-src 'self' 'unsafe-inline'", // Tailwind ainda precisa
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ]
  }
}

// Configurações de HSTS (apenas produção)
export const HSTS_CONFIG = {
  maxAge: 31536000, // 1 ano
  includeSubDomains: true,
  preload: true
}

// Rate limiting por tipo de endpoint
export const RATE_LIMIT_CONFIG = {
  public: {
    requests: 1000, // Aumentado de 100 para 1000
    window: 60000, // 1 minuto
    message: 'Muitas requisições. Tente novamente em 1 minuto.'
  },
  auth: {
    requests: 100, // Aumentado de 10 para 100
    window: 60000, // 1 minuto
    message: 'Muitas tentativas de login. Tente novamente em 1 minuto.'
  },
  api: {
    requests: 2000, // Aumentado de 200 para 2000
    window: 60000, // 1 minuto
    message: 'Limite de API excedido. Tente novamente em 1 minuto.'
  },
  admin: {
    requests: 5000, // Aumentado de 500 para 5000
    window: 60000, // 1 minuto
    message: 'Limite administrativo excedido.'
  }
}

// Configurações de cookies seguros
export const COOKIE_CONFIG = {
  development: {
    secure: false, // HTTP em desenvolvimento
    sameSite: 'lax' as const,
    httpOnly: true
  },
  production: {
    secure: true, // HTTPS obrigatório
    sameSite: 'strict' as const,
    httpOnly: true
  }
}

// Validação de origem
export function isAllowedOrigin(origin: string | null, environment: 'development' | 'production'): boolean {
  const config = CORS_CONFIG[environment]
  
  // Verificar se a origem está na lista de permitidas (incluindo null para same-origin)
  return config.allowedOrigins.includes(origin as any)
}

// Geração de CSP string
export function generateCSP(environment: 'development' | 'production'): string {
  const config = CSP_CONFIG[environment]
  return config.directives.join('; ')
}

// Geração de HSTS string
export function generateHSTS(): string {
  return `max-age=${HSTS_CONFIG.maxAge}; includeSubDomains; preload`
}

// Configurações de validação de entrada
export const INPUT_VALIDATION = {
  maxStringLength: 1000,
  maxNumberValue: 999999999,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  sanitizeHtml: true,
  stripScripts: true
}

// Configurações de logging de segurança
export const SECURITY_LOGGING = {
  logFailedAuth: true,
  logSuspiciousActivity: true,
  logRateLimitExceeded: true,
  logCSPViolations: true,
  retentionDays: 90
}