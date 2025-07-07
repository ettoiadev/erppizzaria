import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"
import { verifyToken } from "@/lib/auth"
import { JwtPayload } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret"

interface DecodedToken {
  id: string
  email: string
  role: string
}

interface CustomJwtPayload extends JwtPayload {
  role?: string;
}

async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken
    if (!decoded || typeof decoded === 'string' || decoded.role !== "admin") {
      return null
    }
    return decoded
  } catch (error) {
    return null
  }
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET - Fetch admin settings
export async function GET(request: Request) {
  try {
    console.log("[ADMIN_SETTINGS] Iniciando verificação de autenticação")
    
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.log("[ADMIN_SETTINGS] Token não fornecido")
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    // Extrair token do header "Bearer <token>"
    const token = authHeader.split(" ")[1]
    if (!token) {
      console.log("[ADMIN_SETTINGS] Formato de token inválido")
      return NextResponse.json({ error: "Formato de token inválido" }, { status: 401 })
    }

    console.log("[ADMIN_SETTINGS] Verificando token...")
    const decoded = await verifyToken(token) as CustomJwtPayload
    if (!decoded || typeof decoded === 'string' || decoded.role !== "admin") {
      console.log("[ADMIN_SETTINGS] Token inválido ou usuário não é admin")
      return NextResponse.json({ error: "Não autorizado - acesso apenas para administradores" }, { status: 401 })
    }

    console.log(`[ADMIN_SETTINGS] Acesso autorizado para admin: ${decoded.email}`)

    // Buscar configurações usando Supabase
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .order('setting_key')

    if (error) {
      console.log("[ADMIN_SETTINGS] Erro ao buscar configurações ou tabela não existe:", error.message)
      return NextResponse.json({ settings: {} })
    }

    const settings: Record<string, any> = {}
    data?.forEach((row: any) => {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value)
      } catch {
        settings[row.setting_key] = row.setting_value
      }
    })

    console.log(`[ADMIN_SETTINGS] Retornando ${Object.keys(settings).length} configurações`)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[ADMIN_SETTINGS] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Update admin settings
export async function POST(request: Request) {
  try {
    console.log("[ADMIN_SETTINGS] Iniciando atualização de configurações")
    
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.log("[ADMIN_SETTINGS] Token não fornecido para atualização")
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    // Extrair token do header "Bearer <token>"
    const token = authHeader.split(" ")[1]
    if (!token) {
      console.log("[ADMIN_SETTINGS] Formato de token inválido para atualização")
      return NextResponse.json({ error: "Formato de token inválido" }, { status: 401 })
    }

    console.log("[ADMIN_SETTINGS] Verificando token para atualização...")
    const decoded = await verifyToken(token) as CustomJwtPayload
    if (!decoded || typeof decoded === 'string' || decoded.role !== "admin") {
      console.log("[ADMIN_SETTINGS] Token inválido ou usuário não é admin para atualização")
      return NextResponse.json({ error: "Não autorizado - acesso apenas para administradores" }, { status: 401 })
    }

    console.log(`[ADMIN_SETTINGS] Atualização autorizada para admin: ${decoded.email}`)

    const settings = await request.json()
    console.log(`[ADMIN_SETTINGS] Atualizando ${Object.keys(settings).length} configurações`)

    // Salvar configurações usando Supabase upsert
    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: key,
          setting_value: stringValue
        })

      if (error) {
        console.error(`[ADMIN_SETTINGS] Erro ao salvar configuração ${key}:`, error.message)
        return NextResponse.json({ error: `Erro ao salvar configuração ${key}` }, { status: 500 })
      }
    }

    console.log("[ADMIN_SETTINGS] Configurações salvas com sucesso")
    return NextResponse.json({ message: "Configurações salvas com sucesso" })
  } catch (error) {
    console.error("[ADMIN_SETTINGS] Erro ao salvar configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
