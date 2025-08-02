import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('[EXPORT_PRODUCTS] Iniciando exportação de produtos...')

    // Buscar todos os produtos com suas categorias
    const productsResult = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image,
        p.available,
        p.created_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `)

    const products = productsResult.rows.map(product => ({
      ID: product.id || '',
      Nome: product.name || '',
      Descrição: product.description || '',
      'Preço (R$)': product.price ? parseFloat(product.price).toFixed(2) : '0.00',
      Categoria: product.category_name || '',
      Imagem: product.image || '',
      Disponível: product.available ? 'Sim' : 'Não',
      'Data Cadastro': product.created_at ? new Date(product.created_at).toLocaleDateString('pt-BR') : ''
    }))

    console.log(`[EXPORT_PRODUCTS] ${products.length} produtos encontrados para exportação`)

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(products)

    // Configurar largura das colunas
    const colWidths = [
      { wch: 20 }, // ID
      { wch: 30 }, // Nome
      { wch: 50 }, // Descrição
      { wch: 12 }, // Preço
      { wch: 20 }, // Categoria
      { wch: 40 }, // Imagem
      { wch: 12 }, // Disponível
      { wch: 12 }  // Data Cadastro
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Produtos')

    // Converter para buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    
    console.log('[EXPORT_PRODUCTS] Arquivo Excel de produtos gerado com sucesso')

    // Retornar arquivo
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="produtos_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })

  } catch (error) {
    console.error('[EXPORT_PRODUCTS] Erro ao exportar produtos:', error)
    return NextResponse.json({ 
      error: 'Erro ao exportar produtos para Excel' 
    }, { status: 500 })
  }
}