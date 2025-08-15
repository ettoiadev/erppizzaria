import { NextRequest, NextResponse } from 'next/server'

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
  
  // 1. Enforçar HTTPS em produção
  if (process.env.NODE_ENV === 'production' && protocol !== 'https:') {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // 2. Verificar rotas protegidas
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api')
  const isAuthRoute = pathname.startsWith('/api/auth')
  
  // 3. Criar response com headers de segurança
  const response = NextResponse.next()
  
  // Aplicar headers de segurança
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Configurar CORS para permitir credenciais
  const origin = request.headers.get('origin')
  const allowedOrigin = process.env.NODE_ENV === 'production' 
    ? 'https://erppizzaria-tau.vercel.app'
    : 'http://localhost:3000'

  if (origin === allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    // Se for uma requisição OPTIONS, retornar 200 OK
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200,
        headers: response.headers
      })
    }
  }

  // 4. Headers específicos para rotas de API
  if (isApiRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }

  // 5. Headers específicos para rotas admin
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