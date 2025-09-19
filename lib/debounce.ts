import React, { useCallback, useRef, useState, useEffect } from 'react'

/**
 * Hook personalizado para debounce de funções
 * @param callback Função a ser executada após o delay
 * @param delay Tempo de delay em milissegundos
 * @returns Função com debounce aplicado
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Criar novo timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Função utilitária para debounce simples
 * @param func Função a ser executada
 * @param delay Tempo de delay em milissegundos
 * @returns Função com debounce aplicado
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Hook para debounce de valores
 * @param value Valor a ser debounced
 * @param delay Tempo de delay em milissegundos
 * @returns Valor com debounce aplicado
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}