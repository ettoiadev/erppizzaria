import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { frontendLogger } from '@/lib/frontend-logger'

// Lazy load XLSX para reduzir bundle inicial
const loadXLSX = async () => {
  const XLSX = await import('xlsx')
  return XLSX
}

export async function POST(request: NextRequest) {
  try {
    frontendLogger.info('Iniciando importação de clientes', 'api')

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validar tipo do arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo inválido. Use .xlsx, .xls ou .csv' 
      }, { status: 400 })
    }

    // Carregar XLSX dinamicamente
    const XLSX = await loadXLSX()
    
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    frontendLogger.info('Registros encontrados no arquivo', 'api', {
      totalRecords: data.length,
      fileName: file.name
    })

    let successCount = 0
    const errors: string[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // +2 porque começa na linha 2 (linha 1 é cabeçalho)

      try {
        // Validar campos obrigatórios
        if (!row.Nome || !row.Email) {
          errors.push(`Linha ${rowNum}: Nome e Email são obrigatórios`)
          continue
        }

        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(row.Email)) {
          errors.push(`Linha ${rowNum}: Email inválido`)
          continue
        }

        // Verificar se o email já existe
        const existingUserResult = await query(
          'SELECT id FROM profiles WHERE email = $1',
          [row.Email]
        )
        
        if (existingUserResult.rows.length > 0) {
          const userId = existingUserResult.rows[0].id

          await query(
            'UPDATE profiles SET full_name = $1, phone = $2, updated_at = NOW() WHERE id = $3',
            [row.Nome, row.Telefone || null, userId]
          )

          // Atualizar ou inserir endereço se fornecido
          if (row.Rua && row.Cidade) {
            await query(`
              INSERT INTO customer_addresses (
                user_id, street, number, neighborhood, city, state, zip_code, complement, is_default, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
              ON CONFLICT (user_id, street, number, neighborhood, city, state)
              DO UPDATE SET
                zip_code = EXCLUDED.zip_code,
                complement = EXCLUDED.complement,
                updated_at = NOW()
            `, [
              userId,
              row.Rua,
              row.Número || '',
              row.Bairro || '',
              row.Cidade,
              row.Estado || 'SP',
              row.CEP || '',
              row.Complemento || ''
            ])
          }

        } else {
          // Criar novo cliente
          const newUserResult = await query(
            'INSERT INTO profiles (full_name, email, phone, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
            [row.Nome, row.Email, row.Telefone || null, 'customer']
          )
          const userId = newUserResult.rows[0].id

          // Inserir endereço se fornecido
          if (row.Rua && row.Cidade) {
            await query(`
              INSERT INTO customer_addresses (
                user_id, street, number, neighborhood, city, state, zip_code, complement, is_default, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
            `, [
              userId,
              row.Rua,
              row.Número || '',
              row.Bairro || '',
              row.Cidade,
              row.Estado || 'SP',
              row.CEP || '',
              row.Complemento || ''
            ])
          }
        }

        successCount++

      } catch (error: any) {
        frontendLogger.logError('Erro ao processar linha na importação', {
          rowNumber: rowNum,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }, error instanceof Error ? error : new Error(String(error)), 'api')
        errors.push(`Linha ${rowNum}: Erro ao processar dados - ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }

    frontendLogger.info('Importação de clientes concluída', 'api', {
      successCount,
      errorCount: errors.length,
      fileName: file.name
    })
    
    return NextResponse.json({ 
      success: successCount, 
      errors,
      message: `${successCount} clientes importados com sucesso${errors.length > 0 ? `. ${errors.length} erros encontrados.` : '.'}`
    })

  } catch (error: any) {
    frontendLogger.logError('Erro geral na importação de clientes', {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, error instanceof Error ? error : new Error(String(error)), 'api')
    return NextResponse.json({ 
      error: 'Erro ao processar arquivo de importação' 
    }, { status: 500 })
  }
}