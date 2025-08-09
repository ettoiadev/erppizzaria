import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('[EXPORT_PRODUCTS] Iniciando exportação de produtos...')

    // Buscar todos os produtos com suas categorias
    const supabase = getSupabaseServerClient()
    const { data: productsRows, error } = await supabase
      .from('products')
      .select('id, name, description, price, image_url, available, created_at, categories:category_id(name)')
      .order('created_at', { ascending: false })
    if (error) throw error

    const products = (productsRows || []).map((product: any) => ({
      ID: product.id || '',
      Nome: product.name || '',
      Descrição: product.description || '',
      'Preço (R$)': product.price ? parseFloat(product.price).toFixed(2) : '0.00',
      Categoria: product.categories?.name || '',
      Imagem: product.image_url || '',
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