import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { verifyToken } from "@/lib/auth"
import { JwtPayload } from "jsonwebtoken"
import { frontendLogger } from '@/lib/frontend-logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface CustomJwtPayload extends JwtPayload {
  role?: string;
}

// GET - Buscar conteúdo da página Sobre
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()
    const { data: rows, error } = await supabase
      .from('about_content')
      .select('*')
      .limit(1)
    
    if (error) {
      frontendLogger.logError('Erro ao buscar conteúdo sobre', {
        error: error.message,
        stack: error.stack
      }, error, 'api')
    }

    if (!rows || rows.length === 0) {
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

      // Return default content without trying to insert during build
      return NextResponse.json({ content: { 
        id: 'default',
        hero: defaultContent.hero,
        story: defaultContent.story,
        values: defaultContent.values,
        team: defaultContent.team
      }})
    }

    return NextResponse.json({ content: rows[0] })
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

    const supabase = getSupabaseServerClient()
    
    try {
      // Try to get existing record
      const { data: existing } = await supabase
        .from('about_content')
        .select('id')
        .limit(1)
      
      if (existing && existing.length > 0) {
        // Update existing record
        const { data: updated, error: updErr } = await supabase
          .from('about_content')
          .update({ hero, story, values, team, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id)
          .select('*')
          .single()
        
        if (updErr) throw updErr
        return NextResponse.json({ content: updated })
      } else {
        // Create new record
        const { data: created, error: insErr } = await supabase
          .from('about_content')
          .insert({ hero, story, values, team })
          .select('*')
          .single()
        
        if (insErr) throw insErr
        return NextResponse.json({ content: created })
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
