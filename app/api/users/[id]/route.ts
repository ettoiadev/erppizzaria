import { NextResponse } from "next/server"
import { query } from '@/lib/db'
import { frontendLogger } from '@/lib/frontend-logger'

// GET - Buscar dados de um usuário específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Busca de usuário por ID', 'api', { userId: params.id })

    const userResult = await query(
      'SELECT id, email, full_name, phone, role FROM profiles WHERE id = $1',
      [params.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const user = userResult.rows[0]

    const userData = user
    frontendLogger.info('Dados do usuário encontrados', 'api', {
      userId: user.id,
      userEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

    return NextResponse.json({ 
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.full_name,
        full_name: userData.full_name,
        phone: userData.phone,
        role: userData.role
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro ao buscar usuário', {
      userId: params.id,
      errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar dados de um usuário
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    frontendLogger.info('Atualização de usuário por ID', 'api', { userId: params.id })

    const body = await request.json()
    const { name, email, phone } = body

    // Validações obrigatórias
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (name.trim().length < 2) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres" }, { status: 400 })
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 })
    }
    const phoneNumbers = phone.replace(/\D/g, "")
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return NextResponse.json({ error: "Telefone deve ter 10 ou 11 dígitos" }, { status: 400 })
    }

    // Limpar telefone para salvar apenas números no banco
    const cleanPhone = phone.replace(/\D/g, "")
    
    frontendLogger.info('Dados a serem atualizados', 'api', {
      userId: params.id,
      name,
      email: email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
      hasPhone: !!phone
    })

    const existingResult = await query(
      'SELECT id FROM profiles WHERE id = $1',
      [params.id]
    )

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const updatedResult = await query(
      'UPDATE profiles SET full_name = $1, email = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, full_name, phone',
      [name.trim(), email, cleanPhone, params.id]
    )
    const updated = updatedResult.rows[0]

    frontendLogger.info('Usuário atualizado com sucesso', 'api', {
      userId: params.id,
      updatedName: updated.full_name,
      updatedEmail: updated.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

    return NextResponse.json({ 
      message: "Dados atualizados com sucesso",
      user: {
        id: params.id,
        name: updated.full_name,
        email: updated.email,
        phone: updated.phone
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    frontendLogger.logError('Erro ao atualizar usuário', {
      userId: params.id,
      errorMessage,
      stack: errorStack
    }, error instanceof Error ? error : undefined, 'api')
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}