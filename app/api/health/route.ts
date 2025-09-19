import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { structuredLogger } from '@/lib/structured-logger';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      usage: {
        used: number;
        total: number;
        percentage: number;
      };
    };
    disk: {
      status: 'healthy' | 'unhealthy';
      usage?: {
        used: number;
        total: number;
        percentage: number;
      };
      error?: string;
    };
  };
}

// Função para verificar saúde do banco de dados
async function checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    await query('SELECT 1');
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'unhealthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

// Função para verificar uso de memória
function checkMemory(): { status: 'healthy' | 'unhealthy'; usage: { used: number; total: number; percentage: number } } {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;
  const percentage = (usedMemory / totalMemory) * 100;
  
  return {
    status: percentage < 95 ? 'healthy' : 'unhealthy', // Ajustado para 95%
    usage: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round(percentage)
    }
  };
}

// Função para verificar uso de disco (simulado)
function checkDisk(): { status: 'healthy' | 'unhealthy'; usage?: { used: number; total: number; percentage: number }; error?: string } {
  try {
    // Em um ambiente real, você usaria fs.statSync ou similar
    // Por agora, retornamos dados simulados
    const usage = {
      used: 45,
      total: 100,
      percentage: 45
    };
    
    return {
      status: usage.percentage < 85 ? 'healthy' : 'unhealthy',
      usage
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown disk error'
    };
  }
}

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    structuredLogger.info('Health check iniciado', {
      context: 'health_check',
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Executar todas as verificações
    const [databaseCheck, memoryCheck, diskCheck] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkDisk())
    ]);

    // Determinar status geral - priorizar banco de dados
    const overallStatus = databaseCheck.status === 'healthy' ? 'healthy' : 'unhealthy';

    const healthResult: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
        disk: diskCheck
      }
    };

    const responseTime = Date.now() - startTime;
    
    structuredLogger.info('Health check concluído', {
      context: 'health_check',
      status: overallStatus,
      responseTime,
      checks: {
        database: databaseCheck.status,
        memory: memoryCheck.status,
        disk: diskCheck.status
      }
    });

    // Retornar status HTTP apropriado
    const httpStatus = overallStatus === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthResult, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    structuredLogger.error('Erro no health check', {
      context: 'health_check',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
        memory: { status: 'unhealthy', usage: { used: 0, total: 0, percentage: 0 } },
        disk: { status: 'unhealthy', error: 'Health check failed' }
      }
    };

    return NextResponse.json(errorResult, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// HEAD /api/health - Lightweight health check
export async function HEAD(request: NextRequest) {
  try {
    // Verificação rápida apenas do banco
    const dbCheck = await checkDatabase();
    const status = dbCheck.status === 'healthy' ? 200 : 503;
    
    return new NextResponse(null, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

// OPTIONS /api/health - CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}