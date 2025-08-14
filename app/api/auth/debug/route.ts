import { NextRequest, NextResponse } from "next/server"
import { appLogger } from '@/lib/logging'
import { getSupabaseServerClient } from '@/lib/supabase'
import { generateTokenPair } from '@/lib/refresh-token'
import crypto from 'crypto'

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
    
    // 3. Testar estrutura da tabela refresh_tokens
    appLogger.info('api', 'Testando estrutura da tabela refresh_tokens')
    
    // Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('refresh_tokens')
      .select('id')
      .limit(1)
    
    if (tableError) {
      appLogger.error('api', 'Erro ao acessar tabela refresh_tokens', tableError)
      return NextResponse.json({ 
        success: false, 
        error: 'Tabela refresh_tokens não acessível',
        details: tableError.message,
        code: tableError.code,
        hint: tableError.hint,
        suggestion: 'Verificar se a tabela existe e tem as permissões corretas'
      }, { status: 500 })
    }
    
    appLogger.info('api', 'Tabela refresh_tokens acessível')
    
    // 4. Testar inserção simples
    appLogger.info('api', 'Testando inserção na tabela refresh_tokens')
    const testTokenId = crypto.randomUUID()
    
    const { error: insertError } = await supabase
      .from('refresh_tokens')
      .insert({
        id: testTokenId,
        user_id: user.id,
        email: user.email,
        role: user.role || 'customer',
        token: 'test-token-' + Date.now(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_revoked: false
      })
    
    if (insertError) {
      appLogger.error('api', 'Erro ao inserir na tabela refresh_tokens', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Falha na inserção - problema na tabela refresh_tokens',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        tableExists: true,
        userFound: true,
        suggestion: 'Verificar políticas RLS e estrutura da tabela'
      }, { status: 500 })
    }
    
    // 5. Remover token de teste
    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('id', testTokenId)
    
    appLogger.info('api', 'Teste de inserção bem-sucedido')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Debug completo - todos os testes passaram',
      user: {
        id: user.id,
        email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        role: user.role
      },
      tableTest: 'PASSED',
      insertTest: 'PASSED'
    })
    
  } catch (error: any) {
    appLogger.error('api', 'Erro no debug', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno no debug',
      details: error.message,
      errorType: typeof error
    }, { status: 500 })
  }
}
