import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import * as XLSX from 'xlsx'
import { frontendLogger } from '@/lib/frontend-logger'

export async function GET(request: NextRequest) {
  try {
    frontendLogger.info('Exportação de clientes iniciada', 'api')

    // Buscar todos os clientes com seus endereços
    const clientsResult = await query(`
      SELECT 
        p.id, p.full_name, p.email, p.phone, p.customer_code, p.created_at,
        ca.street, ca.number, ca.neighborhood, ca.city, ca.state, ca.zip_code, ca.complement
      FROM profiles p
      LEFT JOIN customer_addresses ca ON p.id = ca.customer_id
      WHERE p.role = 'customer'
      ORDER BY p.created_at DESC
    `)

    const clients = clientsResult.rows.map((client: any) => ({
      ID: client.id || '',
      'Código Cliente': client.customer_code || '',
      Nome: client.full_name || '',
      Email: client.email || '',
      Telefone: client.phone || '',
      Rua: client.street || '',
      Número: client.number || '',
      Bairro: client.neighborhood || '',
      Cidade: client.city || '',
      Estado: client.state || '',
      CEP: client.zip_code || '',
      Complemento: client.complement || '',
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

  } catch (error: any) {
    frontendLogger.logError('Erro ao exportar clientes para Excel', {
      error: error.message
    }, error, 'api')
    return NextResponse.json({ 
      error: 'Erro ao exportar clientes para Excel' 
    }, { status: 500 })
  }
}