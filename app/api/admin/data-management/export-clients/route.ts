import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('[EXPORT_CLIENTS] Iniciando exportação de clientes...')

    // Buscar todos os clientes com seus endereços
    const clientsResult = await query(`
      SELECT 
        p.id,
        p.full_name as nome,
        p.email,
        p.phone as telefone,
        p.customer_code,
        ca.street as rua,
        ca.number as numero,
        ca.neighborhood as bairro,
        ca.city as cidade,
        ca.state as estado,
        ca.zip_code as cep,
        ca.complement as complemento,
        p.created_at
      FROM profiles p
      LEFT JOIN customer_addresses ca ON p.id = ca.user_id AND ca.is_default = true
      WHERE p.role = 'customer'
      ORDER BY p.created_at DESC
    `)

    const clients = clientsResult.rows.map(client => ({
      ID: client.id || '',
      'Código Cliente': client.customer_code || '',
      Nome: client.nome || '',
      Email: client.email || '',
      Telefone: client.telefone || '',
      Rua: client.rua || '',
      Número: client.numero || '',
      Bairro: client.bairro || '',
      Cidade: client.cidade || '',
      Estado: client.estado || '',
      CEP: client.cep || '',
      Complemento: client.complemento || '',
      'Data Cadastro': client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : ''
    }))

    console.log(`[EXPORT_CLIENTS] ${clients.length} clientes encontrados para exportação`)

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
    
    console.log('[EXPORT_CLIENTS] Arquivo Excel gerado com sucesso')

    // Retornar arquivo
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="clientes_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })

  } catch (error) {
    console.error('[EXPORT_CLIENTS] Erro ao exportar clientes:', error)
    return NextResponse.json({ 
      error: 'Erro ao exportar clientes para Excel' 
    }, { status: 500 })
  }
}