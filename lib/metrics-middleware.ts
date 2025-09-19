/**
 * Middleware para Captura Automática de Métricas
 * Fase 3 - Melhorias do Plano de Correção
 */

import { NextRequest, NextResponse } from 'next/server';
import { MetricsDashboard, EndpointMetrics } from './metrics-dashboard';
import { frontendLogger } from './frontend-logger';
import { pool } from './db';

// Instância global do dashboard de métricas
let metricsDashboard: MetricsDashboard | null = null;

/**
 * Inicializa o dashboard de métricas
 */
function getMetricsDashboard(): MetricsDashboard {
  if (!metricsDashboard) {
    metricsDashboard = new MetricsDashboard(pool);
  }
  return metricsDashboard;
}

/**
 * Middleware para capturar métricas de endpoints
 */
export function withMetrics<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    let request: NextRequest | undefined;
    let response: NextResponse;
    
    // Tenta extrair o request dos argumentos
    for (const arg of args) {
      if (arg && typeof arg === 'object' && 'url' in arg) {
        request = arg as NextRequest;
        break;
      }
    }

    try {
      // Executa o handler original
      response = await handler(...args);
      
      // Captura métricas após a execução
      await captureMetrics(request, response, startTime);
      
      return response;
    } catch (error) {
      // Captura métricas de erro
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      await captureMetrics(request, errorResponse, startTime);
      
      throw error;
    }
  };
}

/**
 * Captura métricas do endpoint
 */
async function captureMetrics(
  request: NextRequest | undefined,
  response: NextResponse,
  startTime: number
): Promise<void> {
  try {
    if (!request) return;

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const method = request.method;
    const statusCode = response.status;
    
    // Extrai informações do request
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor || realIp || 'unknown';

    const metric: EndpointMetrics = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: new Date(),
      userAgent,
      ip
    };

    // Registra a métrica
    const dashboard = getMetricsDashboard();
    await dashboard.recordEndpointMetric(metric);

    // Log adicional para endpoints lentos ou com erro
    if (responseTime > 1000 || statusCode >= 400) {
      frontendLogger.info('Slow or error endpoint detected', {
        endpoint,
        method,
        responseTime,
        statusCode,
        ip
      });
    }
  } catch (error) {
    frontendLogger.logError('Error capturing endpoint metrics', error);
  }
}

/**
 * Middleware específico para APIs do Next.js
 */
export function createApiMetricsWrapper() {
  return function metricsWrapper(
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
      const startTime = Date.now();
      
      try {
        const response = await handler(req, context);
        await captureMetrics(req, response, startTime);
        return response;
      } catch (error) {
        const errorResponse = NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
        
        await captureMetrics(req, errorResponse, startTime);
        throw error;
      }
    };
  };
}

/**
 * Coleta métricas do sistema periodicamente
 */
export class SystemMetricsCollector {
  private dashboard: MetricsDashboard;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly COLLECTION_INTERVAL = 60000; // 1 minuto

  constructor() {
    this.dashboard = getMetricsDashboard();
  }

  /**
   * Inicia a coleta periódica de métricas
   */
  start(): void {
    if (this.intervalId) {
      return; // Já está rodando
    }

    this.intervalId = setInterval(async () => {
      await this.collectAndRecord();
    }, this.COLLECTION_INTERVAL);

    frontendLogger.info('System metrics collector started', {
      interval: this.COLLECTION_INTERVAL
    });
  }

  /**
   * Para a coleta de métricas
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      frontendLogger.info('System metrics collector stopped');
    }
  }

  /**
   * Coleta e registra métricas do sistema
   */
  private async collectAndRecord(): Promise<void> {
    try {
      // Coleta métricas do sistema
      const systemMetrics = await this.dashboard.collectSystemMetrics();
      await this.dashboard.recordSystemMetrics(systemMetrics);

      // Coleta métricas de negócio
      const businessMetrics = await this.dashboard.collectBusinessMetrics();
      await this.dashboard.recordBusinessMetrics(businessMetrics);

      frontendLogger.info('System and business metrics collected', {
        cpuUsage: systemMetrics.cpuUsage,
        memoryUsage: systemMetrics.memoryUsage,
        activeUsers: businessMetrics.activeUsers,
        ordersToday: businessMetrics.ordersToday
      });
    } catch (error) {
      frontendLogger.logError('Error collecting system metrics', error);
    }
  }
}

/**
 * Instância global do coletor de métricas
 */
let systemCollector: SystemMetricsCollector | null = null;

/**
 * Inicia o sistema de coleta de métricas
 */
export function startMetricsCollection(): void {
  if (!systemCollector) {
    systemCollector = new SystemMetricsCollector();
    systemCollector.start();
  }
}

/**
 * Para o sistema de coleta de métricas
 */
export function stopMetricsCollection(): void {
  if (systemCollector) {
    systemCollector.stop();
    systemCollector = null;
  }
}

/**
 * Utilitário para medir tempo de execução de funções
 */
export function measureExecutionTime<T>(
  fn: () => Promise<T>,
  metricName: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const executionTime = Date.now() - startTime;
      
      frontendLogger.info(`Execution time measured: ${metricName}`, {
        executionTime,
        metricName
      });
      
      resolve(result);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      frontendLogger.logError(`Execution failed: ${metricName}`, {
        error,
        executionTime,
        metricName
      });
      
      reject(error);
    }
  });
}

/**
 * Decorator para medir tempo de execução de métodos
 */
export function MeasureTime(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      return measureExecutionTime(
        () => originalMethod.apply(this, args),
        name
      );
    };
    
    return descriptor;
  };
}

/**
 * Utilitário para registrar métricas customizadas
 */
export async function recordCustomMetric(
  key: string,
  value: number,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const dashboard = getMetricsDashboard();
    
    // Adiciona ao buffer interno (será implementado no dashboard)
    frontendLogger.info('Custom metric recorded', {
      key,
      value,
      metadata
    });
  } catch (error) {
    frontendLogger.logError('Error recording custom metric', error);
  }
}

/**
 * Middleware para rate limiting com métricas
 */
export function withRateLimitMetrics(
  rateLimitFn: (req: NextRequest) => Promise<{ allowed: boolean; resetTime?: number }>
) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    
    try {
      const result = await rateLimitFn(req);
      const responseTime = Date.now() - startTime;
      
      await recordCustomMetric('rate_limit_check_time', responseTime, {
        allowed: result.allowed,
        endpoint: new URL(req.url).pathname
      });
      
      if (!result.allowed) {
        await recordCustomMetric('rate_limit_blocked', 1, {
          endpoint: new URL(req.url).pathname,
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        });
      }
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      await recordCustomMetric('rate_limit_error', 1, {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });
      
      throw error;
    }
  };
}

export {