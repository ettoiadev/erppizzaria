import { NextResponse, type NextRequest } from "next/server"
import { createUser } from "@/lib/auth"
import { saveCustomerAddress } from "@/lib/db-postgres"

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, address } = await request.json()

    // Validate input
    if (!email?.trim() || !password || !full_name?.trim()) {
      return NextResponse.json({ error: "Email, senha e nome completo são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Validate phone if provided
    if (phone) {
      const phoneNumbers = phone.replace(/\D/g, "")
      if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        return NextResponse.json({ error: "Telefone deve ter 10 ou 11 dígitos" }, { status: 400 })
      }
    }

    // Create user
    const user = await createUser({
      email: email.trim(),
      password,
      full_name: full_name.trim(),
      phone: phone ? phone.replace(/\D/g, "") : undefined,
      role: 'customer'
    })

    if (!user) {
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    // Save address if provided
    if (address && user.id) {
      try {
        await saveCustomerAddress(user.id, address)
      } catch (addressError) {
        console.error("Erro ao salvar endereço:", addressError)
        // Não falhar o registro se o endereço falhar
      }
    }

    // Return success response
    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error("Registration error:", error)
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: "Este email já está em uso" }, { status: 400 })
    }
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
