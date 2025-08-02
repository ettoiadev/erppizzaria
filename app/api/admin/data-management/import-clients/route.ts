import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgres'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    console.log('[IMPORT_CLIENTS] Iniciando importação de clientes...')

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

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    console.log(`[IMPORT_CLIENTS] ${data.length} registros encontrados no arquivo`)

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
        const existingUser = await query('SELECT id FROM profiles WHERE email = $1', [row.Email])
        
        if (existingUser.rows.length > 0) {
          // Atualizar cliente existente
          const userId = existingUser.rows[0].id

          await query(`
            UPDATE profiles 
            SET full_name = $1, phone = $2, updated_at = NOW()
            WHERE id = $3
          `, [row.Nome, row.Telefone || null, userId])

          // Atualizar ou inserir endereço se fornecido
          if (row.Rua && row.Cidade) {
            await query(`
              INSERT INTO customer_addresses (
                user_id, street, number, neighborhood, city, state, zip_code, complement, is_default
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
              ON CONFLICT (user_id, street, number, neighborhood, city, state)
              DO UPDATE SET
                zip_code = EXCLUDED.zip_code,
                complement = EXCLUDED.complement,
                is_default = EXCLUDED.is_default,
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
          const newUserResult = await query(`
            INSERT INTO profiles (full_name, email, phone, role, created_at, updated_at)
            VALUES ($1, $2, $3, 'customer', NOW(), NOW())
            RETURNING id
          `, [row.Nome, row.Email, row.Telefone || null])

          const userId = newUserResult.rows[0].id

          // Inserir endereço se fornecido
          if (row.Rua && row.Cidade) {
            await query(`
              INSERT INTO customer_addresses (
                user_id, street, number, neighborhood, city, state, zip_code, complement, is_default
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
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

      } catch (error) {
        console.error(`[IMPORT_CLIENTS] Erro na linha ${rowNum}:`, error)
        errors.push(`Linha ${rowNum}: Erro ao processar dados - ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }

    console.log(`[IMPORT_CLIENTS] Importação concluída: ${successCount} sucessos, ${errors.length} erros`)
    
    return NextResponse.json({ 
      success: successCount, 
      errors,
      message: `${successCount} clientes importados com sucesso${errors.length > 0 ? `. ${errors.length} erros encontrados.` : '.'}`
    })

  } catch (error) {
    console.error('[IMPORT_CLIENTS] Erro geral na importação:', error)
    return NextResponse.json({ 
      error: 'Erro ao processar arquivo de importação' 
    }, { status: 500 })
  }
}