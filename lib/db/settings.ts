/**
 * Operações de banco de dados relacionadas a configurações administrativas
 */

import { getSupabaseServerClient } from '../supabase'

/**
 * Busca configurações administrativas
 */
export async function getAdminSettings(): Promise<Record<string, string>> {
  const supabase = getSupabaseServerClient()
  
  const { data, error } = await supabase.from('admin_settings').select('setting_key, setting_value')
  if (error) throw error
  
  const settings: Record<string, string> = {}
  ;(data || []).forEach((s: any) => {
    settings[s.setting_key] = s.setting_value
  })
  
  return settings
}

/**
 * Atualiza configuração administrativa
 */
export async function updateAdminSetting(key: string, value: string) {
  const supabase = getSupabaseServerClient()
  
  // Upsert por chave única
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ 
      setting_key: key, 
      setting_value: value, 
      updated_at: new Date().toISOString() 
    }, { onConflict: 'setting_key' })
  if (error) throw error
  return true
}