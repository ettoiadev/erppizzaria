import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { isTokenNearExpiry } from '@/lib/refresh-token'
import { frontendLogger } from '@/lib/frontend-logger'

// Configurar runtime Node.js para suporte ao módulo crypto
export const runtime = 'nodejs'

// JWT_SECRET é obrigatório em produção
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET é obrigatório em produção. Configure a variável de ambiente JWT_SECRET.')
  }
  // Apenas em desenvolvimento, usar chave temporária
  frontendLogger.warn('JWT_SECRET não configurado - usando chave temporária para desenvolvimento', 'auth')
}

// Chave temporária para desenvolvimento (nunca usar em produção)
const TEMP_JWT_SECRET = 'william-disk-pizza-dev-temp-key-2024'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Obter token do cookie (mais seguro que header)
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      // Verificar se a requisição veio da página de login
      const referer = request.headers.get('referer') || ''
      if (referer.includes('/login')) {
        // Para páginas de login, retornar um status específico para evitar erros no console
        frontendLogger.info('Token não fornecido na página de login', 'auth')
        return NextResponse.json({ authenticated: false }, { status: 200 })
      }
      
      frontendLogger.warn('Token não fornecido na verificação', 'auth', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })
      return NextResponse.json({
        success: false,
        error: 'Token não fornecido'
      }, { status: 401 })
    }

    // Verificar e decodificar o token
    const secret = JWT_SECRET || TEMP_JWT_SECRET
    
    if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET não configurado em produção')
    }
    
    const decoded = jwt.verify(token, secret) as any
    
    if (!decoded || !decoded.email || decoded.type !== 'access') {
      frontendLogger.warn('Token inválido na verificação', 'auth', {
        hasEmail: !!decoded?.email,
        tokenType: decoded?.type,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 401 })
    }

    // Buscar usuário no banco
    const userResult = await query(
      'SELECT id, email, role, full_name FROM profiles WHERE email = $1 AND deleted_at IS NULL',
      [decoded.email]
    )
    
    if (userResult.rows.length === 0) {
      frontendLogger.warn('Usuário não encontrado na verificação', 'auth', {
        email: decoded.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 401 })
    }

    const user = userResult.rows[0]

    // Verificar se o token está próximo do vencimento
    const nearExpiry = isTokenNearExpiry(token, 5) // 5 minutos
    
    frontendLogger.info('Token verificado com sucesso', 'auth', {
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role,
      nearExpiry,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      },
      nearExpiry // Informar se o token está próximo do vencimento
    })

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      frontendLogger.warn('Token expirado na verificação', 'auth', {
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json({
        success: false,
        error: 'Token expirado'
      }, { status: 401 })
    }
    
    if (error.name === 'JsonWebTokenError') {
      frontendLogger.warn('Token malformado na verificação', 'auth', {
         ip: request.headers.get('x-forwarded-for') || 'unknown'
       })
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 401 })
    }

    frontendLogger.logError('Erro interno na verificação de token', {
       error: error.message,
       ip: request.headers.get('x-forwarded-for') || 'unknown'
     }, error, 'auth')

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}