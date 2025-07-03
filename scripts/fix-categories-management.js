/**
 * Script para corrigir problemas no gerenciamento de categorias
 * Execute: node scripts/fix-categories-management.js
 */

const fs = require('fs')
const path = require('path')

// Correção 1: API de categorias [id]/route.ts
const categoriesIdRouteTs = `import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    // Normalizar resposta
    const category = result.rows[0]
    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    return NextResponse.json({ category: normalizedCategory })
  } catch (error) {
    console.error("Erro ao buscar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, image, active } = body

    // Validar dados
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      )
    }

    const result = await query(
      \`UPDATE categories 
       SET name = $1, 
           description = $2, 
           image = $3, 
           active = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *\`,
      [name, description || '', image || '', active !== undefined ? active : true, params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    // Normalizar resposta para manter consistência
    const category = result.rows[0]
    const normalizedCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      sort_order: category.sort_order || 0,
      active: category.active !== false
    }

    return NextResponse.json(normalizedCategory)
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar se existem produtos usando esta categoria
    const productsCheck = await query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND active = true',
      [params.id]
    )

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir categoria que possui produtos ativos" },
        { status: 400 }
      )
    }

    // Marcar como inativa em vez de excluir fisicamente
    const result = await query(
      'UPDATE categories SET active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Categoria excluída com sucesso",
      success: true 
    })
  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}`

// Função para aplicar as correções
function applyCategoriesFixes() {
  console.log('🔧 Aplicando correções no gerenciamento de categorias...')

  // Backup do arquivo original
  const categoriesIdPath = path.join(__dirname, '../app/api/categories/[id]/route.ts')
  const backupPath = path.join(__dirname, '../app/api/categories/[id]/route.ts.backup')
  
  try {
    if (fs.existsSync(categoriesIdPath)) {
      fs.copyFileSync(categoriesIdPath, backupPath)
      console.log('✅ Backup criado:', backupPath)
    }

    // Aplicar correção na API
    fs.writeFileSync(categoriesIdPath, categoriesIdRouteTs)
    console.log('✅ API de categorias corrigida:', categoriesIdPath)

    console.log('\n📋 Correções aplicadas:')
    console.log('  1. ✅ Normalização de respostas da API')
    console.log('  2. ✅ Correção da exclusão (soft delete)')
    console.log('  3. ✅ Validação melhorada')
    console.log('  4. ✅ Tratamento de campos opcionais')

    console.log('\n🎯 Próximos passos:')
    console.log('  1. Reinicie o servidor: npm run dev')
    console.log('  2. Teste as operações no admin/produtos')
    console.log('  3. Verifique os toast messages')

  } catch (error) {
    console.error('❌ Erro ao aplicar correções:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  applyCategoriesFixes()
}

module.exports = { applyCategoriesFixes } 