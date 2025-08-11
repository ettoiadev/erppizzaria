import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from '@/lib/supabase'
import { withAdminAuth } from '@/lib/auth-middleware'
import { frontendLogger } from '@/lib/frontend-logger'

export const dynamic = 'force-dynamic'

// GET - Fetch admin settings
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, user) => {
    try {
      console.log("[ADMIN_SETTINGS] Iniciando busca de configurações")
      console.log(`[ADMIN_SETTINGS] Acesso autorizado para admin: ${user.email}`)

      const supabase = getSupabaseServerClient()
      console.log("[ADMIN_SETTINGS] Buscando configurações no Supabase...")
      
      const { data: settings, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('setting_key')
      
      if (error) {
        console.error("[ADMIN_SETTINGS] Erro ao buscar configurações:", error)
        throw error
      }

      console.log(`[ADMIN_SETTINGS] ${settings?.length || 0} configurações encontradas`)

      // Converter array para objeto para facilitar o uso no frontend
      const settingsObject = settings?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value
        return acc
      }, {} as Record<string, any>) || {}

      console.log("[ADMIN_SETTINGS] Configurações processadas com sucesso")

      return NextResponse.json({
        success: true,
        settings: settingsObject,
        count: settings?.length || 0
      })

    } catch (error: any) {
      console.error("[ADMIN_SETTINGS] Erro interno:", error)
      frontendLogger.logError('Erro ao buscar configurações', {
        error: error.message,
        adminEmail: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      }, error, 'api')
      return NextResponse.json({ 
        error: "Erro interno do servidor",
        details: error.message 
      }, { status: 500 })
    }
  })
}

// POST - Update admin settings
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, user) => {
    try {
      console.log("[ADMIN_SETTINGS] Iniciando atualização de configurações")
      console.log(`[ADMIN_SETTINGS] Atualização autorizada para admin: ${user.email}`)

      const settings = await request.json()
      console.log(`[ADMIN_SETTINGS] Atualizando ${Object.keys(settings).length} configurações`)
      console.log(`[ADMIN_SETTINGS] Dados recebidos:`, settings)

      const supabase = getSupabaseServerClient()
      const results = []
      const errors = []

      // Atualizar cada configuração individualmente
      for (const [key, value] of Object.entries(settings)) {
        try {
          console.log(`[ADMIN_SETTINGS] Atualizando ${key}: ${value}`)
          
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
            console.error(`[ADMIN_SETTINGS] Erro ao atualizar ${key}:`, error)
            errors.push({ key, error: error.message })
          } else {
            console.log(`[ADMIN_SETTINGS] ${key} atualizado com sucesso`)
            results.push({ key, success: true, data })
          }
        } catch (err: any) {
          console.error(`[ADMIN_SETTINGS] Erro interno ao atualizar ${key}:`, err)
          errors.push({ key, error: err.message })
        }
      }

      console.log(`[ADMIN_SETTINGS] Atualização concluída: ${results.length} sucessos, ${errors.length} erros`)

      frontendLogger.info('Configurações atualizadas', 'api', {
        adminEmail: user.email,
        successCount: results.length,
        errorCount: errors.length,
        updatedKeys: results.map(r => r.key)
      })

      if (errors.length > 0) {
        console.error("[ADMIN_SETTINGS] Erros encontrados:", errors)
        return NextResponse.json({
          success: false,
          message: "Algumas configurações não puderam ser atualizadas",
          results,
          errors
        }, { status: 207 }) // 207 Multi-Status
      }

      return NextResponse.json({
        success: true,
        message: "Todas as configurações foram atualizadas com sucesso",
        results,
        count: results.length
      })

    } catch (error: any) {
      console.error("[ADMIN_SETTINGS] Erro interno na atualização:", error)
      frontendLogger.logError('Erro ao atualizar configurações', {
        error: error.message,
        adminEmail: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      }, error, 'api')
      return NextResponse.json({ 
        error: "Erro interno do servidor",
        details: error.message 
      }, { status: 500 })
    }
  })
}
