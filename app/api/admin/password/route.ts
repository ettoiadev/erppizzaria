import { NextResponse, type NextRequest } from "next/server"
import { verifyAdmin } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase"
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

    const supabase = getSupabaseServerClient()
    const { data: user, error } = await supabase
      .from('profiles')
      .select('password_hash')
      .eq('id', admin.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (error) throw error

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash || '')

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    // Gerar nova senha hasheada
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
      .eq('id', admin.id)
      .eq('role', 'admin')
    if (updErr) throw updErr

    {
      return NextResponse.json({ error: "Erro ao atualizar senha" }, { status: 500 })
    }

    return NextResponse.json({ message: "Senha atualizada com sucesso" })
  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}