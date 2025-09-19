/**
 * Sistema de Cache Inteligente
 * Fase 3 - Otimizações Avançadas
 */

import { logger } from './logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalSize: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  cleanupInterval: number;
  enableStats: boolean;
}

class IntelligentCache {
  private cache = new Map<string, CacheItem<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalSize: 0
  };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTtl: config.defaultTtl || 300000, // 5 minutos
      cleanupInterval: config.cleanupInterval || 60000, // 1 minuto
      enableStats: config.enableStats !== false
    };

    this.startCleanupTimer();
    logger.info('Cache inteligente inicializado', { config: this.config });
  }

  /**
   * Obter item do cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Verificar se expirou
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    // Atualizar estatísticas de acesso
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.stats.hits++;

    logger.debug('Cache hit', { key, accessCount: item.accessCount });
    return item.data;
  }

  /**
   * Definir item no cache
   */
  set<T>(key: string, data: T, options: {
    ttl?: number;
    tags?: string[];
  } = {}): void {
    const ttl = options.ttl || this.config.defaultTtl;
    const tags = options.tags || [];

    // Verificar limite de tamanho
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags
    };

    this.cache.set(key, item);
    this.stats.sets++;
    this.stats.totalSize = this.cache.size;

    logger.debug('Cache set', { key, ttl, tags });
  }

  /**
   * Remover item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.totalSize = this.cache.size;
      logger.debug('Cache delete', { key });
    }
    return deleted;
  }

  /**
   * Limpar cache por tags
   */
  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.stats.deletes += count;
    this.stats.totalSize = this.cache.size;
    
    logger.info('Cache invalidated by tag', { tag, count });
    return count;
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.stats.totalSize = 0;
    
    logger.info('Cache cleared', { itemsRemoved: size });
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): CacheStats & {
    hitRate: number;
    missRate: number;
    averageAccessCount: number;
  } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;
    
    let totalAccessCount = 0;
    for (const item of this.cache.values()) {
      totalAccessCount += item.accessCount;
    }
    const averageAccessCount = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;

    return {
      ...this.stats,
      hitRate,
      missRate,
      averageAccessCount
    };
  }

  /**
   * Obter informações detalhadas do cache
   */
  getInfo(): {
    size: number;
    maxSize: number;
    keys: string[];
    oldestItem: string | null;
    newestItem: string | null;
    mostAccessed: string | null;
  } {
    const keys = Array.from(this.cache.keys());
    
    let oldestItem: string | null = null;
    let newestItem: string | null = null;
    let mostAccessed: string | null = null;
    let oldestTime = Infinity;
    let newestTime = 0;
    let maxAccessCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestItem = key;
      }
      if (item.timestamp > newestTime) {
        newestTime = item.timestamp;
        newestItem = key;
      }
      if (item.accessCount > maxAccessCount) {
        maxAccessCount = item.accessCount;
        mostAccessed = key;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      keys,
      oldestItem,
      newestItem,
      mostAccessed
    };
  }

  /**
   * Wrapper para cache com função
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    // Verificar cache primeiro (a menos que forceRefresh seja true)
    if (!options.forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Executar função e cachear resultado
    try {
      const result = await fn();
      this.set(key, result, options);
      return result;
    } catch (error) {
      logger.error('Erro ao executar função para cache', { key, error });
      throw error;
    }
  }

  /**
   * Verificar se item expirou
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Remover item menos usado (LRU)
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastAccessCount = Infinity;
    let oldestAccess = Infinity;

    for (const [key, item] of this.cache.entries()) {
      // Priorizar por menor número de acessos, depois por acesso mais antigo
      if (item.accessCount < leastAccessCount || 
          (item.accessCount === leastAccessCount && item.lastAccessed < oldestAccess)) {
        leastAccessCount = item.accessCount;
        oldestAccess = item.lastAccessed;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.stats.evictions++;
      logger.debug('Cache eviction (LRU)', { 
        key: leastUsedKey, 
        accessCount: leastAccessCount 
      });
    }
  }

  /**
   * Limpeza automática de itens expirados
   */
  private cleanup(): void {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.stats.evictions += removedCount;
      this.stats.totalSize = this.cache.size;
      logger.debug('Cache cleanup', { removedCount, remainingSize: this.cache.size });
    }
  }

  /**
   * Iniciar timer de limpeza
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Parar timer de limpeza
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
    logger.info('Cache destruído');
  }
}

// Instância global do cache
export const cache = new IntelligentCache({
  maxSize: 1000,
  defaultTtl: 300000, // 5 minutos
  cleanupInterval: 60000, // 1 minuto
  enableStats: true
});

// Cache específico para diferentes tipos de dados
export const categoriesCache = new IntelligentCache({
  maxSize: 100,
  defaultTtl: 600000, // 10 minutos (categorias mudam pouco)
  cleanupInterval: 120000
});

export const productsCache = new IntelligentCache({
  maxSize: 500,
  defaultTtl: 300000, // 5 minutos
  cleanupInterval: 60000
});

export const ordersCache = new IntelligentCache({
  maxSize: 200,
  defaultTtl: 60000, // 1 minuto (pedidos mudam frequentemente)
  cleanupInterval: 30000
});

// Funções utilitárias para cache
export const cacheUtils = {
  /**
   * Gerar chave de cache padronizada
   */
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  },

  /**
   * Invalidar cache relacionado a um usuário
   */
  invalidateUserCache(userId: string): void {
    cache.invalidateByTag(`user:${userId}`);
    ordersCache.invalidateByTag(`user:${userId}`);
  },

  /**
   * Invalidar cache relacionado a produtos
   */
  invalidateProductCache(productId?: string): void {
    productsCache.clear();
    if (productId) {
      cache.invalidateByTag(`product:${productId}`);
    } else {
      cache.invalidateByTag('products');
    }
  },

  /**
   * Invalidar cache relacionado a categorias
   */
  invalidateCategoryCache(): void {
    categoriesCache.clear();
    cache.invalidateByTag('categories');
    // Produtos também dependem de categorias
    productsCache.clear();
  },

  /**
   * Obter estatísticas consolidadas
   */
  getAllStats() {
    return {
      main: cache.getStats(),
      categories: categoriesCache.getStats(),
      products: productsCache.getStats(),
      orders: ordersCache.getStats()
    };
  }
};

export { IntelligentCache }