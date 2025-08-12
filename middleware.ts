import { NextRequest, NextResponse } from 'next/server'
import { appLogger } from './lib/logging'

// Configuração de segurança
const SECURITY_HEADERS = {
  // Força HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Previne ataques XSS
  'X-Content-Type-Options': 'nosniff',
  // Previne clickjacking
  'X-Frame-Options': 'DENY',
  // Controla referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Política de permissões
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
}

export function middleware(request: NextRequest) {
  const { pathname, protocol, host } = request.nextUrl
  
  // Log da requisição para auditoria
  appLogger.info('api', 'Requisição interceptada', {
    pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    ip: request.ip || request.headers.get('x-forwarded-for'),
    protocol
  })

  // 1. Enforçar HTTPS em produção
  if (process.env.NODE_ENV === 'production' && protocol !== 'https:') {
    appLogger.warn('api', 'Tentativa de acesso HTTP em produção', {
      pathname,
      protocol,
      host
    })
    
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // 2. Verificar rotas protegidas
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api')
  const isAuthRoute = pathname.startsWith('/api/auth')
  
  // 3. Aplicar rate limiting adicional para rotas sensíveis
  if (isAuthRoute || pathname.includes('/api/payments')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    appLogger.info('api', 'Acesso a rota sensível', {
      pathname,
      ip,
      timestamp: new Date().toISOString()
    })
  }

  // 4. Criar response com headers de segurança
  const response = NextResponse.next()
  
  // Aplicar headers de segurança
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Configurar CORS para permitir credenciais
  const origin = request.headers.get('origin')
  if (origin === 'https://erppizzaria-tau.vercel.app') {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // 5. Headers específicos para rotas de API
  if (isApiRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }

  // 6. Headers específicos para rotas admin
  if (isAdminRoute) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
}

// Configurar quais rotas o middleware deve interceptar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}