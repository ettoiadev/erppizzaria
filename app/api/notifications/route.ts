import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { withValidation } from '@/lib/validation-utils'
import { withDatabaseErrorHandling } from '@/lib/error-handler'
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

    // Construir query PostgreSQL
    let sqlQuery = `
      SELECT id, type, title, message, priority, data, timestamp, read, user_id, room
      FROM notifications 
      WHERE user_id = $1
    `
    const queryParams = [userId]
    
    if (unreadOnly) {
      sqlQuery += ' AND read = false'
    }
    
    sqlQuery += ' ORDER BY timestamp DESC LIMIT $2'
    queryParams.push(limit.toString())

    const notificationsResult = await query(sqlQuery, queryParams)
    const notificationsData = notificationsResult.rows

    const notifications = (notificationsData || []).map((row: any) => ({
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

    // Inserir notificação usando PostgreSQL
    const insertResult = await query(
      `INSERT INTO notifications (type, title, message, priority, data, user_id, room, timestamp, read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, type, title, message, priority, data, user_id, room, timestamp, read`,
      [
        type,
        title,
        message,
        priority,
        data ? JSON.stringify(data) : null,
        userId,
        room,
        new Date().toISOString(),
        false
      ]
    )
    
    const notificationData = insertResult.rows[0]

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

    // Calcular data limite
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Deletar notificações mais antigas que o número de dias especificado usando PostgreSQL
    const deleteResult = await query(
      'DELETE FROM notifications WHERE timestamp < $1 RETURNING id',
      [cutoffDate.toISOString()]
    )
    
    const deletedNotifications = deleteResult.rows

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
    withPresetRateLimit('public', {},
      withPresetSanitization('userForm', {},
        withValidation(notificationSchema,
          withDatabaseErrorHandling(
            createNotificationHandler,
            {
              customErrorMessages: {
                unique_violation: 'Notificação duplicada',
                foreign_key_violation: 'Referência inválida nos dados da notificação'
              }
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
    withPresetRateLimit('public', {},
      withPresetSanitization('userForm', {},
        withDatabaseErrorHandling(
          deleteNotificationsHandler
        )
      )
    )
  )
)