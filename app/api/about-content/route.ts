import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"
import { JwtPayload } from "jsonwebtoken"
import { frontendLogger } from '@/lib/frontend-logger'

// Configuração de runtime para suporte ao módulo jsonwebtoken
export const runtime = 'nodejs'
// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface CustomJwtPayload extends JwtPayload {
  role?: string;
}

// GET - Buscar conteúdo da página Sobre
export async function GET() {
  try {
    const rows = await query('SELECT * FROM about_content LIMIT 1')

    if (!rows || rows.rows.length === 0) {
      const defaultContent = {
        hero: {
          title: "Sobre a Pizza Delivery",
          subtitle: "Tradição em sabor desde 2020",
          image: "/default-image.svg"
        },
        story: {
          title: "Nossa História",
          content: "A Pizza Delivery nasceu do sonho de levar a melhor pizza artesanal até você...",
          image: "/default-image.svg"
        },
        values: [
          {
            title: "Qualidade",
            description: "Ingredientes selecionados e processos rigorosos de qualidade",
            icon: "🌟"
          },
          {
            title: "Rapidez",
            description: "Entrega rápida e eficiente para sua pizza chegar quentinha",
            icon: "⚡"
          },
          {
            title: "Atendimento",
            description: "Equipe treinada para oferecer o melhor atendimento",
            icon: "💝"
          }
        ],
        team: [
          {
            name: "João Silva",
            role: "Chef de Cozinha",
            image: "/default-image.svg"
          },
          {
            name: "Maria Oliveira",
            role: "Gerente",
            image: "/default-image.svg"
          }
        ]
      }

      // Return default content without trying to insert during build
      return NextResponse.json({ content: { 
        id: 'default',
        hero: defaultContent.hero,
        story: defaultContent.story,
        values: defaultContent.values,
        team: defaultContent.team
      }})
    }

    return NextResponse.json({ content: rows.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar conteúdo da página Sobre
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = await verifyToken(authHeader) as CustomJwtPayload
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { hero, story, values, team } = body

    if (!hero || !story || !values || !team) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    if (!hero.title || !hero.subtitle || !story.title || !story.content) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando em hero ou story" },
        { status: 400 }
      )
    }

    if (!Array.isArray(values) || values.length === 0) {
      return NextResponse.json(
        { error: "Valores devem ser um array não vazio" },
        { status: 400 }
      )
    }

    if (!Array.isArray(team) || team.length === 0) {
      return NextResponse.json(
        { error: "Equipe deve ser um array não vazio" },
        { status: 400 }
      )
    }

    try {
      // Try to get existing record
      const existing = await query('SELECT id FROM about_content LIMIT 1')
      
      if (existing && existing.rows.length > 0) {
        // Update existing record
        const updated = await query(
          'UPDATE about_content SET hero = $1, story = $2, values = $3, team = $4, updated_at = $5 WHERE id = $6 RETURNING *',
          [JSON.stringify(hero), JSON.stringify(story), JSON.stringify(values), JSON.stringify(team), new Date().toISOString(), existing.rows[0].id]
        )
        
        return NextResponse.json({ content: updated.rows[0] })
      } else {
        // Create new record
        const created = await query(
          'INSERT INTO about_content (hero, story, values, team) VALUES ($1, $2, $3, $4) RETURNING *',
          [JSON.stringify(hero), JSON.stringify(story), JSON.stringify(values), JSON.stringify(team)]
        )
        
        return NextResponse.json({ content: created.rows[0] })
      }
    } catch (dbError) {
      frontendLogger.logError('Erro no banco de dados ao atualizar conteúdo sobre', {
        error: (dbError as any)?.message,
        stack: (dbError as any)?.stack
      })
      throw dbError
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
