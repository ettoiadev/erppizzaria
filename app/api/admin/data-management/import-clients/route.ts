import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { frontendLogger } from '@/lib/frontend-logger'
import * as XLSX from 'xlsx'

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

    const supabase = getSupabaseServerClient()
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
        const { data: existingUser, error: exErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', row.Email)
          .maybeSingle()
        if (exErr) throw exErr
        
        if (existingUser) {
          const userId = existingUser.id

          const { error: updErr } = await supabase
            .from('profiles')
            .update({ full_name: row.Nome, phone: row.Telefone || null, updated_at: new Date().toISOString() })
            .eq('id', userId)
          if (updErr) throw updErr

          // Atualizar ou inserir endereço se fornecido
          if (row.Rua && row.Cidade) {
            const { error: addrErr } = await supabase
              .from('customer_addresses')
              .upsert({
                user_id: userId,
                street: row.Rua,
                number: row.Número || '',
                neighborhood: row.Bairro || '',
                city: row.Cidade,
                state: row.Estado || 'SP',
                zip_code: row.CEP || '',
                complement: row.Complemento || '',
                is_default: true,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,street,number,neighborhood,city,state'
              })
            if (addrErr) throw addrErr
          }

        } else {
          // Criar novo cliente
          const { data: newUser, error: insErr } = await supabase
            .from('profiles')
            .insert({ full_name: row.Nome, email: row.Email, phone: row.Telefone || null, role: 'customer' })
            .select('id')
            .single()
          if (insErr) throw insErr
          const userId = newUser.id

          // Inserir endereço se fornecido
          if (row.Rua && row.Cidade) {
            const { error: addrErr } = await supabase
              .from('customer_addresses')
              .insert({
                user_id: userId,
                street: row.Rua,
                number: row.Número || '',
                neighborhood: row.Bairro || '',
                city: row.Cidade,
                state: row.Estado || 'SP',
                zip_code: row.CEP || '',
                complement: row.Complemento || '',
                is_default: true
              })
            if (addrErr) throw addrErr
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