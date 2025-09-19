import { NextRequest, NextResponse } from "next/server"
import { query } from '@/lib/db'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'

// Handler para requisições OPTIONS (CORS)
export const OPTIONS = createOptionsHandler()

export const dynamic = 'force-dynamic'

// GET - Fetch admin settings
export async function GET(request: NextRequest) {
  // Validar autenticação admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado')
  }
  
  const user = authResult.user
  
  try {
    frontendLogger.info('Iniciando busca de configurações admin', 'api', {
      adminEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

    frontendLogger.info('Buscando configurações no PostgreSQL', 'api')
    
    const result = await query(
      'SELECT key as setting_key, value as setting_value FROM admin_settings ORDER BY key'
    )
    
    const settings = result.rows

    frontendLogger.info('Configurações encontradas', 'api', {
      count: settings?.length || 0
    })

    // Converter array para objeto para facilitar o uso no frontend
    const settingsObject = settings?.reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {} as Record<string, any>) || {}

    frontendLogger.info('Configurações processadas com sucesso', 'api')

    const response = NextResponse.json({
      success: true,
      settings: settingsObject,
      count: settings?.length || 0
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.logError('Erro ao buscar configurações', {
      error: error.message,
      stack: error.stack,
      adminEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    }, error as Error, 'api')
    const response = NextResponse.json({ 
        error: "Erro interno do servidor",
        details: error.message 
      }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// POST - Update admin settings
export async function POST(request: NextRequest) {
  // Validar autenticação admin
  const authResult = await validateAdminAuth(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado')
  }
  
  const user = authResult.user
  
  try {
    frontendLogger.info('Iniciando atualização de configurações admin', 'api', {
      adminEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })

    const settings = await request.json()
    frontendLogger.info('Dados recebidos para atualização', 'api', {
      settingsCount: Object.keys(settings).length,
      settingsKeys: Object.keys(settings)
    })

    const results = []
    const errors = []

    // Atualizar cada configuração individualmente
    for (const [key, value] of Object.entries(settings)) {
      try {
        frontendLogger.info('Atualizando configuração', 'api', {
          key,
          hasValue: !!value
        })
        
        const result = await query(`
          INSERT INTO admin_settings (key, value, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (key)
          DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
          RETURNING key as setting_key, value as setting_value
        `, [key, value])
        
        frontendLogger.info('Configuração atualizada com sucesso', 'api', {
          key
        })
        results.push({ key, success: true, data: result.rows[0] })
      } catch (err: any) {
        frontendLogger.logError('Erro interno ao atualizar configuração', {
          key,
          error: err.message,
          stack: err.stack
        }, err as Error, 'api')
        errors.push({ key, error: err.message })
      }
    }

    frontendLogger.info('Atualização de configurações concluída', 'api', {
      successCount: results.length,
      errorCount: errors.length,
      updatedKeys: results.map(r => r.key)
    })

    frontendLogger.info('Configurações atualizadas', 'api', {
      adminEmail: user.email,
      successCount: results.length,
      errorCount: errors.length,
      updatedKeys: results.map(r => r.key)
    })

      if (errors.length > 0) {
        frontendLogger.logError('Erros encontrados na atualização', {
          errors: errors.map(e => ({ key: e.key, error: e.error }))
        }, new Error('Erros na atualização de configurações'), 'api')
        const response = NextResponse.json({
          success: false,
          message: "Algumas configurações não puderam ser atualizadas",
          results,
          errors
        }, { status: 207 }) // 207 Multi-Status
        return addCorsHeaders(response)
      }

      const response = NextResponse.json({
        success: true,
        message: "Todas as configurações foram atualizadas com sucesso",
        results,
        count: results.length
      })
      return addCorsHeaders(response)

  } catch (error: any) {
    frontendLogger.logError('Erro ao atualizar configurações', {
      error: error.message,
      adminEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    }, error, 'api')
     const response = NextResponse.json({ 
       error: "Erro interno do servidor",
       details: error.message 
     }, { status: 500 })
     return addCorsHeaders(response)
   }
 }
