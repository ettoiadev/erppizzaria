import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { verifyAdmin } from "@/lib/auth"
import bcrypt from "bcryptjs"

// Force dynamic rendering for this route  
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const userResult = await query(
      'SELECT password_hash FROM profiles WHERE id = $1',
      [admin.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const user = userResult.rows[0]
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    await query(
      'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, admin.id]
    )

    return NextResponse.json({ message: "Senha atualizada com sucesso" })
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
