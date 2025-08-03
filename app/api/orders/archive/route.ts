import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import { verifyAdmin } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

    const { status } = await request.json()
    
    if (!status || !['DELIVERED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Apenas DELIVERED e CANCELLED podem ser arquivados.' },
        { status: 400 }
      )
    }

    console.log(`Arquivando pedidos com status: ${status}`)

    // Arquivar todos os pedidos do status especificado que não estão arquivados
    const result = await query(`
      UPDATE orders 
      SET archived_at = NOW(), updated_at = NOW()
      WHERE status = $1 AND archived_at IS NULL
      RETURNING id, status, archived_at
    `, [status])

    console.log(`${result.rows.length} pedidos arquivados com sucesso`)

    return NextResponse.json({
      success: true,
      message: `${result.rows.length} pedidos arquivados com sucesso`,
      archivedCount: result.rows.length,
      archivedOrders: result.rows
    })

  } catch (error: any) {
    console.error('Erro ao arquivar pedidos:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
