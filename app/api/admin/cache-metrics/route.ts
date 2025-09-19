/**
 * API de Métricas de Cache e Performance
 * Fase 3 - Otimizações Avançadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, createOptionsHandler } from '@/lib/auth-utils';
import { validateAdminAuth, createAuthErrorResponse } from '@/lib/auth-utils';
import { cache, categoriesCache, productsCache, ordersCache, cacheUtils } from '@/lib/intelligent-cache';
import { logger } from '@/lib/logger';
import { query } from '@/lib/db';

// Handler GET para obter métricas de cache
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401);
  }

  try {
    logger.info('Obtendo métricas de cache e performance');

    // Obter estatísticas de todos os caches
    const cacheStats = cacheUtils.getAllStats();

    // Obter informações detalhadas dos caches
    const cacheInfo = {
      main: cache.getInfo(),
      categories: categoriesCache.getInfo(),
      products: productsCache.getInfo(),
      orders: ordersCache.getInfo()
    };

    // Obter métricas de performance do sistema
    const systemMetrics = await getSystemMetrics();

    // Obter estatísticas do banco de dados
    const dbStats = await getDatabaseMetrics();

    // Calcular métricas consolidadas
    const consolidatedMetrics = calculateConsolidatedMetrics(cacheStats);

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      cache: {
        stats: cacheStats,
        info: cacheInfo,
        consolidated: consolidatedMetrics
      },
      system: systemMetrics,
      database: dbStats
    };

    return addCorsHeaders(NextResponse.json(response));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao obter métricas de cache', { errorMessage });
    return addCorsHeaders(NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 }));
  }
}

// Handler POST para limpar cache
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validar autenticação de admin
  const authResult = await validateAdminAuth(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || 'Acesso negado', 401);
  }

  try {
    const body = await request.json();
    const { action, cacheType, key } = body;

    logger.info('Executando ação de cache', { action, cacheType, key });

    let result: any = {};

    switch (action) {
      case 'clear':
        if (cacheType === 'all') {
          cache.clear();
          categoriesCache.clear();
          productsCache.clear();
          ordersCache.clear();
          result = { message: 'Todos os caches foram limpos' };
        } else if (cacheType === 'categories') {
          categoriesCache.clear();
          result = { message: 'Cache de categorias limpo' };
        } else if (cacheType === 'products') {
          productsCache.clear();
          result = { message: 'Cache de produtos limpo' };
        } else if (cacheType === 'orders') {
          ordersCache.clear();
          result = { message: 'Cache de pedidos limpo' };
        } else {
          return addCorsHeaders(NextResponse.json({
            success: false,
            error: 'Tipo de cache inválido'
          }, { status: 400 }));
        }
        break;

      case 'delete':
        if (!key) {
          return addCorsHeaders(NextResponse.json({
            success: false,
            error: 'Chave é obrigatória para deletar'
          }, { status: 400 }));
        }
        
        const deleted = cache.delete(key) || 
                       categoriesCache.delete(key) || 
                       productsCache.delete(key) || 
                       ordersCache.delete(key);
        
        result = { 
          message: deleted ? 'Chave deletada com sucesso' : 'Chave não encontrada',
          deleted 
        };
        break;

      case 'invalidate-tag':
        if (!key) {
          return addCorsHeaders(NextResponse.json({
            success: false,
            error: 'Tag é obrigatória para invalidar'
          }, { status: 400 }));
        }
        
        const invalidatedCount = cache.invalidateByTag(key) +
                               categoriesCache.invalidateByTag(key) +
                               productsCache.invalidateByTag(key) +
                               ordersCache.invalidateByTag(key);
        
        result = { 
          message: `${invalidatedCount} itens invalidados com a tag '${key}'`,
          count: invalidatedCount 
        };
        break;

      default:
        return addCorsHeaders(NextResponse.json({
          success: false,
          error: 'Ação inválida'
        }, { status: 400 }));
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      ...result
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao executar ação de cache', { errorMessage });
    return addCorsHeaders(NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 }));
  }
}

// Funções auxiliares
async function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    },
    uptime: {
      seconds: Math.round(uptime),
      formatted: formatUptime(uptime)
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

async function getDatabaseMetrics() {
  try {
    // Estatísticas básicas do banco
    const dbStatsResult = await query(`
      SELECT 
        datname,
        numbackends as active_connections,
        xact_commit as transactions_committed,
        xact_rollback as transactions_rolled_back,
        blks_read as blocks_read,
        blks_hit as blocks_hit,
        tup_returned as tuples_returned,
        tup_fetched as tuples_fetched,
        tup_inserted as tuples_inserted,
        tup_updated as tuples_updated,
        tup_deleted as tuples_deleted
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);

    // Tamanho do banco de dados
    const dbSizeResult = await query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
    `);

    // Estatísticas de tabelas principais
    const tableStatsResult = await query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_stat_user_tables 
      WHERE tablename IN ('categories', 'products', 'orders', 'order_items', 'profiles')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    const dbStats = dbStatsResult.rows[0] || {};
    const dbSize = dbSizeResult.rows[0]?.database_size || 'N/A';
    
    // Calcular cache hit ratio
    const cacheHitRatio = dbStats.blocks_hit && dbStats.blocks_read 
      ? ((dbStats.blocks_hit / (dbStats.blocks_hit + dbStats.blocks_read)) * 100).toFixed(2)
      : 'N/A';

    return {
      ...dbStats,
      database_size: dbSize,
      cache_hit_ratio: cacheHitRatio + '%',
      tables: tableStatsResult.rows
    };
  } catch (error) {
    logger.error('Erro ao obter métricas do banco de dados', { error });
    return {
      error: 'Não foi possível obter métricas do banco de dados'
    };
  }
}

function calculateConsolidatedMetrics(cacheStats: any) {
  const allStats = Object.values(cacheStats) as any[];
  
  const totalHits = allStats.reduce((sum, stat) => sum + (stat.hits || 0), 0);
  const totalMisses = allStats.reduce((sum, stat) => sum + (stat.misses || 0), 0);
  const totalSets = allStats.reduce((sum, stat) => sum + (stat.sets || 0), 0);
  const totalDeletes = allStats.reduce((sum, stat) => sum + (stat.deletes || 0), 0);
  const totalEvictions = allStats.reduce((sum, stat) => sum + (stat.evictions || 0), 0);
  const totalSize = allStats.reduce((sum, stat) => sum + (stat.totalSize || 0), 0);
  
  const totalRequests = totalHits + totalMisses;
  const overallHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  const overallMissRate = totalRequests > 0 ? (totalMisses / totalRequests) * 100 : 0;
  
  return {
    totalHits,
    totalMisses,
    totalSets,
    totalDeletes,
    totalEvictions,
    totalSize,
    totalRequests,
    overallHitRate: parseFloat(overallHitRate.toFixed(2)),
    overallMissRate: parseFloat(overallMissRate.toFixed(2)),
    efficiency: overallHitRate > 80 ? 'Excelente' : 
               overallHitRate > 60 ? 'Boa' : 
               overallHitRate > 40 ? 'Regular' : 'Ruim'
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
}

export const OPTIONS = createOptionsHandler();