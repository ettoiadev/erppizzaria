import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { frontendLogger } from '@/lib/frontend-logger'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  requiresAuth?: boolean
  maxRetries?: number
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export function useProtectedApi() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const callApi = useCallback(async <T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
      maxRetries = 1
    } = options

    setLoading(true)

    try {
      let retryCount = 0
      let response: Response

      while (retryCount <= maxRetries) {
        // Fazer a requisição
        response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include' // Incluir cookies HttpOnly
        })

        // Se autorizado ou não requer auth, retornar resultado
        if (response.status !== 401 || !requiresAuth) {
          break
        }

        // Se não autorizado e é a primeira tentativa, tentar refresh
        if (retryCount === 0) {
          frontendLogger.warn('Token expirado, tentando renovar', 'api', {
          endpoint,
          method,
          attempt: retryCount + 1
        })

          // Tentar renovar o token usando refresh token
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          })

          if (refreshResponse.ok) {
            frontendLogger.info('Token renovado com sucesso', 'api', {
            endpoint,
            method
          })
            retryCount++
            continue // Tentar novamente com o novo token
          } else {
            frontendLogger.warn('Falha na renovação do token', 'api', {
              endpoint,
              method,
              refreshStatus: refreshResponse.status
            })
            break // Sair do loop e tratar como não autorizado
          }
        }

        break // Não tentar mais se já tentou renovar
      }

      // Se ainda não autorizado após tentativas, redirecionar para login
      if (response!.status === 401 && requiresAuth) {
        frontendLogger.warn('Sessão expirada, redirecionando para login', 'api', {
          endpoint,
          method,
          finalStatus: response!.status
        })
        
        // Fazer logout para limpar cookies
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        }).catch(() => {}) // Ignorar erros no logout
        
        router.push('/login')
        return {
          data: null,
          error: 'Sessão expirada. Redirecionando para login...',
          loading: false
        }
      }

      if (!response!.ok) {
        const errorData = await response!.json().catch(() => ({ error: 'Erro desconhecido' }))
        
        frontendLogger.logError('Erro na requisição da API', {
           endpoint,
           method,
           status: response!.status,
           error: errorData.error || 'Erro desconhecido'
         }, undefined, 'api')

        return {
          data: null,
          error: errorData.error || errorData.message || `Erro ${response!.status}`,
          loading: false
        }
      }

      const data = await response!.json()
      
      frontendLogger.info('Requisição bem-sucedida', 'api', {
        endpoint,
        method,
        status: response!.status,
        retries: retryCount
      })

      return {
        data,
        error: null,
        loading: false
      }

    } catch (error: any) {
      frontendLogger.logError('Erro de rede na requisição', {
         endpoint,
         method,
         error: error.message
       }, error, 'api')

      return {
        data: null,
        error: error.message || 'Erro de conexão',
        loading: false
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  return {
    callApi,
    loading
  }
}