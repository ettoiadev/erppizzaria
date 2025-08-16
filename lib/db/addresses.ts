/**
 * Operações de banco de dados relacionadas a endereços
 */

import { getSupabaseServerClient } from '../supabase'

/**
 * Lista endereços de um usuário
 */
export async function listAddresses(userId: string) {
  const supabase = getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*, label')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Cria novo endereço
 */
export async function createAddress(input: { 
  user_id: string
  label: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_default?: boolean 
}) {
  const supabase = getSupabaseServerClient()
  
  if (input.is_default) {
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', input.user_id)
  }
  
  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      user_id: input.user_id,
      label: input.label || 'Endereço',
      street: input.street,
      number: input.number,
      complement: input.complement ?? '',
      neighborhood: input.neighborhood,
      city: input.city,
      state: input.state,
      zip_code: input.zip_code,
      is_default: input.is_default || false,
    })
    .select('*, label')
    .single()
  if (error) throw error
  return data
}

/**
 * Busca endereço por ID
 */
export async function getAddressById(id: string) {
  const supabase = getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*, label')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return data
}

/**
 * Atualiza endereço
 */
export async function updateAddress(id: string, input: { 
  is_default?: boolean
  label?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip_code?: string 
}) {
  const supabase = getSupabaseServerClient()
  
  // Buscar user_id para remoção de outros padrões
  const { data: found, error: findErr } = await supabase
    .from('customer_addresses')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()
  if (findErr) throw findErr
  if (!found) return null
  
  if (input.is_default) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('user_id', found.user_id)
      .neq('id', id)
  }
  
  const { data, error } = await supabase
    .from('customer_addresses')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, label')
    .single()
  if (error) throw error
  return data
}

/**
 * Exclui endereço
 */
export async function deleteAddress(id: string) {
  const supabase = getSupabaseServerClient()
  
  // Verificar se é padrão e se há outros
  const { data: found, error: findErr } = await supabase
    .from('customer_addresses')
    .select('is_default, user_id')
    .eq('id', id)
    .maybeSingle()
  if (findErr) throw findErr
  if (!found) return { success: true }

  if (found.is_default) {
    const { data: total } = await supabase
      .from('customer_addresses')
      .select('id', { count: 'exact' })
      .eq('user_id', found.user_id)
    const hasOthers = (total || []).length > 1
    if (hasOthers) {
      throw new Error('Não é possível excluir o endereço padrão. Defina outro endereço como padrão primeiro.')
    }
  }

  const { error } = await supabase.from('customer_addresses').delete().eq('id', id)
  if (error) throw error
  return { success: true }
}

/**
 * Salva endereço do cliente
 */
export async function saveCustomerAddress(userId: string, addressData: any): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  
  const payload = {
    user_id: userId,
    label: 'Endereço Principal',
    zip_code: addressData.zipCode,
    street: addressData.street,
    neighborhood: addressData.neighborhood,
    city: addressData.city,
    state: addressData.state,
    number: addressData.number,
    complement: addressData.complement || '',
    is_default: true,
  }
  
  if (payload.is_default) {
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userId)
  }
  
  const { error } = await supabase.from('customer_addresses').insert(payload)
  if (error) throw error
  return true
}