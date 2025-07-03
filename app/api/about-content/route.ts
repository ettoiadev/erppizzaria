import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { JwtPayload } from "jsonwebtoken"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface CustomJwtPayload extends JwtPayload {
  role?: string;
}

// GET - Buscar conteúdo da página Sobre
export async function GET() {
  try {
    // First check if table exists and get structure
    const checkTable = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'about_content' 
      AND column_name = 'id'
    `)

    let whereClause = ''
    let queryParams: any[] = []

    if (checkTable.rows.length > 0) {
      const idType = checkTable.rows[0].data_type
      if (idType === 'uuid') {
        // Try to find any record first, then use a default UUID
        const anyRecord = await query('SELECT id FROM about_content LIMIT 1')
        if (anyRecord.rows.length > 0) {
          whereClause = 'WHERE id = $1'
          queryParams = [anyRecord.rows[0].id]
        } else {
          // No records exist, we'll create one
          whereClause = 'WHERE 1=0' // This will return empty result and trigger creation
        }
      } else {
        whereClause = 'WHERE id = 1'
      }
    } else {
      // Table doesn't exist or column doesn't exist, handle gracefully
      return NextResponse.json({ error: "Tabela about_content não encontrada" }, { status: 500 })
    }

    const result = await query(
      `SELECT * FROM about_content ${whereClause}`,
      queryParams
    )

    if (result.rows.length === 0) {
      const defaultContent = {
        hero: {
          title: "Sobre a Pizza Delivery",
          subtitle: "Tradição em sabor desde 2020",
          image: "/placeholder.jpg"
        },
        story: {
          title: "Nossa História",
          content: "A Pizza Delivery nasceu do sonho de levar a melhor pizza artesanal até você...",
          image: "/placeholder.jpg"
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
            image: "/placeholder-user.jpg"
          },
          {
            name: "Maria Oliveira",
            role: "Gerente",
            image: "/placeholder-user.jpg"
          }
        ]
      }

      try {
        const insertResult = await query(
          `
          INSERT INTO about_content 
          (hero, story, values, team)
          VALUES ($1, $2, $3, $4)
          RETURNING *
          `,
          [
            JSON.stringify(defaultContent.hero),
            JSON.stringify(defaultContent.story),
            JSON.stringify(defaultContent.values),
            JSON.stringify(defaultContent.team)
          ]
        )

        return NextResponse.json({ content: insertResult.rows[0] })
      } catch (insertError) {
        // If insert fails, return default content without saving
        return NextResponse.json({ content: { 
          id: 'default',
          hero: defaultContent.hero,
          story: defaultContent.story,
          values: defaultContent.values,
          team: defaultContent.team
        }})
      }
    }

    return NextResponse.json({ content: result.rows[0] })
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

    // Check if any record exists first
    const existing = await query('SELECT id FROM about_content LIMIT 1')
    
    if (existing.rows.length > 0) {
      // Update existing record
      const result = await query(
        `
        UPDATE about_content 
        SET hero = $1,
            story = $2,
            values = $3,
            team = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING *
        `,
        [
          JSON.stringify(hero),
          JSON.stringify(story),
          JSON.stringify(values),
          JSON.stringify(team),
          existing.rows[0].id
        ]
      )
      return NextResponse.json({ content: result.rows[0] })
    } else {
      // Create new record
      const result = await query(
        `
        INSERT INTO about_content 
        (hero, story, values, team)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
          JSON.stringify(hero),
          JSON.stringify(story),
          JSON.stringify(values),
          JSON.stringify(team)
        ]
      )
      return NextResponse.json({ content: result.rows[0] })
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
