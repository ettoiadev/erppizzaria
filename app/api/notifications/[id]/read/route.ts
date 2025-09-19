import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgresql'
import { frontendLogger } from '@/lib/frontend-logger'

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
    const notificationRows = await query(
      'UPDATE notifications SET read = $1, updated_at = $2 WHERE id = $3 RETURNING id, read, updated_at',
      [true, new Date().toISOString(), notificationId]
    )

    if (notificationRows.rows.length === 0) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

    const notification = notificationRows.rows[0]

    return NextResponse.json({
      message: 'Notificação marcada como lida',
      notification: {
        id: notification.id,
        read: notification.read,
        updatedAt: notification.updated_at,
      },
    })

  } catch (error: any) {
    frontendLogger.logError('Erro ao marcar notificação como lida', 'api', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}