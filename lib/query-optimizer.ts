/**
 * Otimizador de Queries PostgreSQL
 * Fase 3 - Otimizações Avançadas
 */

import { Pool, PoolClient } from 'pg';
import { logger } from './logger';

interface QueryStats {
  query: string;
  executionTime: number;
  rowsReturned: number;
  timestamp: number;
  planningTime?: number;
  executionTimeActual?: number;
}

interface IndexSuggestion {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: string;
}

class QueryOptimizer {
  private queryStats: QueryStats[] = [];
  private slowQueryThreshold = 1000; // 1 segundo
  private maxStatsHistory = 1000;

  constructor(private pool: Pool) {
    logger.info('Query Optimizer inicializado');
  }

  /**
   * Executar query com análise de performance
   */
  async executeWithAnalysis<T = any>(
    query: string,
    params: any[] = [],
    options: {
      enableExplain?: boolean;
      logSlow?: boolean;
      cacheKey?: string;
    } = {}
  ): Promise<{
    rows: T[];
    stats: QueryStats;
    plan?: any;
  }> {
    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      let plan: any = undefined;
      
      // Obter plano de execução se solicitado
      if (options.enableExplain) {
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
        const explainResult = await client.query(explainQuery, params);
        plan = explainResult.rows[0]['QUERY PLAN'][0];
      }
      
      // Executar query principal
      const result = await client.query(query, params);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Criar estatísticas
      const stats: QueryStats = {
        query: this.sanitizeQuery(query),
        executionTime,
        rowsReturned: result.rows.length,
        timestamp: startTime,
        planningTime: plan?.['Planning Time'],
        executionTimeActual: plan?.['Execution Time']
      };
      
      // Armazenar estatísticas
      this.addQueryStats(stats);
      
      // Log de queries lentas
      if (options.logSlow && executionTime > this.slowQueryThreshold) {
        logger.warn('Query lenta detectada', {
          query: stats.query,
          executionTime,
          rowsReturned: result.rows.length,
          plan: plan ? this.summarizePlan(plan) : undefined
        });
      }
      
      return {
        rows: result.rows,
        stats,
        plan
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Analisar performance de queries
   */
  async analyzeQueryPerformance(): Promise<{
    slowQueries: QueryStats[];
    frequentQueries: { query: string; count: number; avgTime: number }[];
    suggestions: IndexSuggestion[];
  }> {
    const slowQueries = this.queryStats
      .filter(stat => stat.executionTime > this.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);
    
    const queryFrequency = new Map<string, { count: number; totalTime: number }>();
    
    this.queryStats.forEach(stat => {
      const existing = queryFrequency.get(stat.query) || { count: 0, totalTime: 0 };
      existing.count++;
      existing.totalTime += stat.executionTime;
      queryFrequency.set(stat.query, existing);
    });
    
    const frequentQueries = Array.from(queryFrequency.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        avgTime: data.totalTime / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const suggestions = await this.generateIndexSuggestions();
    
    return {
      slowQueries,
      frequentQueries,
      suggestions
    };
  }

  /**
   * Criar índices otimizados
   */
  async createOptimizedIndexes(): Promise<void> {
    const indexes = [
      // Índices para autenticação
      {
        name: 'idx_profiles_email_active',
        table: 'profiles',
        columns: ['email', 'active'],
        type: 'btree',
        reason: 'Otimizar login e busca de usuários ativos'
      },
      
      // Índices para produtos
      {
        name: 'idx_products_category_active',
        table: 'products',
        columns: ['category_id', 'active'],
        type: 'btree',
        reason: 'Otimizar listagem de produtos por categoria'
      },
      {
        name: 'idx_products_name_search',
        table: 'products',
        columns: ['name'],
        type: 'gin',
        reason: 'Otimizar busca textual de produtos'
      },
      {
        name: 'idx_products_price_range',
        table: 'products',
        columns: ['price', 'active'],
        type: 'btree',
        reason: 'Otimizar filtros por faixa de preço'
      },
      
      // Índices para pedidos
      {
        name: 'idx_orders_customer_status',
        table: 'orders',
        columns: ['customer_id', 'status'],
        type: 'btree',
        reason: 'Otimizar consulta de pedidos por cliente e status'
      },
      {
        name: 'idx_orders_created_at',
        table: 'orders',
        columns: ['created_at'],
        type: 'btree',
        reason: 'Otimizar ordenação por data de criação'
      },
      {
        name: 'idx_orders_status_created',
        table: 'orders',
        columns: ['status', 'created_at'],
        type: 'btree',
        reason: 'Otimizar dashboard admin por status e data'
      },
      
      // Índices para itens de pedido
      {
        name: 'idx_order_items_order_id',
        table: 'order_items',
        columns: ['order_id'],
        type: 'btree',
        reason: 'Otimizar busca de itens por pedido'
      },
      {
        name: 'idx_order_items_product_id',
        table: 'order_items',
        columns: ['product_id'],
        type: 'btree',
        reason: 'Otimizar relatórios de produtos mais vendidos'
      },
      
      // Índices para favoritos
      {
        name: 'idx_favorites_customer_product',
        table: 'favorites',
        columns: ['customer_id', 'product_id'],
        type: 'btree',
        reason: 'Otimizar verificação de favoritos'
      },
      
      // Índices para endereços
      {
        name: 'idx_customer_addresses_customer',
        table: 'customer_addresses',
        columns: ['customer_id', 'active'],
        type: 'btree',
        reason: 'Otimizar busca de endereços por cliente'
      },
      
      // Índices para refresh tokens
      {
        name: 'idx_refresh_tokens_token',
        table: 'refresh_tokens',
        columns: ['token'],
        type: 'hash',
        reason: 'Otimizar validação de refresh tokens'
      },
      {
        name: 'idx_refresh_tokens_user_expires',
        table: 'refresh_tokens',
        columns: ['user_id', 'expires_at'],
        type: 'btree',
        reason: 'Otimizar limpeza de tokens expirados'
      }
    ];
    
    for (const index of indexes) {
      await this.createIndexIfNotExists(index);
    }
  }

  /**
   * Analisar uso de índices existentes
   */
  async analyzeIndexUsage(): Promise<{
    unusedIndexes: any[];
    mostUsedIndexes: any[];
    indexSizes: any[];
  }> {
    const client = await this.pool.connect();
    
    try {
      // Índices não utilizados
      const unusedIndexesResult = await client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes 
        WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
        ORDER BY pg_relation_size(indexrelid) DESC
      `);
      
      // Índices mais utilizados
      const mostUsedIndexesResult = await client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes 
        WHERE idx_tup_read > 0 OR idx_tup_fetch > 0
        ORDER BY (idx_tup_read + idx_tup_fetch) DESC
        LIMIT 10
      `);
      
      // Tamanhos dos índices
      const indexSizesResult = await client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as size,
          pg_relation_size(indexrelid) as size_bytes
        FROM pg_stat_user_indexes 
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 20
      `);
      
      return {
        unusedIndexes: unusedIndexesResult.rows,
        mostUsedIndexes: mostUsedIndexesResult.rows,
        indexSizes: indexSizesResult.rows
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Otimizar configurações do PostgreSQL
   */
  async optimizePostgreSQLSettings(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Configurações recomendadas para desenvolvimento/produção
      const optimizations = [
        // Aumentar work_mem para queries complexas
        "SET work_mem = '16MB'",
        
        // Otimizar shared_buffers (25% da RAM disponível)
        "SET shared_buffers = '256MB'",
        
        // Configurar effective_cache_size (75% da RAM)
        "SET effective_cache_size = '1GB'",
        
        // Otimizar random_page_cost para SSDs
        "SET random_page_cost = 1.1",
        
        // Configurar checkpoint_completion_target
        "SET checkpoint_completion_target = 0.9",
        
        // Otimizar wal_buffers
        "SET wal_buffers = '16MB'",
        
        // Configurar default_statistics_target
        "SET default_statistics_target = 100"
      ];
      
      for (const setting of optimizations) {
        try {
          await client.query(setting);
          logger.info('Configuração PostgreSQL aplicada', { setting });
        } catch (error) {
          logger.warn('Erro ao aplicar configuração PostgreSQL', { setting, error });
        }
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Executar VACUUM e ANALYZE nas tabelas principais
   */
  async maintainTables(): Promise<void> {
    const tables = [
      'profiles', 'categories', 'products', 'orders', 
      'order_items', 'favorites', 'customer_addresses', 'refresh_tokens'
    ];
    
    const client = await this.pool.connect();
    
    try {
      for (const table of tables) {
        // VACUUM para recuperar espaço
        await client.query(`VACUUM ${table}`);
        
        // ANALYZE para atualizar estatísticas
        await client.query(`ANALYZE ${table}`);
        
        logger.info('Manutenção de tabela concluída', { table });
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Obter estatísticas de performance do banco
   */
  async getDatabaseStats(): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const stats = await client.query(`
        SELECT 
          datname,
          numbackends,
          xact_commit,
          xact_rollback,
          blks_read,
          blks_hit,
          tup_returned,
          tup_fetched,
          tup_inserted,
          tup_updated,
          tup_deleted,
          conflicts,
          temp_files,
          temp_bytes,
          deadlocks,
          blk_read_time,
          blk_write_time
        FROM pg_stat_database 
        WHERE datname = current_database()
      `);
      
      return stats.rows[0];
      
    } finally {
      client.release();
    }
  }

  // Métodos privados
  private sanitizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '?') // Substituir parâmetros
      .replace(/\s+/g, ' ') // Normalizar espaços
      .trim()
      .substring(0, 200); // Limitar tamanho
  }

  private addQueryStats(stats: QueryStats): void {
    this.queryStats.push(stats);
    
    // Manter apenas as últimas N estatísticas
    if (this.queryStats.length > this.maxStatsHistory) {
      this.queryStats = this.queryStats.slice(-this.maxStatsHistory);
    }
  }

  private summarizePlan(plan: any): any {
    return {
      nodeType: plan['Node Type'],
      totalCost: plan['Total Cost'],
      actualTime: plan['Actual Total Time'],
      rows: plan['Actual Rows'],
      planningTime: plan['Planning Time'],
      executionTime: plan['Execution Time']
    };
  }

  private async generateIndexSuggestions(): Promise<IndexSuggestion[]> {
    // Análise básica de sugestões de índices
    const suggestions: IndexSuggestion[] = [];
    
    // Analisar queries lentas para sugerir índices
    const slowQueries = this.queryStats.filter(stat => 
      stat.executionTime > this.slowQueryThreshold
    );
    
    // Lógica simplificada de sugestões
    if (slowQueries.some(q => q.query.includes('WHERE email'))) {
      suggestions.push({
        table: 'profiles',
        columns: ['email'],
        type: 'btree',
        reason: 'Queries frequentes por email detectadas',
        estimatedImprovement: '50-80% redução no tempo de busca'
      });
    }
    
    return suggestions;
  }

  private async createIndexIfNotExists(index: {
    name: string;
    table: string;
    columns: string[];
    type: string;
    reason: string;
  }): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Verificar se índice já existe
      const existsResult = await client.query(
        'SELECT 1 FROM pg_indexes WHERE indexname = $1',
        [index.name]
      );
      
      if (existsResult.rows.length === 0) {
        const columnsStr = index.columns.join(', ');
        let createQuery = '';
        
        if (index.type === 'gin') {
          createQuery = `CREATE INDEX ${index.name} ON ${index.table} USING gin(to_tsvector('portuguese', ${index.columns[0]}))`;
        } else {
          createQuery = `CREATE INDEX ${index.name} ON ${index.table} USING ${index.type} (${columnsStr})`;
        }
        
        await client.query(createQuery);
        logger.info('Índice criado', { 
          name: index.name, 
          table: index.table, 
          reason: index.reason 
        });
      }
      
    } catch (error) {
      logger.error('Erro ao criar índice', { index: index.name, error });
    } finally {
      client.release();
    }
  }
}

export { QueryOptimizer, QueryStats, IndexSuggestion };