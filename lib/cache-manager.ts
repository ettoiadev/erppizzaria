import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { appLogger } from '@/lib/logging'

// Interface para itens do cache
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live em milissegundos
}

// Interface para configuração do cache
interface CacheConfig {
  defaultTTL: number
  maxSize: number
  cleanupInterval: number
}

// Classe para gerenciar cache em memória
class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private config: CacheConfig
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 1000, // máximo 1000 itens
      cleanupInterval: 60 * 1000, // limpeza a cada 1 minuto
      ...config
    }
    
    this.startCleanup()
  }

  // Iniciar limpeza automática de itens expirados
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  // Limpar itens expirados
  private cleanup(): void {
    const now = Date.now()
    let removedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        removedCount++
      }
    }

    if (removedCount > 0) {
      appLogger.info('general', `Cache cleanup: removed ${removedCount} expired items`)
    }

    // Se ainda estiver muito grande, remover os mais antigos
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, this.cache.size - this.config.maxSize)
      toRemove.forEach(([key]) => this.cache.delete(key))
      
      appLogger.info('general', `Cache size limit: removed ${toRemove.length} oldest items`)
    }
  }

  // Obter item do cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  // Definir item no cache
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    }

    this.cache.set(key, item)
    appLogger.info('general', `Cache set: ${key}`, { ttl: item.ttl })
  }

  // Remover item do cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      appLogger.info('general', `Cache delete: ${key}`)
    }
    return deleted
  }

  // Limpar cache por padrão
  invalidatePattern(pattern: string): number {
    let removedCount = 0
    const regex = new RegExp(pattern)

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        removedCount++
      }
    }

    if (removedCount > 0) {
      appLogger.info('general', `Cache invalidate pattern '${pattern}': removed ${removedCount} items`)
    }

    return removedCount
  }

  // Limpar todo o cache
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    appLogger.info('general', `Cache cleared: removed ${size} items`)
  }

  // Obter estatísticas do cache
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize
    }
  }

  // Destruir cache e limpar timer
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }
}

// Instância global do cache
const globalCache = new MemoryCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutos para dados gerais
  maxSize: 500,
  cleanupInterval: 2 * 60 * 1000 // limpeza a cada 2 minutos
})

// Funções específicas para cache de produtos
export const ProductsCache = {
  // Cache de lista de produtos
  async getProducts(limit?: string, featured?: string): Promise<any[] | null> {
    const key = `products:list:${limit || 'all'}:${featured || 'all'}`
    return globalCache.get<any[]>(key)
  },

  async setProducts(products: any[], limit?: string, featured?: string): Promise<void> {
    const key = `products:list:${limit || 'all'}:${featured || 'all'}`
    globalCache.set(key, products, 3 * 60 * 1000) // 3 minutos para produtos
  },

  // Cache de produto individual
  async getProduct(id: string): Promise<any | null> {
    const key = `product:${id}`
    return globalCache.get<any>(key)
  },

  async setProduct(id: string, product: any): Promise<void> {
    const key = `product:${id}`
    globalCache.set(key, product, 5 * 60 * 1000) // 5 minutos para produto individual
  },

  // Invalidar cache de produtos
  invalidateProducts(): number {
    return globalCache.invalidatePattern('^products:')
  },

  invalidateProduct(id: string): boolean {
    return globalCache.delete(`product:${id}`)
  }
}

// Funções específicas para cache de categorias
export const CategoriesCache = {
  // Cache de lista de categorias
  async getCategories(): Promise<any[] | null> {
    const key = 'categories:list'
    return globalCache.get<any[]>(key)
  },

  async setCategories(categories: any[]): Promise<void> {
    const key = 'categories:list'
    globalCache.set(key, categories, 10 * 60 * 1000) // 10 minutos para categorias (mudam menos)
  },

  // Cache de categoria individual
  async getCategory(id: string): Promise<any | null> {
    const key = `category:${id}`
    return globalCache.get<any>(key)
  },

  async setCategory(id: string, category: any): Promise<void> {
    const key = `category:${id}`
    globalCache.set(key, category, 10 * 60 * 1000) // 10 minutos para categoria individual
  },

  // Invalidar cache de categorias
  invalidateCategories(): number {
    return globalCache.invalidatePattern('^categor')
  },

  invalidateCategory(id: string): boolean {
    return globalCache.delete(`category:${id}`)
  }
}

// Funções específicas para cache de configurações
export const ConfigCache = {
  // Cache de configurações do sistema
  async getConfig(): Promise<any | null> {
    const key = 'system:config'
    return globalCache.get<any>(key)
  },

  async setConfig(config: any): Promise<void> {
    const key = 'system:config'
    globalCache.set(key, config, 15 * 60 * 1000) // 15 minutos para configurações
  },

  invalidateConfig(): boolean {
    return globalCache.delete('system:config')
  }
}

// Middleware para cache automático
export function withCache<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Tentar obter do cache primeiro
      const cached = globalCache.get<T>(cacheKey)
      if (cached !== null) {
        appLogger.info('general', `Cache hit: ${cacheKey}`)
        resolve(cached)
        return
      }

      // Se não estiver no cache, buscar dados
      appLogger.info('general', `Cache miss: ${cacheKey}`)
      const data = await fetchFunction()
      
      // Armazenar no cache
      globalCache.set(cacheKey, data, ttl)
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}

// Exportar cache global para uso direto se necessário
export { globalCache }

// Exportar estatísticas do cache
export function getCacheStats() {
  return globalCache.getStats()
}

// Limpar todo o cache
export function clearAllCache(): void {
  globalCache.clear()
}

// Função para invalidar cache baseado em padrão
export function invalidateCachePattern(pattern: string): number {
  return globalCache.invalidatePattern(pattern)
}