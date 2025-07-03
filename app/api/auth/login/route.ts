import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    message: "Login endpoint is working",
    timestamp: new Date().toISOString(),
    method: "GET"
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/auth/login received')
    
    const body = await request.json()
    console.log('📥 Body:', body)
    
    // Resposta simples para teste
    return NextResponse.json({
      message: "POST endpoint working",
      receivedEmail: body.email,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 