import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { frontendLogger } from '@/lib/frontend-logger'

export async function GET(request: NextRequest) {
  try {
    frontendLogger.info('Exportação de clientes iniciada', 'api')

    // Buscar todos os clientes com seus endereços
    const supabase = getSupabaseServerClient()
    const { data: clientsRows, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, customer_code, created_at, customer_addresses!left(*)')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
    if (error) throw error

    const clients = (clientsRows || []).map((client: any) => ({
      ID: client.id || '',
      'Código Cliente': client.customer_code || '',
      Nome: client.full_name || '',
      Email: client.email || '',
      Telefone: client.phone || '',
      Rua: client.customer_addresses?.[0]?.street || '',
      Número: client.customer_addresses?.[0]?.number || '',
      Bairro: client.customer_addresses?.[0]?.neighborhood || '',
      Cidade: client.customer_addresses?.[0]?.city || '',
      Estado: client.customer_addresses?.[0]?.state || '',
      CEP: client.customer_addresses?.[0]?.zip_code || '',
      Complemento: client.customer_addresses?.[0]?.complement || '',
      'Data Cadastro': client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : ''
    }))

    frontendLogger.info('Clientes encontrados para exportação', 'api', {
      count: clients.length
    })

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(clients)

    // Configurar largura das colunas
    const colWidths = [
      { wch: 20 }, // ID
      { wch: 15 }, // Código Cliente
      { wch: 25 }, // Nome
      { wch: 30 }, // Email
      { wch: 15 }, // Telefone
      { wch: 30 }, // Rua
      { wch: 8 },  // Número
      { wch: 20 }, // Bairro
      { wch: 20 }, // Cidade
      { wch: 5 },  // Estado
      { wch: 12 }, // CEP
      { wch: 25 }, // Complemento
      { wch: 12 }  // Data Cadastro
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')

    // Converter para buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    
    frontendLogger.info('Arquivo Excel de clientes gerado com sucesso', 'api')

    // Retornar arquivo
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="clientes_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })

  } catch (error) {
    frontendLogger.error('Erro ao exportar clientes para Excel', 'api', {
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: 'Erro ao exportar clientes para Excel' 
    }, { status: 500 })
  }
}