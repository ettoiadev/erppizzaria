import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'

// PATCH - Marcar notificação como lida
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id

    if (!notificationId) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
    }

    // Marcar notificação como lida
    const result = await query(`
      UPDATE notifications 
      SET read = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id, read, updated_at
    `, [notificationId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Notificação marcada como lida',
      notification: {
        id: result.rows[0].id,
        read: result.rows[0].read,
        updatedAt: result.rows[0].updated_at,
      },
    })

  } catch (error: any) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 