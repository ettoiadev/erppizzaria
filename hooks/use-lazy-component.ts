import { useState, useEffect, useRef } from 'react'

/**
 * Hook para carregamento lazy de componentes pesados com cache
 * Reduz o bundle inicial e melhora a performance
 */
export function useLazyComponent<T>(importFn: () => Promise<T>) {
  const [component, setComponent] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const cacheRef = useRef<T | null>(null)
  const loadingRef = useRef(false)

  const loadComponent = async () => {
    // Se já está carregado no cache, retorna imediatamente
    if (cacheRef.current) {
      setComponent(cacheRef.current)
      return
    }

    // Evita múltiplas chamadas simultâneas
    if (loadingRef.current) return

    setLoading(true)
    loadingRef.current = true
    setError(null)

    try {
      const loadedComponent = await importFn()
      cacheRef.current = loadedComponent
      setComponent(loadedComponent)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar componente'))
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  useEffect(() => {
    // Auto-load se não estiver carregado
    if (!component && !loading && !error) {
      loadComponent()
    }
  }, [])

  return {
    component,
    loading,
    error,
    reload: loadComponent
  }
}

/**
 * Hook específico para bibliotecas pesadas como XLSX
 */
export function useLazyLibrary<T>(libraryName: string, importFn: () => Promise<T>) {
  const cacheKey = `lazy-lib-${libraryName}`
  const [library, setLibrary] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadLibrary = async () => {
    // Verifica cache global
    if (typeof window !== 'undefined') {
      const cached = (window as any)[cacheKey]
      if (cached) {
        setLibrary(cached)
        return cached
      }
    }

    setLoading(true)
    setError(null)

    try {
      const loadedLibrary = await importFn()
      
      // Salva no cache global
      if (typeof window !== 'undefined') {
        (window as any)[cacheKey] = loadedLibrary
      }
      
      setLibrary(loadedLibrary)
      return loadedLibrary
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Erro ao carregar ${libraryName}`)
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    library,
    loading,
    error,
    loadLibrary
  }
}