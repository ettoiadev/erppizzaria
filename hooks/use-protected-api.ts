import { useCallback } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useRouter } from 'next/navigation'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  requireAuth?: boolean
}

export function useProtectedApi() {
  const { getValidToken, session } = useSupabaseAuth()
  const router = useRouter()

  const callApi = useCallback(async (
    endpoint: string, 
    options: ApiOptions = {}
  ) => {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = true
    } = options

    try {
      // Se requer autenticação, obter token válido
      if (requireAuth) {
        const token = await getValidToken()
        
        if (!token) {
          console.log('⚠️ Token inválido, redirecionando para login...')
          router.push('/admin/login?error=session_expired')
          throw new Error('Sessão expirada. Redirecionando para login...')
        }

        headers['Authorization'] = `Bearer ${token}`
      }

      // Preparar configurações da request
      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      if (body && method !== 'GET') {
        requestConfig.body = JSON.stringify(body)
      }

      console.log(`🔄 Fazendo chamada para API: ${method} ${endpoint}`)
      
      const response = await fetch(endpoint, requestConfig)
      
      // Se receber 401 (não autorizado), tentar refresh do token
      if (response.status === 401 && requireAuth) {
        console.log('🔄 Recebido 401, tentando refresh do token...')
        
        const newToken = await getValidToken()
        
        if (newToken) {
          // Tentar novamente com novo token
          headers['Authorization'] = `Bearer ${newToken}`
          requestConfig.headers = {
            'Content-Type': 'application/json',
            ...headers
          }
          
          console.log('🔄 Tentando novamente com token renovado...')
          const retryResponse = await fetch(endpoint, requestConfig)
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`)
          }
          
          return retryResponse
        } else {
          // Se não conseguiu refresh, redirecionar para login
          console.log('❌ Não foi possível renovar token, redirecionando...')
          router.push('/admin/login?error=session_expired')
          throw new Error('Sessão expirada')
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      console.error(`❌ Erro na chamada da API ${endpoint}:`, error)
      throw error
    }
  }, [getValidToken, router])

  // Métodos convenientes para diferentes tipos de request
  const get = useCallback((endpoint: string, headers?: Record<string, string>) => 
    callApi(endpoint, { method: 'GET', headers }), [callApi])

  const post = useCallback((endpoint: string, body?: any, headers?: Record<string, string>) => 
    callApi(endpoint, { method: 'POST', body, headers }), [callApi])

  const put = useCallback((endpoint: string, body?: any, headers?: Record<string, string>) => 
    callApi(endpoint, { method: 'PUT', body, headers }), [callApi])

  const patch = useCallback((endpoint: string, body?: any, headers?: Record<string, string>) => 
    callApi(endpoint, { method: 'PATCH', body, headers }), [callApi])

  const del = useCallback((endpoint: string, headers?: Record<string, string>) => 
    callApi(endpoint, { method: 'DELETE', headers }), [callApi])

  // Função para verificar se o usuário tem sessão válida
  const hasValidSession = useCallback(() => {
    return !!session && !!session.access_token
  }, [session])

  return {
    callApi,
    get,
    post,
    put,
    patch,
    delete: del,
    hasValidSession
  }
} 