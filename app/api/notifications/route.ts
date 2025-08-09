import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// GET - Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'UserId é obrigatório' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Construir query Supabase
    let notificationsQuery = supabase
      .from('notifications')
      .select('id, type, title, message, priority, data, timestamp, read, user_id, room')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      notificationsQuery = notificationsQuery.eq('read', false)
    }

    const { data: notificationsData, error } = await notificationsQuery
    if (error) throw error

    const notifications = (notificationsData || []).map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      data: row.data ? (typeof row.data === 'string' ? JSON.parse(row.data) : row.data) : null,
    }))

    return NextResponse.json({ notifications })

  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      title,
      message,
      priority = 'medium',
      data = null,
      userId,
      room = null,
    } = body

    // Validar campos obrigatórios
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Tipo, título e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    // Inserir notificação
    const { data: notificationData, error } = await supabase
      .from('notifications')
      .insert({
        type,
        title,
        message,
        priority,
        data: data ? JSON.stringify(data) : null,
        user_id: userId,
        room,
        timestamp: new Date().toISOString(),
        read: false
      })
      .select()
      .single()

    if (error) throw error

    const notification = {
      ...notificationData,
      timestamp: new Date(notificationData.timestamp),
      data: notificationData.data ? (typeof notificationData.data === 'string' ? JSON.parse(notificationData.data) : notificationData.data) : null,
    }

    return NextResponse.json({
      message: 'Notificação criada com sucesso',
      notification,
    })

  } catch (error: any) {
    console.error('Erro ao criar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Limpar notificações antigas
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { daysOld = 30 } = body

    const supabase = getSupabaseServerClient()

    // Calcular data limite
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Deletar notificações mais antigas que o número de dias especificado
    const { data: deletedNotifications, error } = await supabase
      .from('notifications')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select('id')

    if (error) throw error

    const deletedCount = deletedNotifications?.length || 0

    return NextResponse.json({
      message: `${deletedCount} notificações antigas removidas`,
      deletedCount,
    })

  } catch (error: any) {
    console.error('Erro ao limpar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 