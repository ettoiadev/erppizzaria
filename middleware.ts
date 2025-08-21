import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { appLogger } from '@/lib/logging'

// Rotas que não precisam de autenticação
const publicRoutes = ['/', '/login', '/admin/login']

// Rotas que precisam de autenticação administrativa
const adminRoutes = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    // Criar cliente Supabase para o middleware
    const response = NextResponse.next()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            response.cookies.set(name, value, options)
          },
          remove: (name: string, options: any) => {
            response.cookies.delete(name, options)
          }
        }
      }
    )

    // Verificar sessão
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      appLogger.error('auth', 'Erro ao verificar sessão', error)
      return redirectToLogin(request)
    }

    if (!session) {
      appLogger.warn('auth', 'Tentativa de acesso sem sessão', { path: pathname })
      return redirectToLogin(request)
    }

    // Verificar permissões administrativas
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        appLogger.warn('auth', 'Tentativa de acesso administrativo não autorizado', {
          userId: session.user.id,
          role: profile?.role,
          path: pathname
        })
        return new NextResponse(JSON.stringify({ error: 'Acesso não autorizado' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return response
  } catch (error) {
    appLogger.error('auth', 'Erro no middleware', error)
    return redirectToLogin(request)
  }
}

function redirectToLogin(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const loginUrl = isAdminRoute ? '/admin/login' : '/login'
  
  return NextResponse.redirect(new URL(loginUrl, request.url))
}

// Configurar os caminhos que devem passar pelo middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. Matches any request that starts with:
     *  - _next/static (static files)
     *  - _next/image (image optimization files)
     *  - favicon.ico (favicon file)
     *  - images/ (local images)
     * 2. Matches public routes defined above
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}