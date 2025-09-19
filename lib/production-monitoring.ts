/**
 * Sistema de Monitoramento de Produção
 * Fase 3 - Melhorias do Plano de Correção
 */

import { Pool } from 'pg';
import { frontendLogger } from './frontend-logger';
import { MetricsDashboard } from './metrics-dashboard';
import { AlertSystem } from './alert-system';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: Record<string, any>;
  timestamp: Date;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  metrics: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    responseTime: number;
    errorRate: number;
  };
  alerts: {
    active: number;
    critical: number;
    high: number;
  };
  timestamp: Date;
}

interface ProductionReport {
  period: string;
  summary: {
    totalRequests: number;
    totalErrors: number;
    averageResponseTime: number;
    uptime: number;
    peakConcurrentUsers: number;
    totalRevenue: number;
    totalOrders: number;
  };
  performance: {
    slowestEndpoints: Array<{
      endpoint: string;
      averageTime: number;
      requestCount: number;
    }>;
    errorsByEndpoint: Array<{
      endpoint: string;
      errorCount: number;
      errorRate: number;
    }>;
    peakHours: Array<{
      hour: string;
      requestCount: number;
      averageResponseTime: number;
    }>;
  };
  business: {
    conversionRate: number;
    averageOrderValue: number;
    topProducts: Array<{
      productName: string;
      orderCount: number;
      revenue: number;
    }>;
    customerMetrics: {
      newCustomers: number;
      returningCustomers: number;
      churnRate: number;
    };
  };
  alerts: {
    totalAlerts: number;
    criticalAlerts: number;
    averageResolutionTime: number;
    topAlertTypes: Array<{
      type: string;
      count: number;
    }>;
  };
  recommendations: string[];
  timestamp: Date;
}

class ProductionMonitoring {
  private pool: Pool;
  private metricsDashboard: MetricsDashboard;
  private alertSystem: AlertSystem;
  private healthChecks: Map<string, () => Promise<HealthCheckResult>> = new Map();

  constructor(pool: Pool, metricsDashboard: MetricsDashboard, alertSystem: AlertSystem) {
    this.pool = pool;
    this.metricsDashboard = metricsDashboard;
    this.alertSystem = alertSystem;
    this.initializeHealthChecks();
  }

  /**
   * Inicializa verificações de saúde do sistema
   */
  private initializeHealthChecks(): void {
    // Health check do banco de dados
    this.healthChecks.set('database', async () => {
      const startTime = Date.now();
      try {
        await this.pool.query('SELECT 1');
        return {
          service: 'database',
          status: 'healthy',
          responseTime: Date.now() - startTime,
          details: { connectionPool: 'active' },
          timestamp: new Date()
        };
      } catch (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date()
        };
      }
    });

    // Health check da API
    this.healthChecks.set('api', async () => {
      const startTime = Date.now();
      try {
        // Simula verificação de endpoints críticos
        const criticalEndpoints = ['/api/categories', '/api/products', '/api/orders'];
        const checks = await Promise.all(
          criticalEndpoints.map(async (endpoint) => {
            try {
              // Aqui você faria uma requisição real para o endpoint
              // Por enquanto, simulamos uma verificação
              await new Promise(resolve => setTimeout(resolve, 10));
              return { endpoint, status: 'ok' };
            } catch {
              return { endpoint, status: 'error' };
            }
          })
        );

        const failedChecks = checks.filter(check => check.status === 'error');
        const status = failedChecks.length === 0 ? 'healthy' : 
                     failedChecks.length < checks.length ? 'degraded' : 'unhealthy';

        return {
          service: 'api',
          status,
          responseTime: Date.now() - startTime,
          details: { 
            endpoints: checks,
            failedCount: failedChecks.length,
            totalCount: checks.length
          },
          timestamp: new Date()
        };
      } catch (error) {
        return {
          service: 'api',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date()
        };
      }
    });

    // Health check do sistema
    this.healthChecks.set('system', async () => {
      const startTime = Date.now();
      try {
        const systemMetrics = await this.metricsDashboard.collectSystemMetrics();
        
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        
        if (systemMetrics.cpuUsage > 80 || systemMetrics.memoryUsage > 85) {
          status = 'degraded';
        }
        
        if (systemMetrics.cpuUsage > 95 || systemMetrics.memoryUsage > 95) {
          status = 'unhealthy';
        }

        return {
          service: 'system',
          status,
          responseTime: Date.now() - startTime,
          details: {
            cpuUsage: systemMetrics.cpuUsage,
            memoryUsage: systemMetrics.memoryUsage,
            activeConnections: systemMetrics.activeConnections
          },
          timestamp: new Date()
        };
      } catch (error) {
        return {
          service: 'system',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date()
        };
      }
    });
  }

  /**
   * Executa verificação completa de saúde do sistema
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    try {
      const healthResults = await Promise.all(
        Array.from(this.healthChecks.values()).map(check => check())
      );

      // Determina status geral
      const unhealthyServices = healthResults.filter(result => result.status === 'unhealthy');
      const degradedServices = healthResults.filter(result => result.status === 'degraded');
      
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (unhealthyServices.length > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedServices.length > 0) {
        overallStatus = 'degraded';
      }

      // Coleta métricas do sistema
      const systemMetrics = await this.metricsDashboard.collectSystemMetrics();
      const dashboardData = await this.metricsDashboard.getDashboardData();
      const activeAlerts = await this.alertSystem.getActiveAlerts();

      // Calcula uptime (simulado)
      const uptime = process.uptime();

      return {
        overall: overallStatus,
        services: healthResults,
        metrics: {
          uptime,
          memoryUsage: systemMetrics.memoryUsage,
          cpuUsage: systemMetrics.cpuUsage,
          activeConnections: systemMetrics.activeConnections,
          responseTime: dashboardData.summary.avgResponseTime,
          errorRate: dashboardData.summary.totalErrors > 0 
            ? (dashboardData.summary.totalErrors / dashboardData.summary.totalRequests) * 100 
            : 0
        },
        alerts: {
          active: activeAlerts.length,
          critical: activeAlerts.filter(alert => alert.severity === 'critical').length,
          high: activeAlerts.filter(alert => alert.severity === 'high').length
        },
        timestamp: new Date()
      };
    } catch (error) {
      frontendLogger.logError('Error checking system health', error);
      return {
        overall: 'unhealthy',
        services: [],
        metrics: {
          uptime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          activeConnections: 0,
          responseTime: 0,
          errorRate: 100
        },
        alerts: {
          active: 0,
          critical: 0,
          high: 0
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Gera relatório de produção
   */
  async generateProductionReport(period: string = '24h'): Promise<ProductionReport> {
    try {
      const endTime = new Date();
      const startTime = new Date();
      
      // Calcula período
      switch (period) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case '24h':
          startTime.setDate(startTime.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(startTime.getDate() - 30);
          break;
        default:
          startTime.setDate(startTime.getDate() - 1);
      }

      // Coleta dados de métricas
      const dashboardData = await this.metricsDashboard.getDashboardData();
      const businessMetrics = await this.metricsDashboard.getBusinessMetrics(period);
      const alertStats = await this.alertSystem.getAlertStats();

      // Consultas específicas para o relatório
      const performanceQueries = await this.getPerformanceData(startTime, endTime);
      const businessQueries = await this.getBusinessData(startTime, endTime);
      
      // Gera recomendações
      const recommendations = this.generateRecommendations(dashboardData, businessMetrics, alertStats);

      return {
        period,
        summary: {
          totalRequests: dashboardData.summary.totalRequests,
          totalErrors: dashboardData.summary.totalErrors,
          averageResponseTime: dashboardData.summary.avgResponseTime,
          uptime: process.uptime(),
          peakConcurrentUsers: businessMetrics.activeUsers,
          totalRevenue: businessMetrics.revenueToday,
          totalOrders: businessMetrics.ordersToday
        },
        performance: performanceQueries,
        business: businessQueries,
        alerts: {
          totalAlerts: alertStats.reduce((sum: number, stat: any) => sum + stat.total, 0),
          criticalAlerts: alertStats.find((stat: any) => stat.severity === 'critical')?.total || 0,
          averageResolutionTime: alertStats.reduce((sum: number, stat: any) => sum + (stat.avg_resolution_time_minutes || 0), 0) / alertStats.length || 0,
          topAlertTypes: alertStats.map((stat: any) => ({
            type: stat.severity,
            count: stat.total
          }))
        },
        recommendations,
        timestamp: new Date()
      };
    } catch (error) {
      frontendLogger.logError('Error generating production report', error);
      throw error;
    }
  }

  /**
   * Coleta dados de performance
   */
  private async getPerformanceData(startTime: Date, endTime: Date): Promise<any> {
    try {
      // Endpoints mais lentos
      const slowestEndpointsQuery = `
        SELECT 
          endpoint,
          AVG(response_time) as average_time,
          COUNT(*) as request_count
        FROM metrics_endpoints 
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY endpoint
        ORDER BY average_time DESC
        LIMIT 10
      `;

      // Erros por endpoint
      const errorsByEndpointQuery = `
        SELECT 
          endpoint,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
          COUNT(*) as total_requests,
          (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)) as error_rate
        FROM metrics_endpoints 
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY endpoint
        HAVING COUNT(CASE WHEN status_code >= 400 THEN 1 END) > 0
        ORDER BY error_rate DESC
        LIMIT 10
      `;

      // Horários de pico
      const peakHoursQuery = `
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as request_count,
          AVG(response_time) as average_response_time
        FROM metrics_endpoints 
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY request_count DESC
        LIMIT 24
      `;

      const [slowestEndpoints, errorsByEndpoint, peakHours] = await Promise.all([
        this.pool.query(slowestEndpointsQuery, [startTime, endTime]),
        this.pool.query(errorsByEndpointQuery, [startTime, endTime]),
        this.pool.query(peakHoursQuery, [startTime, endTime])
      ]);

      return {
        slowestEndpoints: slowestEndpoints.rows.map(row => ({
          endpoint: row.endpoint,
          averageTime: parseFloat(row.average_time),
          requestCount: parseInt(row.request_count)
        })),
        errorsByEndpoint: errorsByEndpoint.rows.map(row => ({
          endpoint: row.endpoint,
          errorCount: parseInt(row.error_count),
          errorRate: parseFloat(row.error_rate)
        })),
        peakHours: peakHours.rows.map(row => ({
          hour: row.hour,
          requestCount: parseInt(row.request_count),
          averageResponseTime: parseFloat(row.average_response_time)
        }))
      };
    } catch (error) {
      frontendLogger.logError('Error getting performance data', error);
      return {
        slowestEndpoints: [],
        errorsByEndpoint: [],
        peakHours: []
      };
    }
  }

  /**
   * Coleta dados de negócio
   */
  private async getBusinessData(startTime: Date, endTime: Date): Promise<any> {
    try {
      // Produtos mais vendidos
      const topProductsQuery = `
        SELECT 
          p.name as product_name,
          COUNT(oi.id) as order_count,
          SUM(oi.total_price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at BETWEEN $1 AND $2
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 10
      `;

      // Métricas de clientes
      const customerMetricsQuery = `
        SELECT 
          COUNT(DISTINCT CASE WHEN u.created_at BETWEEN $1 AND $2 THEN u.id END) as new_customers,
          COUNT(DISTINCT CASE WHEN u.created_at < $1 AND o.created_at BETWEEN $1 AND $2 THEN u.id END) as returning_customers
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
      `;

      const [topProducts, customerMetrics] = await Promise.all([
        this.pool.query(topProductsQuery, [startTime, endTime]),
        this.pool.query(customerMetricsQuery, [startTime, endTime])
      ]);

      const businessMetrics = await this.metricsDashboard.getBusinessMetrics('24h');

      return {
        conversionRate: businessMetrics.conversionRate,
        averageOrderValue: businessMetrics.averageOrderValue,
        topProducts: topProducts.rows.map(row => ({
          productName: row.product_name,
          orderCount: parseInt(row.order_count),
          revenue: parseFloat(row.revenue)
        })),
        customerMetrics: {
          newCustomers: parseInt(customerMetrics.rows[0]?.new_customers || '0'),
          returningCustomers: parseInt(customerMetrics.rows[0]?.returning_customers || '0'),
          churnRate: 0 // Placeholder - requer cálculo mais complexo
        }
      };
    } catch (error) {
      frontendLogger.logError('Error getting business data', error);
      return {
        conversionRate: 0,
        averageOrderValue: 0,
        topProducts: [],
        customerMetrics: {
          newCustomers: 0,
          returningCustomers: 0,
          churnRate: 0
        }
      };
    }
  }

  /**
   * Gera recomendações baseadas nos dados
   */
  private generateRecommendations(dashboardData: any, businessMetrics: any, alertStats: any[]): string[] {
    const recommendations: string[] = [];

    // Recomendações de performance
    if (dashboardData.summary.avgResponseTime > 1000) {
      recommendations.push('Considere otimizar endpoints com tempo de resposta alto (>1s)');
    }

    if (dashboardData.summary.totalErrors > 0) {
      const errorRate = (dashboardData.summary.totalErrors / dashboardData.summary.totalRequests) * 100;
      if (errorRate > 5) {
        recommendations.push(`Taxa de erro alta (${errorRate.toFixed(2)}%). Investigue e corrija erros frequentes`);
      }
    }

    // Recomendações de negócio
    if (businessMetrics.conversionRate < 2) {
      recommendations.push('Taxa de conversão baixa. Considere melhorar UX e processo de checkout');
    }

    if (businessMetrics.ordersToday === 0) {
      recommendations.push('Nenhum pedido hoje. Verifique campanhas de marketing e disponibilidade do sistema');
    }

    // Recomendações de alertas
    const criticalAlerts = alertStats.find(stat => stat.severity === 'critical');
    if (criticalAlerts && criticalAlerts.active > 0) {
      recommendations.push('Alertas críticos ativos. Resolva imediatamente para evitar impacto no serviço');
    }

    // Recomendações gerais
    if (recommendations.length === 0) {
      recommendations.push('Sistema operando dentro dos parâmetros normais. Continue monitorando');
    }

    return recommendations;
  }
}

export { ProductionMonitoring, SystemHealth, ProductionReport, HealthCheckResult };