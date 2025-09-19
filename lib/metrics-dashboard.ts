/**
 * Dashboard de Métricas Avançado
 * Fase 3 - Melhorias do Plano de Correção
 */

import { Pool } from 'pg';
import { frontendLogger } from './frontend-logger';

interface MetricData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

interface EndpointMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  timestamp: Date;
}

interface BusinessMetrics {
  activeUsers: number;
  ordersToday: number;
  revenueToday: number;
  conversionRate: number;
  averageOrderValue: number;
  timestamp: Date;
}

class MetricsDashboard {
  private pool: Pool;
  private metricsBuffer: Map<string, MetricData[]> = new Map();
  private readonly BUFFER_SIZE = 1000;
  private readonly FLUSH_INTERVAL = 30000; // 30 segundos

  constructor(pool: Pool) {
    this.pool = pool;
    this.startPeriodicFlush();
  }

  /**
   * Registra métricas de endpoint
   */
  async recordEndpointMetric(metric: EndpointMetrics): Promise<void> {
    try {
      const key = `endpoint_${metric.endpoint}_${metric.method}`;
      this.addToBuffer(key, {
        timestamp: metric.timestamp,
        value: metric.responseTime,
        metadata: {
          statusCode: metric.statusCode,
          userAgent: metric.userAgent,
          ip: metric.ip
        }
      });

      // Log para análise imediata
      frontendLogger.info('Endpoint metric recorded', {
        endpoint: metric.endpoint,
        method: metric.method,
        responseTime: metric.responseTime,
        statusCode: metric.statusCode
      });
    } catch (error) {
      frontendLogger.logError('Error recording endpoint metric', error);
    }
  }

  /**
   * Registra métricas do sistema
   */
  async recordSystemMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      const queries = [
        {
          key: 'system_cpu',
          value: metrics.cpuUsage,
          metadata: { type: 'cpu_usage' }
        },
        {
          key: 'system_memory',
          value: metrics.memoryUsage,
          metadata: { type: 'memory_usage' }
        },
        {
          key: 'system_disk',
          value: metrics.diskUsage,
          metadata: { type: 'disk_usage' }
        },
        {
          key: 'system_connections',
          value: metrics.activeConnections,
          metadata: { type: 'active_connections' }
        }
      ];

      for (const query of queries) {
        this.addToBuffer(query.key, {
          timestamp: metrics.timestamp,
          value: query.value,
          metadata: query.metadata
        });
      }

      frontendLogger.info('System metrics recorded', {
        cpuUsage: metrics.cpuUsage,
        memoryUsage: metrics.memoryUsage,
        activeConnections: metrics.activeConnections
      });
    } catch (error) {
      frontendLogger.logError('Error recording system metrics', error);
    }
  }

  /**
   * Registra métricas de negócio
   */
  async recordBusinessMetrics(metrics: BusinessMetrics): Promise<void> {
    try {
      const queries = [
        {
          key: 'business_active_users',
          value: metrics.activeUsers,
          metadata: { type: 'active_users' }
        },
        {
          key: 'business_orders_today',
          value: metrics.ordersToday,
          metadata: { type: 'orders_count' }
        },
        {
          key: 'business_revenue_today',
          value: metrics.revenueToday,
          metadata: { type: 'revenue' }
        },
        {
          key: 'business_conversion_rate',
          value: metrics.conversionRate,
          metadata: { type: 'conversion_rate' }
        },
        {
          key: 'business_avg_order_value',
          value: metrics.averageOrderValue,
          metadata: { type: 'average_order_value' }
        }
      ];

      for (const query of queries) {
        this.addToBuffer(query.key, {
          timestamp: metrics.timestamp,
          value: query.value,
          metadata: query.metadata
        });
      }

      frontendLogger.info('Business metrics recorded', {
        activeUsers: metrics.activeUsers,
        ordersToday: metrics.ordersToday,
        revenueToday: metrics.revenueToday,
        conversionRate: metrics.conversionRate
      });
    } catch (error) {
      frontendLogger.logError('Error recording business metrics', error);
    }
  }

  /**
   * Obtém métricas de tempo de resposta por endpoint
   */
  async getEndpointMetrics(timeRange: string = '1h'): Promise<any[]> {
    try {
      const query = `
        SELECT 
          endpoint,
          method,
          AVG(response_time) as avg_response_time,
          MIN(response_time) as min_response_time,
          MAX(response_time) as max_response_time,
          COUNT(*) as request_count,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM metrics_endpoints 
        WHERE created_at >= NOW() - INTERVAL '${timeRange}'
        GROUP BY endpoint, method
        ORDER BY avg_response_time DESC
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      frontendLogger.logError('Error getting endpoint metrics', error);
      return [];
    }
  }

  /**
   * Obtém métricas do sistema
   */
  async getSystemMetrics(timeRange: string = '1h'): Promise<any[]> {
    try {
      const query = `
        SELECT 
          metric_type,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          created_at
        FROM metrics_system 
        WHERE created_at >= NOW() - INTERVAL '${timeRange}'
        GROUP BY metric_type, DATE_TRUNC('minute', created_at)
        ORDER BY created_at DESC
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      frontendLogger.logError('Error getting system metrics', error);
      return [];
    }
  }

  /**
   * Obtém métricas de negócio
   */
  async getBusinessMetrics(timeRange: string = '24h'): Promise<any> {
    try {
      const queries = {
        activeUsers: `
          SELECT COUNT(DISTINCT user_id) as count
          FROM user_sessions 
          WHERE last_activity >= NOW() - INTERVAL '1h'
        `,
        ordersToday: `
          SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
          FROM orders 
          WHERE DATE(created_at) = CURRENT_DATE
        `,
        conversionRate: `
          SELECT 
            COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN s.user_id END) * 100.0 / 
            NULLIF(COUNT(DISTINCT s.user_id), 0) as rate
          FROM user_sessions s
          LEFT JOIN orders o ON s.user_id = o.user_id 
            AND DATE(o.created_at) = CURRENT_DATE
          WHERE DATE(s.created_at) = CURRENT_DATE
        `,
        averageOrderValue: `
          SELECT AVG(total_amount) as avg_value
          FROM orders 
          WHERE created_at >= NOW() - INTERVAL '${timeRange}'
        `
      };

      const results = await Promise.all([
        this.pool.query(queries.activeUsers),
        this.pool.query(queries.ordersToday),
        this.pool.query(queries.conversionRate),
        this.pool.query(queries.averageOrderValue)
      ]);

      return {
        activeUsers: results[0].rows[0]?.count || 0,
        ordersToday: results[1].rows[0]?.count || 0,
        revenueToday: results[1].rows[0]?.revenue || 0,
        conversionRate: results[2].rows[0]?.rate || 0,
        averageOrderValue: results[3].rows[0]?.avg_value || 0
      };
    } catch (error) {
      frontendLogger.logError('Error getting business metrics', error);
      return {
        activeUsers: 0,
        ordersToday: 0,
        revenueToday: 0,
        conversionRate: 0,
        averageOrderValue: 0
      };
    }
  }

  /**
   * Obtém dashboard completo
   */
  async getDashboardData(): Promise<any> {
    try {
      const [endpointMetrics, systemMetrics, businessMetrics] = await Promise.all([
        this.getEndpointMetrics('1h'),
        this.getSystemMetrics('1h'),
        this.getBusinessMetrics('24h')
      ]);

      return {
        timestamp: new Date(),
        endpoints: endpointMetrics,
        system: systemMetrics,
        business: businessMetrics,
        summary: {
          totalRequests: endpointMetrics.reduce((sum, metric) => sum + metric.request_count, 0),
          totalErrors: endpointMetrics.reduce((sum, metric) => sum + metric.error_count, 0),
          avgResponseTime: endpointMetrics.reduce((sum, metric) => sum + metric.avg_response_time, 0) / endpointMetrics.length || 0
        }
      };
    } catch (error) {
      frontendLogger.logError('Error getting dashboard data', error);
      return {
        timestamp: new Date(),
        endpoints: [],
        system: [],
        business: {},
        summary: {
          totalRequests: 0,
          totalErrors: 0,
          avgResponseTime: 0
        }
      };
    }
  }

  /**
   * Adiciona métrica ao buffer
   */
  private addToBuffer(key: string, metric: MetricData): void {
    if (!this.metricsBuffer.has(key)) {
      this.metricsBuffer.set(key, []);
    }

    const buffer = this.metricsBuffer.get(key)!;
    buffer.push(metric);

    // Limita o tamanho do buffer
    if (buffer.length > this.BUFFER_SIZE) {
      buffer.shift();
    }
  }

  /**
   * Flush periódico dos dados para o banco
   */
  private startPeriodicFlush(): void {
    setInterval(async () => {
      await this.flushMetrics();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Flush das métricas para o banco de dados
   */
  private async flushMetrics(): Promise<void> {
    try {
      for (const [key, metrics] of this.metricsBuffer.entries()) {
        if (metrics.length === 0) continue;

        const tableName = this.getTableName(key);
        const values = metrics.map(metric => {
          return `('${key}', ${metric.value}, '${JSON.stringify(metric.metadata || {})}', '${metric.timestamp.toISOString()}')`;
        }).join(',');

        const query = `
          INSERT INTO ${tableName} (metric_key, value, metadata, created_at)
          VALUES ${values}
          ON CONFLICT DO NOTHING
        `;

        await this.pool.query(query);
        
        // Limpa o buffer após o flush
        this.metricsBuffer.set(key, []);
      }

      frontendLogger.info('Metrics flushed to database');
    } catch (error) {
      frontendLogger.logError('Error flushing metrics', error);
    }
  }

  /**
   * Determina a tabela baseada na chave da métrica
   */
  private getTableName(key: string): string {
    if (key.startsWith('endpoint_')) return 'metrics_endpoints';
    if (key.startsWith('system_')) return 'metrics_system';
    if (key.startsWith('business_')) return 'metrics_business';
    return 'metrics_general';
  }

  /**
   * Coleta métricas do sistema atual
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const process = require('process');
      const os = require('os');

      // Uso de CPU (aproximado)
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

      // Uso de memória
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const memoryPercent = (memUsage.heapUsed / totalMem) * 100;

      // Conexões ativas do PostgreSQL
      const connectionQuery = `
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE state = 'active'
      `;
      const connectionResult = await this.pool.query(connectionQuery);
      const activeConnections = parseInt(connectionResult.rows[0]?.active_connections || '0');

      return {
        cpuUsage: cpuPercent,
        memoryUsage: memoryPercent,
        diskUsage: 0, // Placeholder - requer implementação específica
        activeConnections,
        timestamp: new Date()
      };
    } catch (error) {
      frontendLogger.logError('Error collecting system metrics', error);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        activeConnections: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Coleta métricas de negócio atuais
   */
  async collectBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      const metrics = await this.getBusinessMetrics('24h');
      return {
        activeUsers: metrics.activeUsers,
        ordersToday: metrics.ordersToday,
        revenueToday: metrics.revenueToday,
        conversionRate: metrics.conversionRate,
        averageOrderValue: metrics.averageOrderValue,
        timestamp: new Date()
      };
    } catch (error) {
      frontendLogger.logError('Error collecting business metrics', error);
      return {
        activeUsers: 0,
        ordersToday: 0,
        revenueToday: 0,
        conversionRate: 0,
        averageOrderValue: 0,
        timestamp: new Date()
      };
    }
  }
}

export { MetricsDashboard, EndpointMetrics, SystemMetrics, BusinessMetrics };