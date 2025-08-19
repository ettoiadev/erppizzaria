import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
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

    const supabase = getSupabaseServerClient()

    // Marcar notificação como lida
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select('id, read, updated_at')
      .single()

    if (error || !notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

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