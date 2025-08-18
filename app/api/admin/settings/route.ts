import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import { validateAdminAuth, createAuthErrorResponse, addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils'
import { frontendLogger } from '@/lib/frontend-logger'

// Handler para requisições OPTIONS (CORS)
export async function OPTIONS() {
  return createOptionsHandler()
}

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
    try {
      frontendLogger.info('Iniciando busca de configurações admin', 'api', {
        adminEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      const supabase = getSupabaseServerClient()
      frontendLogger.info('Buscando configurações no Supabase', 'api')
      
      const { data: settings, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('setting_key')
      
      if (error) {
        frontendLogger.error('Erro ao buscar configurações admin', 'api', {
          error: error.message,
          stack: error.stack
        })
        throw error
      }

      frontendLogger.info('Configurações encontradas', 'api', {
        count: settings?.length || 0
      })

      // Converter array para objeto para facilitar o uso no frontend
      const settingsObject = settings?.reduce((acc, setting) => {
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
    frontendLogger.error('Erro interno ao buscar configurações', 'api', {
      error: error.message,
      stack: error.stack,
      adminEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
    frontendLogger.logError('Erro ao buscar configurações', {
      error: error.message,
      adminEmail: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    }, error, 'api')
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
    try {
      frontendLogger.info('Iniciando atualização de configurações admin', 'api', {
        adminEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      const settings = await request.json()
      frontendLogger.info('Dados recebidos para atualização', 'api', {
        settingsCount: Object.keys(settings).length,
        settingsKeys: Object.keys(settings)
      })

      const supabase = getSupabaseServerClient()
      const results = []
      const errors = []

      // Atualizar cada configuração individualmente
      for (const [key, value] of Object.entries(settings)) {
        try {
          frontendLogger.info('Atualizando configuração', 'api', {
            key,
            hasValue: !!value
          })
          
          const { data, error } = await supabase
            .from('admin_settings')
            .upsert({
              setting_key: key,
              setting_value: value,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'setting_key'
            })
            .select()
          
          if (error) {
            frontendLogger.error('Erro ao atualizar configuração específica', 'api', {
              key,
              error: error.message,
              stack: error.stack
            })
            errors.push({ key, error: error.message })
          } else {
            frontendLogger.info('Configuração atualizada com sucesso', 'api', {
              key
            })
            results.push({ key, success: true, data })
          }
        } catch (err: any) {
          frontendLogger.error('Erro interno ao atualizar configuração', 'api', {
            key,
            error: err.message,
            stack: err.stack
          })
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
        frontendLogger.error('Erros encontrados na atualização', 'api', {
          errors: errors.map(e => ({ key: e.key, error: e.error }))
        })
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
    frontendLogger.error('Erro interno na atualização de configurações', 'api', {
      error: error.message,
      stack: error.stack,
      adminEmail: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
    frontendLogger.logError('Erro ao atualizar configurações', {
      error: error.message,
      adminEmail: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      }, error, 'api')
     const response = NextResponse.json({ 
       error: "Erro interno do servidor",
       details: error.message 
     }, { status: 500 })
     return addCorsHeaders(response)
   }
 }
