import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    console.log('[TEST_DELETE_CLIENTS] Iniciando teste...')

    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    console.log('[TEST_DELETE_CLIENTS] Token recebido:', token ? 'SIM' : 'NÃO')
    
    if (!token) {
      console.log('[TEST_DELETE_CLIENTS] Token de autorização não fornecido')
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    console.log('[TEST_DELETE_CLIENTS] Verificando admin...')
    const admin = await verifyAdmin(token)
    
    if (!admin) {
      console.log('[TEST_DELETE_CLIENTS] Usuário não é admin')
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

    console.log('[TEST_DELETE_CLIENTS] Admin verificado:', admin.email)

    // Teste simples - apenas contar clientes
    console.log('[TEST_DELETE_CLIENTS] Contando clientes...')
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')
    if (error) throw error
    const totalClients = (data as any)?.length || 0

    console.log(`[TEST_DELETE_CLIENTS] Encontrados ${totalClients} clientes`)

    return NextResponse.json({ 
      success: true,
      message: `Teste concluído. Encontrados ${totalClients} clientes.`,
      totalClients
    })

  } catch (error: any) {
    console.error('[TEST_DELETE_CLIENTS] Erro:', error)
    return NextResponse.json({ 
      error: 'Erro no teste',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 