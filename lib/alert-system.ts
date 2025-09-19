/**
 * Sistema de Alertas Automáticos
 * Fase 3 - Otimizações Avançadas
 */

import { logger } from './logger';
import { query } from './db';

// Tipos de alertas
export enum AlertType {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

export enum AlertCategory {
  DATABASE = 'database',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  BUSINESS = 'business',
  SYSTEM = 'system'
}

export interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  action: string;
  params?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  condition: (data: any) => boolean;
  severity: AlertType;
  cooldown: number; // minutos
  enabled: boolean;
  description: string;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'database' | 'console';
  config: any;
  enabled: boolean;
}

class AlertSystem {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();
  private metricsHistory: any[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
    this.startMonitoring();
  }

  /**
   * Inicializar regras padrão de alertas
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      // Alertas de Database
      {
        id: 'db-connection-failed',
        name: 'Falha de Conexão com Database',
        category: AlertCategory.DATABASE,
        condition: (data) => data.dbConnectionFailed === true,
        severity: AlertType.CRITICAL,
        cooldown: 5,
        enabled: true,
        description: 'Conexão com o banco de dados falhou'
      },
      {
        id: 'db-slow-queries',
        name: 'Queries Lentas no Database',
        category: AlertCategory.DATABASE,
        condition: (data) => data.avgQueryTime > 1000, // > 1 segundo
        severity: AlertType.WARNING,
        cooldown: 15,
        enabled: true,
        description: 'Queries estão demorando mais que o esperado'
      },
      {
        id: 'db-high-connections',
        name: 'Alto Número de Conexões',
        category: AlertCategory.DATABASE,
        condition: (data) => data.activeConnections > 80, // > 80% do limite
        severity: AlertType.WARNING,
        cooldown: 10,
        enabled: true,
        description: 'Número de conexões ativas está alto'
      },

      // Alertas de Performance
      {
        id: 'high-memory-usage',
        name: 'Alto Uso de Memória',
        category: AlertCategory.PERFORMANCE,
        condition: (data) => data.memoryUsage > 85, // > 85%
        severity: AlertType.WARNING,
        cooldown: 10,
        enabled: true,
        description: 'Uso de memória está acima de 85%'
      },
      {
        id: 'high-cpu-usage',
        name: 'Alto Uso de CPU',
        category: AlertCategory.PERFORMANCE,
        condition: (data) => data.cpuUsage > 90, // > 90%
        severity: AlertType.CRITICAL,
        cooldown: 5,
        enabled: true,
        description: 'Uso de CPU está acima de 90%'
      },
      {
        id: 'slow-response-time',
        name: 'Tempo de Resposta Lento',
        category: AlertCategory.PERFORMANCE,
        condition: (data) => data.avgResponseTime > 2000, // > 2 segundos
        severity: AlertType.WARNING,
        cooldown: 15,
        enabled: true,
        description: 'Tempo médio de resposta está alto'
      },

      // Alertas de Segurança
      {
        id: 'multiple-failed-logins',
        name: 'Múltiplas Tentativas de Login Falharam',
        category: AlertCategory.SECURITY,
        condition: (data) => data.failedLogins > 10, // > 10 tentativas em 5 min
        severity: AlertType.WARNING,
        cooldown: 30,
        enabled: true,
        description: 'Detectadas múltiplas tentativas de login falharam'
      },
      {
        id: 'suspicious-activity',
        name: 'Atividade Suspeita Detectada',
        category: AlertCategory.SECURITY,
        condition: (data) => data.suspiciousRequests > 50, // > 50 req/min de um IP
        severity: AlertType.CRITICAL,
        cooldown: 10,
        enabled: true,
        description: 'Atividade suspeita detectada no sistema'
      },

      // Alertas de Negócio
      {
        id: 'low-stock-alert',
        name: 'Estoque Baixo',
        category: AlertCategory.BUSINESS,
        condition: (data) => data.lowStockItems > 0,
        severity: AlertType.WARNING,
        cooldown: 60, // 1 hora
        enabled: true,
        description: 'Produtos com estoque baixo detectados'
      },
      {
        id: 'high-order-failure-rate',
        name: 'Alta Taxa de Falha em Pedidos',
        category: AlertCategory.BUSINESS,
        condition: (data) => data.orderFailureRate > 5, // > 5%
        severity: AlertType.CRITICAL,
        cooldown: 30,
        enabled: true,
        description: 'Taxa de falha em pedidos está alta'
      },

      // Alertas de Sistema
      {
        id: 'disk-space-low',
        name: 'Espaço em Disco Baixo',
        category: AlertCategory.SYSTEM,
        condition: (data) => data.diskUsage > 90, // > 90%
        severity: AlertType.CRITICAL,
        cooldown: 60,
        enabled: true,
        description: 'Espaço em disco está baixo'
      },
      {
        id: 'service-unavailable',
        name: 'Serviço Indisponível',
        category: AlertCategory.SYSTEM,
        condition: (data) => data.serviceDown === true,
        severity: AlertType.CRITICAL,
        cooldown: 5,
        enabled: true,
        description: 'Serviço crítico está indisponível'
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    logger.info('Regras de alerta inicializadas', { count: defaultRules.length });
  }

  /**
   * Inicializar canais padrão de notificação
   */
  private initializeDefaultChannels(): void {
    const defaultChannels: AlertChannel[] = [
      {
        id: 'console',
        name: 'Console Log',
        type: 'console',
        config: { level: 'info' },
        enabled: true
      },
      {
        id: 'database',
        name: 'Database Storage',
        type: 'database',
        config: { table: 'system_alerts' },
        enabled: true
      },
      {
        id: 'webhook-slack',
        name: 'Slack Webhook',
        type: 'webhook',
        config: {
          url: process.env.SLACK_WEBHOOK_URL || '',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        enabled: !!process.env.SLACK_WEBHOOK_URL
      },
      {
        id: 'email-admin',
        name: 'Email Admin',
        type: 'email',
        config: {
          to: process.env.ADMIN_EMAIL || 'admin@erppizzaria.com',
          from: process.env.SYSTEM_EMAIL || 'system@erppizzaria.com'
        },
        enabled: !!process.env.ADMIN_EMAIL
      }
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });

    logger.info('Canais de alerta inicializados', { count: defaultChannels.length });
  }

  /**
   * Iniciar monitoramento automático
   */
  private startMonitoring(): void {
    if (this.isInitialized) return;

    // Monitoramento a cada 30 segundos
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Limpeza de alertas antigos a cada hora
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 3600000);

    this.isInitialized = true;
    logger.info('Sistema de alertas iniciado');
  }

  /**
   * Coletar métricas do sistema
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherSystemMetrics();
      this.metricsHistory.push({
        timestamp: new Date(),
        ...metrics
      });

      // Manter apenas últimas 100 métricas
      if (this.metricsHistory.length > 100) {
        this.metricsHistory = this.metricsHistory.slice(-100);
      }

      // Verificar regras de alerta
      await this.checkAlertRules(metrics);
    } catch (error) {
      logger.error('Erro ao coletar métricas', { error });
    }
  }

  /**
   * Coletar métricas do sistema
   */
  private async gatherSystemMetrics(): Promise<any> {
    const metrics: any = {
      timestamp: new Date(),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: await this.getCPUUsage(),
      diskUsage: await this.getDiskUsage(),
      dbConnectionFailed: false,
      avgQueryTime: 0,
      activeConnections: 0,
      avgResponseTime: 0,
      failedLogins: 0,
      suspiciousRequests: 0,
      lowStockItems: 0,
      orderFailureRate: 0,
      serviceDown: false
    };

    // Métricas de database
    try {
      const dbMetrics = await this.getDatabaseMetrics();
      Object.assign(metrics, dbMetrics);
    } catch (error) {
      metrics.dbConnectionFailed = true;
      logger.error('Erro ao obter métricas do database', { error });
    }

    // Métricas de negócio
    try {
      const businessMetrics = await this.getBusinessMetrics();
      Object.assign(metrics, businessMetrics);
    } catch (error) {
      logger.error('Erro ao obter métricas de negócio', { error });
    }

    return metrics;
  }

  /**
   * Verificar regras de alerta
   */
  private async checkAlertRules(metrics: any): Promise<void> {
    for (const [ruleId, rule] of this.rules.entries()) {
      if (!rule.enabled) continue;

      // Verificar cooldown
      const lastAlert = this.lastAlertTime.get(ruleId);
      if (lastAlert) {
        const cooldownMs = rule.cooldown * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) {
          continue;
        }
      }

      // Verificar condição
      try {
        if (rule.condition(metrics)) {
          await this.triggerAlert(rule, metrics);
          this.lastAlertTime.set(ruleId, new Date());
        }
      } catch (error) {
        logger.error('Erro ao verificar regra de alerta', { ruleId, error });
      }
    }
  }

  /**
   * Disparar alerta
   */
  private async triggerAlert(rule: AlertRule, data: any): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      type: rule.severity,
      category: rule.category,
      title: rule.name,
      message: rule.description,
      data,
      timestamp: new Date(),
      resolved: false,
      actions: this.generateAlertActions(rule)
    };

    // Armazenar alerta
    this.alerts.set(alert.id, alert);

    // Enviar notificações
    await this.sendNotifications(alert);

    logger.warn('Alerta disparado', {
      alertId: alert.id,
      rule: rule.name,
      severity: rule.severity,
      category: rule.category
    });
  }

  /**
   * Enviar notificações
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    for (const [channelId, channel] of this.channels.entries()) {
      if (!channel.enabled) continue;

      try {
        await this.sendToChannel(alert, channel);
      } catch (error) {
        logger.error('Erro ao enviar notificação', { channelId, error });
      }
    }
  }

  /**
   * Enviar para canal específico
   */
  private async sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'console':
        console.log(`🚨 ALERTA [${alert.type.toUpperCase()}]: ${alert.title} - ${alert.message}`);
        break;

      case 'database':
        await this.saveAlertToDatabase(alert);
        break;

      case 'webhook':
        await this.sendWebhook(alert, channel.config);
        break;

      case 'email':
        await this.sendEmail(alert, channel.config);
        break;
    }
  }

  /**
   * Salvar alerta no database
   */
  private async saveAlertToDatabase(alert: Alert): Promise<void> {
    try {
      await query(`
        INSERT INTO system_alerts (
          alert_id, type, category, title, message, data, 
          timestamp, resolved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        alert.id,
        alert.type,
        alert.category,
        alert.title,
        alert.message,
        JSON.stringify(alert.data),
        alert.timestamp,
        alert.resolved
      ]);
    } catch (error) {
      // Tabela pode não existir ainda
      logger.debug('Erro ao salvar alerta no database', { error });
    }
  }

  /**
   * Enviar webhook
   */
  private async sendWebhook(alert: Alert, config: any): Promise<void> {
    if (!config.url) return;

    const payload = {
      text: `🚨 *${alert.title}*`,
      attachments: [{
        color: alert.type === AlertType.CRITICAL ? 'danger' : 
               alert.type === AlertType.WARNING ? 'warning' : 'good',
        fields: [
          { title: 'Categoria', value: alert.category, short: true },
          { title: 'Severidade', value: alert.type, short: true },
          { title: 'Mensagem', value: alert.message, short: false },
          { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true }
        ]
      }]
    };

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: config.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  }

  /**
   * Enviar email (simulado)
   */
  private async sendEmail(alert: Alert, config: any): Promise<void> {
    // Simular envio de email (implementar com nodemailer ou similar)
    logger.info('Email de alerta enviado', {
      to: config.to,
      subject: `[ERP Pizzaria] ${alert.title}`,
      alert: alert.id
    });
  }

  /**
   * Gerar ações para o alerta
   */
  private generateAlertActions(rule: AlertRule): AlertAction[] {
    const actions: AlertAction[] = [];

    switch (rule.category) {
      case AlertCategory.DATABASE:
        actions.push(
          { id: 'restart-db', label: 'Reiniciar Conexões DB', action: 'restart_db_connections' },
          { id: 'check-queries', label: 'Verificar Queries Lentas', action: 'check_slow_queries' }
        );
        break;

      case AlertCategory.PERFORMANCE:
        actions.push(
          { id: 'clear-cache', label: 'Limpar Cache', action: 'clear_cache' },
          { id: 'restart-service', label: 'Reiniciar Serviço', action: 'restart_service' }
        );
        break;

      case AlertCategory.SECURITY:
        actions.push(
          { id: 'block-ip', label: 'Bloquear IP', action: 'block_suspicious_ip' },
          { id: 'review-logs', label: 'Revisar Logs', action: 'review_security_logs' }
        );
        break;

      case AlertCategory.BUSINESS:
        actions.push(
          { id: 'check-inventory', label: 'Verificar Estoque', action: 'check_inventory' },
          { id: 'notify-manager', label: 'Notificar Gerente', action: 'notify_manager' }
        );
        break;
    }

    return actions;
  }

  // Métodos públicos

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Resolver alerta
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    // Atualizar no database
    try {
      await query(`
        UPDATE system_alerts 
        SET resolved = true, resolved_at = $1, resolved_by = $2
        WHERE alert_id = $3
      `, [alert.resolvedAt, alert.resolvedBy, alertId]);
    } catch (error) {
      logger.debug('Erro ao atualizar alerta no database', { error });
    }

    logger.info('Alerta resolvido', { alertId, resolvedBy });
    return true;
  }

  /**
   * Obter estatísticas de alertas
   */
  getAlertStats(): {
    total: number;
    active: number;
    resolved: number;
    byType: Record<AlertType, number>;
    byCategory: Record<AlertCategory, number>;
  } {
    const alerts = Array.from(this.alerts.values());
    const active = alerts.filter(a => !a.resolved);
    const resolved = alerts.filter(a => a.resolved);

    const byType = {
      [AlertType.CRITICAL]: alerts.filter(a => a.type === AlertType.CRITICAL).length,
      [AlertType.WARNING]: alerts.filter(a => a.type === AlertType.WARNING).length,
      [AlertType.INFO]: alerts.filter(a => a.type === AlertType.INFO).length
    };

    const byCategory = {
      [AlertCategory.DATABASE]: alerts.filter(a => a.category === AlertCategory.DATABASE).length,
      [AlertCategory.PERFORMANCE]: alerts.filter(a => a.category === AlertCategory.PERFORMANCE).length,
      [AlertCategory.SECURITY]: alerts.filter(a => a.category === AlertCategory.SECURITY).length,
      [AlertCategory.BUSINESS]: alerts.filter(a => a.category === AlertCategory.BUSINESS).length,
      [AlertCategory.SYSTEM]: alerts.filter(a => a.category === AlertCategory.SYSTEM).length
    };

    return {
      total: alerts.length,
      active: active.length,
      resolved: resolved.length,
      byType,
      byCategory
    };
  }

  // Métodos privados para métricas

  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return (usage.heapUsed / usage.heapTotal) * 100;
  }

  private async getCPUUsage(): Promise<number> {
    // Simular uso de CPU (implementar com os-utils ou similar)
    return Math.random() * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // Simular uso de disco (implementar com fs.statvfs ou similar)
    return Math.random() * 100;
  }

  private async getDatabaseMetrics(): Promise<any> {
    try {
      // Simular métricas de database
      return {
        avgQueryTime: Math.random() * 500 + 50, // 50-550ms
        activeConnections: Math.floor(Math.random() * 100),
        dbConnectionFailed: false
      };
    } catch (error) {
      return {
        avgQueryTime: 0,
        activeConnections: 0,
        dbConnectionFailed: true
      };
    }
  }

  private async getBusinessMetrics(): Promise<any> {
    try {
      // Verificar estoque baixo
      const lowStockResult = await query(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE stock_quantity <= stock_min_level
      `);

      // Simular outras métricas de negócio
      return {
        lowStockItems: parseInt(lowStockResult.rows[0]?.count || '0'),
        orderFailureRate: Math.random() * 10, // 0-10%
        avgResponseTime: Math.random() * 1000 + 100 // 100-1100ms
      };
    } catch (error) {
      return {
        lowStockItems: 0,
        orderFailureRate: 0,
        avgResponseTime: 0
      };
    }
  }

  private cleanupOldAlerts(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.timestamp < oneWeekAgo) {
        this.alerts.delete(alertId);
      }
    }

    logger.debug('Limpeza de alertas antigos concluída');
  }
}

// Instância global do sistema de alertas
export const alertSystem = new AlertSystem();

// Funções utilitárias
export const alertUtils = {
  /**
   * Disparar alerta manual
   */
  async triggerManualAlert(
    type: AlertType,
    category: AlertCategory,
    title: string,
    message: string,
    data?: any
  ): Promise<string> {
    const alert: Alert = {
      id: `manual-${Date.now()}`,
      type,
      category,
      title,
      message,
      data,
      timestamp: new Date(),
      resolved: false
    };

    alertSystem['alerts'].set(alert.id, alert);
    await alertSystem['sendNotifications'](alert);

    return alert.id;
  },

  /**
   * Verificar saúde do sistema
   */
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: any;
  }> {
    const metrics = await alertSystem['gatherSystemMetrics']();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Verificar métricas críticas
    if (metrics.dbConnectionFailed) {
      issues.push('Database connection failed');
      status = 'critical';
    }
    if (metrics.cpuUsage > 90) {
      issues.push('High CPU usage');
      status = status === 'critical' ? 'critical' : 'warning';
    }
    if (metrics.memoryUsage > 85) {
      issues.push('High memory usage');
      status = status === 'critical' ? 'critical' : 'warning';
    }
    if (metrics.diskUsage > 90) {
      issues.push('Low disk space');
      status = 'critical';
    }

    return { status, issues, metrics };
  }
};