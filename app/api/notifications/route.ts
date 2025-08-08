import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
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

    // Construir query base
    let whereConditions = [`user_id = $1`]
    let params = [userId]
    let paramIndex = 2

    if (unreadOnly) {
      whereConditions.push(`read = false`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const notificationsResult = await query(`
      SELECT 
        id, type, title, message, priority, data, timestamp, read, user_id, room
      FROM notifications 
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex}
    `, params)

    const notifications = notificationsResult.rows.map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      data: row.data ? JSON.parse(row.data) : null,
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

    // Inserir notificação
    const result = await query(`
      INSERT INTO notifications (
        type, title, message, priority, data, user_id, room, timestamp, read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), false)
      RETURNING *
    `, [
      type,
      title,
      message,
      priority,
      data ? JSON.stringify(data) : null,
      userId,
      room,
    ])

    const notification = {
      ...result.rows[0],
      timestamp: new Date(result.rows[0].timestamp),
      data: result.rows[0].data ? JSON.parse(result.rows[0].data) : null,
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

    // Deletar notificações mais antigas que o número de dias especificado
    const result = await query(`
      DELETE FROM notifications 
      WHERE timestamp < NOW() - INTERVAL '${daysOld} days'
      RETURNING id
    `)

    return NextResponse.json({
      message: `${result.rowCount} notificações antigas removidas`,
      deletedCount: result.rowCount,
    })

  } catch (error: any) {
    console.error('Erro ao limpar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 