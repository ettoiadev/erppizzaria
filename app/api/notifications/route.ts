import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import { withValidation } from '@/lib/validation-middleware'
import { withDatabaseErrorHandling } from '@/lib/database-error-handler'
import { withPresetRateLimit } from '@/lib/rate-limit-middleware'
import { withPresetSanitization } from '@/lib/sanitization-middleware'
import { withErrorMonitoring } from '@/lib/error-monitoring'
import { withApiLogging } from '@/lib/api-logger-middleware'
import { notificationSchema } from '@/lib/validation-schemas'

// Handler GET para buscar notificações do usuário (sem middlewares)
async function getNotificationsHandler(request: NextRequest): Promise<NextResponse> {
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
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler POST para criar nova notificação (sem middlewares)
async function createNotificationHandler(
  request: NextRequest,
  validatedData: any
): Promise<NextResponse> {
  try {
    const {
      type,
      title,
      message,
      priority = 'medium',
      data = null,
      userId,
      room = null,
    } = validatedData

    // Dados já validados pelos middlewares

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
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Handler DELETE para limpar notificações antigas (sem middlewares)
async function deleteNotificationsHandler(
  request: NextRequest,
  validatedData: any
): Promise<NextResponse> {
  try {
    const { daysOld = 30 } = validatedData

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
    // O middleware de database error handling vai capturar e tratar este erro
    throw error
  }
}

// Aplicar middlewares para GET
export const GET = withErrorMonitoring(
  withApiLogging(
    withDatabaseErrorHandling(
      getNotificationsHandler
    )
  )
)

// Aplicar middlewares para POST
export const POST = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('orders')(
      withPresetSanitization('userForm')(
        withValidation(notificationSchema)(
          withDatabaseErrorHandling(
            createNotificationHandler,
            {
              uniqueViolation: 'Notificação duplicada',
              foreignKeyViolation: 'Referência inválida nos dados da notificação'
            }
          )
        )
      )
    )
  )
)

// Aplicar middlewares para DELETE
export const DELETE = withErrorMonitoring(
  withApiLogging(
    withPresetRateLimit('orders')(
      withPresetSanitization('userForm')(
        withDatabaseErrorHandling(
          deleteNotificationsHandler
        )
      )
    )
  )
)