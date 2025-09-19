/**
 * Middleware Next.js para CDN Local e Otimizações
 * Fase 3 - Otimizações Avançadas
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting em memória (para desenvolvimento)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configurações de rate limiting
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100, // máximo de requests por IP
  apiMaxRequests: 50, // máximo para APIs
  staticMaxRequests: 1000 // máximo para assets estáticos
};

/**
 * Rate limiting inteligente baseado em comportamento
 */
function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const url = new URL(request.url);
  const isApi = url.pathname.startsWith('/api/');
  const isStatic = url.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/);
  
  // Determinar limite baseado no tipo de request
  let maxRequests = RATE_LIMIT_CONFIG.maxRequests;
  if (isApi) {
    maxRequests = RATE_LIMIT_CONFIG.apiMaxRequests;
  } else if (isStatic) {
    maxRequests = RATE_LIMIT_CONFIG.staticMaxRequests;
  }

  const now = Date.now();
  const key = `${ip}:${isApi ? 'api' : isStatic ? 'static' : 'page'}`;
  
  let rateLimitInfo = rateLimitMap.get(key);
  
  // Reset se janela de tempo expirou
  if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
    rateLimitInfo = {
      count: 0,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs
    };
  }
  
  rateLimitInfo.count++;
  rateLimitMap.set(key, rateLimitInfo);
  
  // Verificar se excedeu o limite
  if (rateLimitInfo.count > maxRequests) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimitInfo.resetTime - now) / 1000).toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitInfo.resetTime.toString()
      }
    });
  }
  
  return null;
}

/**
 * Adicionar headers de segurança
 */
function addSecurityHeaders(response: NextResponse): void {
  // Headers de segurança básicos
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CSP básico (ajustar conforme necessário)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';"
  );
  
  // Headers de performance
  response.headers.set('X-DNS-Prefetch-Control', 'on');
}

/**
 * Middleware principal
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const url = new URL(request.url);
  
  try {
    // 1. Rate limiting inteligente
    const rateLimitResponse = checkRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // 2. Assets estáticos são servidos pelo Next.js automaticamente
    
    // 3. Middleware para APIs
    if (url.pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      
      // Headers específicos para APIs
      response.headers.set('X-API-Version', '1.0');
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      addSecurityHeaders(response);
      
      return response;
    }
    
    // 4. Middleware para páginas
    const response = NextResponse.next();
    
    // Headers de otimização para páginas
    response.headers.set('X-Powered-By', 'ERP Pizzaria');
    
    // Preload de recursos críticos
    if (url.pathname === '/') {
      response.headers.set(
        'Link',
        '</uploads/logo.png>; rel=preload; as=image, </api/categories>; rel=preload; as=fetch'
      );
    }
    
    addSecurityHeaders(response);
    
    // Performance monitoring removido para compatibilidade com edge runtime
    
    return response;
    
  } catch (error) {
    // Retornar resposta padrão em caso de erro
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }
}

/**
 * Configuração do matcher para o middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Limpeza periódica do rate limit map
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of rateLimitMap.entries()) {
    if (now > info.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Limpar a cada 5 minutos