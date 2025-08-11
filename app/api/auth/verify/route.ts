import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getUserByEmail } from '@/lib/db-supabase'
import { isTokenNearExpiry } from '@/lib/refresh-token'
import { frontendLogger } from '@/lib/logging'

const JWT_SECRET = process.env.JWT_SECRET || 'william-disk-pizza-jwt-secret-2024-production'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Obter token do cookie (mais seguro que header)
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      frontendLogger.warn('auth', 'Token não fornecido na verificação', {
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
      return NextResponse.json({
        success: false,
        error: 'Token não fornecido'
      }, { status: 401 })
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (!decoded || !decoded.email || decoded.type !== 'access') {
      frontendLogger.warn('auth', 'Token inválido na verificação', {
        hasEmail: !!decoded?.email,
        tokenType: decoded?.type,
        ip: request.ip || 'unknown'
      })
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 401 })
    }

    // Buscar usuário no banco
    const user = await getUserByEmail(decoded.email)
    
    if (!user) {
      frontendLogger.warn('auth', 'Usuário não encontrado na verificação', {
        email: decoded.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        ip: request.ip || 'unknown'
      })
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 401 })
    }

    // Verificar se o token está próximo do vencimento
    const nearExpiry = isTokenNearExpiry(token, 5) // 5 minutos
    
    frontendLogger.info('auth', 'Token verificado com sucesso', {
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role,
      nearExpiry,
      ip: request.ip || 'unknown'
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
      frontendLogger.warn('auth', 'Token expirado na verificação', {
        ip: request.ip || 'unknown'
      })
      return NextResponse.json({
        success: false,
        error: 'Token expirado'
      }, { status: 401 })
    }
    
    if (error.name === 'JsonWebTokenError') {
      frontendLogger.warn('auth', 'Token malformado na verificação', {
        ip: request.ip || 'unknown'
      })
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 401 })
    }

    frontendLogger.error('auth', 'Erro interno na verificação de token', {
      error: error.message,
      stack: error.stack,
      ip: request.ip || 'unknown'
    })

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}