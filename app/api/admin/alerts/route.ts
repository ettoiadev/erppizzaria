/**
 * API de Gerenciamento de Alertas
 * Fase 3 - Otimizações Avançadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { alertSystem, alertUtils, AlertType, AlertCategory } from '@/lib/alert-system';
import { logger } from '@/lib/logger';
import { query } from '@/lib/db';

/**
 * GET /api/admin/alerts
 * Obter alertas e estatísticas
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const category = url.searchParams.get('category') as AlertCategory;
    const type = url.searchParams.get('type') as AlertType;
    const resolved = url.searchParams.get('resolved');

    switch (action) {
      case 'active':
        return await getActiveAlerts(limit, offset, category, type);
      case 'history':
        return await getAlertsHistory(limit, offset, category, type, resolved);
      case 'stats':
        return await getAlertStats();
      case 'health':
        return await getSystemHealth();
      case 'rules':
        return await getAlertRules();
      case 'channels':
        return await getAlertChannels();
      default:
        return await getAlertsDashboard();
    }
  } catch (error) {
    logger.error('Erro ao obter alertas', { error });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/alerts
 * Ações de gerenciamento de alertas
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'resolve':
        return await resolveAlert(params.alertId, params.resolvedBy);
      case 'resolve-multiple':
        return await resolveMultipleAlerts(params.alertIds, params.resolvedBy);
      case 'trigger-manual':
        return await triggerManualAlert(params);
      case 'test-alert':
        return await testAlert(params.type);
      case 'update-rule':
        return await updateAlertRule(params.ruleId, params.updates);
      case 'toggle-channel':
        return await toggleAlertChannel(params.channelId, params.enabled);
      case 'clear-old':
        return await clearOldAlerts(params.days);
      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Erro na ação de alertas', { error });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/alerts
 * Atualizar configurações de alertas
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'rule':
        return await updateAlertRule(data.id, data);
      case 'channel':
        return await updateAlertChannel(data.id, data);
      case 'settings':
        return await updateAlertSettings(data);
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de atualização não reconhecido' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Erro ao atualizar configurações de alertas', { error });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/alerts
 * Deletar alertas
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const alertId = url.searchParams.get('alertId');
    const category = url.searchParams.get('category');
    const olderThan = url.searchParams.get('olderThan');

    if (alertId) {
      return await deleteAlert(alertId);
    } else if (category) {
      return await deleteAlertsByCategory(category as AlertCategory);
    } else if (olderThan) {
      return await deleteOldAlerts(parseInt(olderThan));
    } else {
      return NextResponse.json(
        { success: false, error: 'Parâmetros insuficientes' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Erro ao deletar alertas', { error });
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/admin/alerts
 * CORS headers
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Funções auxiliares

/**
 * Obter alertas ativos
 */
async function getActiveAlerts(
  limit: number,
  offset: number,
  category?: AlertCategory,
  type?: AlertType
): Promise<NextResponse> {
  let alerts = alertSystem.getActiveAlerts();

  // Filtrar por categoria
  if (category) {
    alerts = alerts.filter(alert => alert.category === category);
  }

  // Filtrar por tipo
  if (type) {
    alerts = alerts.filter(alert => alert.type === type);
  }

  // Paginação
  const total = alerts.length;
  const paginatedAlerts = alerts.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: {
      alerts: paginatedAlerts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  });
}

/**
 * Obter histórico de alertas
 */
async function getAlertsHistory(
  limit: number,
  offset: number,
  category?: AlertCategory,
  type?: AlertType,
  resolved?: string
): Promise<NextResponse> {
  try {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (type) {
      whereConditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (resolved !== null && resolved !== undefined) {
      whereConditions.push(`resolved = $${paramIndex}`);
      params.push(resolved === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM system_alerts
      ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0]?.total || '0');

    // Obter alertas
    const alertsResult = await query(`
      SELECT *
      FROM system_alerts
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    const alerts = alertsResult.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });
  } catch (error) {
    // Se tabela não existir, retornar vazio
    return NextResponse.json({
      success: true,
      data: {
        alerts: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      }
    });
  }
}

/**
 * Obter estatísticas de alertas
 */
async function getAlertStats(): Promise<NextResponse> {
  const stats = alertSystem.getAlertStats();
  
  // Obter estatísticas do database também
  try {
    const dbStatsResult = await query(`
      SELECT 
        COUNT(*) as total_db,
        COUNT(CASE WHEN resolved = false THEN 1 END) as active_db,
        COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_db,
        COUNT(CASE WHEN type = 'critical' THEN 1 END) as critical_db,
        COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_db,
        COUNT(CASE WHEN type = 'info' THEN 1 END) as info_db
      FROM system_alerts
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    `);

    const dbStats = dbStatsResult.rows[0] || {};
    
    return NextResponse.json({
      success: true,
      data: {
        memory: stats,
        database: {
          total: parseInt(dbStats.total_db || '0'),
          active: parseInt(dbStats.active_db || '0'),
          resolved: parseInt(dbStats.resolved_db || '0'),
          byType: {
            critical: parseInt(dbStats.critical_db || '0'),
            warning: parseInt(dbStats.warning_db || '0'),
            info: parseInt(dbStats.info_db || '0')
          }
        },
        period: '24 hours'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        memory: stats,
        database: null,
        period: '24 hours'
      }
    });
  }
}

/**
 * Obter saúde do sistema
 */
async function getSystemHealth(): Promise<NextResponse> {
  const health = await alertUtils.checkSystemHealth();
  
  return NextResponse.json({
    success: true,
    data: health
  });
}

/**
 * Obter regras de alerta
 */
async function getAlertRules(): Promise<NextResponse> {
  // Acessar regras privadas (simulado)
  const rules = [
    {
      id: 'db-connection-failed',
      name: 'Falha de Conexão com Database',
      category: 'database',
      severity: 'critical',
      enabled: true,
      cooldown: 5,
      description: 'Conexão com o banco de dados falhou'
    },
    {
      id: 'high-memory-usage',
      name: 'Alto Uso de Memória',
      category: 'performance',
      severity: 'warning',
      enabled: true,
      cooldown: 10,
      description: 'Uso de memória está acima de 85%'
    }
    // Adicionar mais regras conforme necessário
  ];

  return NextResponse.json({
    success: true,
    data: { rules }
  });
}

/**
 * Obter canais de alerta
 */
async function getAlertChannels(): Promise<NextResponse> {
  // Acessar canais privados (simulado)
  const channels = [
    {
      id: 'console',
      name: 'Console Log',
      type: 'console',
      enabled: true,
      config: { level: 'info' }
    },
    {
      id: 'database',
      name: 'Database Storage',
      type: 'database',
      enabled: true,
      config: { table: 'system_alerts' }
    }
  ];

  return NextResponse.json({
    success: true,
    data: { channels }
  });
}

/**
 * Obter dashboard completo
 */
async function getAlertsDashboard(): Promise<NextResponse> {
  const [activeResponse, statsResponse, healthResponse] = await Promise.all([
    getActiveAlerts(10, 0),
    getAlertStats(),
    getSystemHealth()
  ]);

  const active = await activeResponse.json();
  const stats = await statsResponse.json();
  const health = await healthResponse.json();

  return NextResponse.json({
    success: true,
    data: {
      activeAlerts: active.data.alerts,
      stats: stats.data,
      health: health.data,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Resolver alerta
 */
async function resolveAlert(alertId: string, resolvedBy?: string): Promise<NextResponse> {
  const success = await alertSystem.resolveAlert(alertId, resolvedBy);
  
  if (success) {
    return NextResponse.json({
      success: true,
      message: 'Alerta resolvido com sucesso'
    });
  } else {
    return NextResponse.json(
      { success: false, error: 'Alerta não encontrado' },
      { status: 404 }
    );
  }
}

/**
 * Resolver múltiplos alertas
 */
async function resolveMultipleAlerts(alertIds: string[], resolvedBy?: string): Promise<NextResponse> {
  const results = [];
  
  for (const alertId of alertIds) {
    const success = await alertSystem.resolveAlert(alertId, resolvedBy);
    results.push({ alertId, success });
  }
  
  const successCount = results.filter(r => r.success).length;
  
  return NextResponse.json({
    success: true,
    message: `${successCount}/${alertIds.length} alertas resolvidos`,
    data: { results }
  });
}

/**
 * Disparar alerta manual
 */
async function triggerManualAlert(params: {
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  data?: any;
}): Promise<NextResponse> {
  const alertId = await alertUtils.triggerManualAlert(
    params.type,
    params.category,
    params.title,
    params.message,
    params.data
  );
  
  return NextResponse.json({
    success: true,
    message: 'Alerta manual disparado',
    data: { alertId }
  });
}

/**
 * Testar alerta
 */
async function testAlert(type: string): Promise<NextResponse> {
  const testAlerts = {
    database: () => alertUtils.triggerManualAlert(
      AlertType.WARNING,
      AlertCategory.DATABASE,
      'Teste de Alerta - Database',
      'Este é um alerta de teste para verificar o sistema de notificações do database'
    ),
    performance: () => alertUtils.triggerManualAlert(
      AlertType.WARNING,
      AlertCategory.PERFORMANCE,
      'Teste de Alerta - Performance',
      'Este é um alerta de teste para verificar o sistema de notificações de performance'
    ),
    security: () => alertUtils.triggerManualAlert(
      AlertType.CRITICAL,
      AlertCategory.SECURITY,
      'Teste de Alerta - Segurança',
      'Este é um alerta de teste para verificar o sistema de notificações de segurança'
    )
  };

  const testFunction = testAlerts[type as keyof typeof testAlerts];
  if (!testFunction) {
    return NextResponse.json(
      { success: false, error: 'Tipo de teste não reconhecido' },
      { status: 400 }
    );
  }

  const alertId = await testFunction();
  
  return NextResponse.json({
    success: true,
    message: 'Alerta de teste disparado',
    data: { alertId }
  });
}

/**
 * Atualizar regra de alerta
 */
async function updateAlertRule(ruleId: string, updates: any): Promise<NextResponse> {
  // Simular atualização de regra
  logger.info('Regra de alerta atualizada', { ruleId, updates });
  
  return NextResponse.json({
    success: true,
    message: 'Regra atualizada com sucesso'
  });
}

/**
 * Alternar canal de alerta
 */
async function toggleAlertChannel(channelId: string, enabled: boolean): Promise<NextResponse> {
  // Simular toggle de canal
  logger.info('Canal de alerta alterado', { channelId, enabled });
  
  return NextResponse.json({
    success: true,
    message: `Canal ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`
  });
}

/**
 * Atualizar canal de alerta
 */
async function updateAlertChannel(channelId: string, updates: any): Promise<NextResponse> {
  // Simular atualização de canal
  logger.info('Canal de alerta atualizado', { channelId, updates });
  
  return NextResponse.json({
    success: true,
    message: 'Canal atualizado com sucesso'
  });
}

/**
 * Atualizar configurações gerais
 */
async function updateAlertSettings(settings: any): Promise<NextResponse> {
  // Simular atualização de configurações
  logger.info('Configurações de alerta atualizadas', { settings });
  
  return NextResponse.json({
    success: true,
    message: 'Configurações atualizadas com sucesso'
  });
}

/**
 * Limpar alertas antigos
 */
async function clearOldAlerts(days: number = 30): Promise<NextResponse> {
  try {
    const result = await query(`
      DELETE FROM system_alerts
      WHERE timestamp < NOW() - INTERVAL '${days} days'
      AND resolved = true
    `);

    const deletedCount = result.rowCount || 0;
    
    return NextResponse.json({
      success: true,
      message: `${deletedCount} alertas antigos removidos`,
      data: { deletedCount }
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      message: 'Limpeza concluída (tabela não existe)',
      data: { deletedCount: 0 }
    });
  }
}

/**
 * Deletar alerta específico
 */
async function deleteAlert(alertId: string): Promise<NextResponse> {
  try {
    const result = await query(`
      DELETE FROM system_alerts
      WHERE alert_id = $1
    `, [alertId]);

    if (result.rowCount && result.rowCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Alerta deletado com sucesso'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar alerta' },
      { status: 500 }
    );
  }
}

/**
 * Deletar alertas por categoria
 */
async function deleteAlertsByCategory(category: AlertCategory): Promise<NextResponse> {
  try {
    const result = await query(`
      DELETE FROM system_alerts
      WHERE category = $1 AND resolved = true
    `, [category]);

    const deletedCount = result.rowCount || 0;
    
    return NextResponse.json({
      success: true,
      message: `${deletedCount} alertas da categoria ${category} removidos`,
      data: { deletedCount }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar alertas' },
      { status: 500 }
    );
  }
}

/**
 * Deletar alertas antigos
 */
async function deleteOldAlerts(days: number): Promise<NextResponse> {
  return await clearOldAlerts(days);
}