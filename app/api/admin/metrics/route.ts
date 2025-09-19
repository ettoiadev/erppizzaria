/**
 * API de Métricas do Sistema - FASE 2 (Simplificada)
 * Endpoint para dashboard de monitoramento e métricas
 */

import { NextRequest, NextResponse } from 'next/server';
import { structuredLogger } from '@/lib/structured-logger';
import { query } from '@/lib/db';

// Tipos para métricas
interface SystemMetrics {
  timestamp: string;
  uptime: number;
  health: {
    overall_status: string;
    database_status: string;
    database_response_time: number;
  };
  performance: {
    memory_usage_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
  };
  database: {
    total_tables: number;
    total_records: {
      categories: number;
      products: number;
      orders: number;
      customers: number;
    };
  };
  business: {
    today_orders: number;
    total_customers: number;
    total_products: number;
  };
}

class MetricsCollector {
  private startTime = Date.now();

  async collectHealthMetrics() {
    try {
      const startTime = Date.now();
      await query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        overall_status: responseTime < 1000 ? 'healthy' : 'degraded',
        database_status: responseTime < 1000 ? 'healthy' : 'degraded',
        database_response_time: responseTime
      };
    } catch (error) {
      structuredLogger.error('Failed to collect health metrics', {
        context: 'metrics',
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        overall_status: 'unhealthy',
        database_status: 'unhealthy',
        database_response_time: 0
      };
    }
  }

  collectPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      memory_usage_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024)
    };
  }

  async collectDatabaseMetrics() {
    try {
      // Contagem de tabelas
      const tableStats = await query(`
        SELECT count(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      // Contagem de registros por tabela principal
      const recordCounts = await query(`
        SELECT 
          (SELECT count(*) FROM categories) as categories,
          (SELECT count(*) FROM products) as products,
          (SELECT count(*) FROM orders) as orders,
          (SELECT count(*) FROM customers) as customers
      `);
      
      const tableCount = tableStats.rows[0].table_count;
      const records = recordCounts.rows[0];
      
      return {
        total_tables: parseInt(tableCount),
        total_records: {
          categories: parseInt(records.categories),
          products: parseInt(records.products),
          orders: parseInt(records.orders),
          customers: parseInt(records.customers)
        }
      };
    } catch (error) {
      structuredLogger.error('Failed to collect database metrics', {
        context: 'metrics',
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        total_tables: 0,
        total_records: {
          categories: 0,
          products: 0,
          orders: 0,
          customers: 0
        }
      };
    }
  }

  async collectBusinessMetrics() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Pedidos de hoje
      const todayStats = await query(`
        SELECT count(*) as order_count
        FROM orders 
        WHERE DATE(created_at) = $1
      `, [today]);
      
      // Total de clientes e produtos
      const totals = await query(`
        SELECT 
          (SELECT count(*) FROM customers) as total_customers,
          (SELECT count(*) FROM products) as total_products
      `);
      
      const todayData = todayStats.rows[0];
      const totalsData = totals.rows[0];
      
      return {
        today_orders: parseInt(todayData.order_count),
        total_customers: parseInt(totalsData.total_customers),
        total_products: parseInt(totalsData.total_products)
      };
    } catch (error) {
      structuredLogger.error('Failed to collect business metrics', {
        context: 'metrics',
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        today_orders: 0,
        total_customers: 0,
        total_products: 0
      };
    }
  }

  async collectAllMetrics(): Promise<SystemMetrics> {
    const [health, database, business] = await Promise.all([
      this.collectHealthMetrics(),
      this.collectDatabaseMetrics(),
      this.collectBusinessMetrics()
    ]);
    
    const performance = this.collectPerformanceMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      health,
      performance,
      database,
      business
    };
  }
}

// GET - Obter métricas do sistema
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    structuredLogger.info('Admin metrics requested', {
      context: 'metrics',
      endpoint: '/api/admin/metrics'
    });

    const collector = new MetricsCollector();
    const metrics = await collector.collectAllMetrics();

    structuredLogger.info('Metrics collected successfully', {
      context: 'metrics',
      health_status: metrics.health.overall_status,
      memory_usage: metrics.performance.memory_usage_mb
    });

    return NextResponse.json({
      success: true,
      metrics
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    structuredLogger.error('Failed to collect metrics', {
      context: 'metrics',
      endpoint: '/api/admin/metrics',
      error: errorMessage
    });

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// OPTIONS - CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}