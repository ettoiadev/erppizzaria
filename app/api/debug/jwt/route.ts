import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    console.log('🔍 Debug JWT - Token recebido:', token ? 'SIM' : 'NÃO')
    console.log('🔍 JWT_SECRET configurado:', !!process.env.JWT_SECRET)
    console.log('🔍 JWT_SECRET valor:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'UNDEFINED')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }
    
    const decoded = await verifyToken(token)
    console.log('🔍 Token decodificado:', decoded)
    
    return NextResponse.json({
      success: true,
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretPrefix: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'UNDEFINED',
      tokenValid: !!decoded,
      decodedPayload: decoded,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Erro no debug JWT:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      hasJwtSecret: !!process.env.JWT_SECRET,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 