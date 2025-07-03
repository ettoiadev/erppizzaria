import { NextResponse, type NextRequest } from "next/server"
import { createUser } from "@/lib/auth"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, password } = await request.json()

    // Validate input
    if (!full_name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Check if admin registration is allowed (default to true if setting doesn't exist)
    let allowRegistration = true
    try {
      const settingResult = await query(
        "SELECT setting_value FROM admin_settings WHERE setting_key = 'allowAdminRegistration'"
      )
      
      if (settingResult.rows.length > 0) {
        const value = settingResult.rows[0].setting_value
        allowRegistration = value === "true" || value === true
      }
    } catch (error) {
      console.log("Admin settings table not found or accessible, allowing registration by default")
      allowRegistration = true
    }

    if (!allowRegistration) {
      return NextResponse.json(
        {
          error: "O cadastro de administradores está desabilitado. Entre em contato com um administrador existente.",
        },
        { status: 403 }
      )
    }

    // Check if email already exists
    const existingUser = await query(
      "SELECT id FROM auth.users WHERE email = $1",
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 })
    }

    // Create user with admin role
    const user = await createUser({
      email,
      password,
      full_name,
      role: "admin"
    })

    console.log("Admin user created successfully:", user.id)

    return NextResponse.json({
      message: "Administrador criado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    })
  } catch (error) {
    console.error("Admin registration API error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
