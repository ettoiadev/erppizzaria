import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { verifyAdmin } from "@/lib/auth"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    // Verify admin access
    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Get admin profile
    const result = await query(
      'SELECT id, email, full_name, phone, created_at, updated_at FROM profiles WHERE id = $1',
      [admin.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const profile = result.rows[0]
    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching admin profile:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    // Verify admin access
    const admin = await verifyAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { full_name, phone } = await request.json()

    // Update profile
    const result = await query(
      'UPDATE profiles SET full_name = $1, phone = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, full_name, phone, created_at, updated_at',
      [full_name, phone, admin.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const updatedProfile = result.rows[0]
    return NextResponse.json({ 
      message: "Perfil atualizado com sucesso",
      profile: updatedProfile 
    })
  } catch (error) {
    console.error("Error updating admin profile:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
