import { NextRequest, NextResponse } from "next/server"
import { appLogger } from '@/lib/logging'
import { getSupabaseServerClient } from '@/lib/supabase'
import { generateTokenPair } from '@/lib/refresh-token'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    appLogger.info('api', 'Iniciando debug de autenticação')
    
    const body = await request.json()
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      }, { status: 400 })
    }
    
    // 1. Testar conexão com Supabase
    appLogger.info('api', 'Testando conexão com Supabase')
    const supabase = getSupabaseServerClient()
    
    // 2. Testar busca de usuário
    appLogger.info('api', 'Testando busca de usuário')
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, password_hash, full_name, role')
      .eq('email', email)
      .maybeSingle()
    
    if (userError) {
      appLogger.error('api', 'Erro ao buscar usuário', userError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar usuário',
        details: userError.message 
      }, { status: 500 })
    }
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }
    
    // 3. Testar inserção na tabela refresh_tokens
    appLogger.info('api', 'Testando inserção na tabela refresh_tokens')
    const testTokenId = 'test-' + Date.now()
    const { error: insertError } = await supabase
      .from('refresh_tokens')
      .insert({
        id: testTokenId,
        user_id: user.id,
        email: user.email,
        role: user.role || 'customer',
        token: 'test-token',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_revoked: false
      })
    
    if (insertError) {
      appLogger.error('api', 'Erro ao inserir na tabela refresh_tokens', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro na tabela refresh_tokens',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 })
    }
    
    // 4. Remover token de teste
    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('id', testTokenId)
    
    // 5. Testar geração de tokens
    appLogger.info('api', 'Testando geração de tokens')
    try {
      const tokenPair = await generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role || 'customer'
      })
      
      appLogger.info('api', 'Tokens gerados com sucesso')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Debug completo - todos os testes passaram',
        user: {
          id: user.id,
          email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          role: user.role
        },
        tokensGenerated: true,
        hasAccessToken: !!tokenPair.accessToken,
        hasRefreshToken: !!tokenPair.refreshToken
      })
      
    } catch (tokenError: any) {
      appLogger.error('api', 'Erro ao gerar tokens', tokenError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao gerar tokens',
        details: tokenError.message,
        errorType: typeof tokenError
      }, { status: 500 })
    }
    
  } catch (error: any) {
    appLogger.error('api', 'Erro no debug', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno no debug',
      details: error.message 
    }, { status: 500 })
  }
}
