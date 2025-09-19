/**
 * Operações de banco de dados relacionadas a configurações administrativas
 */

import { query } from '../database'

/**
 * Busca configurações administrativas
 */
export async function getAdminSettings(): Promise<Record<string, string>> {
  const result = await query(`
    SELECT setting_key, setting_value 
    FROM admin_settings
  `)
  
  const settings: Record<string, string> = {}
  result.rows.forEach((s: any) => {
    settings[s.setting_key] = s.setting_value
  })
  
  return settings
}

/**
 * Atualiza configuração administrativa
 */
export async function updateAdminSetting(key: string, value: string) {
  // Upsert por chave única
  await query(`
    INSERT INTO admin_settings (setting_key, setting_value, created_at, updated_at)
    VALUES ($1, $2, NOW(), NOW())
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
      setting_value = EXCLUDED.setting_value,
      updated_at = NOW()
  `, [key, value])
  
  return true
}