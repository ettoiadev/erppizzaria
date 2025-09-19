/**
 * Sistema de Backup Automático do PostgreSQL - FASE 2
 * Realiza backups automáticos, rotação de arquivos e verificação de integridade
 */

const { exec, spawn } = require('child_process')
const fs = require('fs/promises')
const path = require('path')
const { promisify } = require('util')
const execAsync = promisify(exec)

// Configuração do sistema de backup
const backupConfig = {
  // Configurações do banco
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'erp_pizzaria',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '134679'
  },
  
  // Configurações de backup
  backup: {
    directory: './backups',
    format: 'custom', // custom, plain, directory, tar
    compression: 9, // 0-9 (0=sem compressão, 9=máxima)
    verbose: true,
    includeData: true,
    includeSchema: true,
    excludeTables: [], // Tabelas para excluir do backup
    onlyTables: [] // Apenas essas tabelas (vazio = todas)
  },
  
  // Configurações de rotação
  rotation: {
    keepDaily: 7,    // Manter backups diários por 7 dias
    keepWeekly: 4,   // Manter backups semanais por 4 semanas
    keepMonthly: 12, // Manter backups mensais por 12 meses
    keepYearly: 5    // Manter backups anuais por 5 anos
  },
  
  // Configurações de agendamento
  schedule: {
    daily: '02:00',     // Backup diário às 2:00
    weekly: 'sunday',   // Backup semanal aos domingos
    monthly: 1,         // Backup mensal no dia 1
    enabled: true
  },
  
  // Configurações de verificação
  verification: {
    enabled: true,
    testRestore: false, // Testar restore em banco temporário
    checkIntegrity: true
  },
  
  // Configurações de notificação
  notifications: {
    onSuccess: true,
    onFailure: true,
    onWarning: true
  }
}

class PostgreSQLBackupSystem {
  constructor(config = backupConfig) {
    this.config = config
    this.isRunning = false
    this.lastBackup = null
    this.backupHistory = []
  }

  // Garantir que o diretório de backup existe
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.config.backup.directory, { recursive: true })
      console.log(`✅ Diretório de backup criado/verificado: ${this.config.backup.directory}`)
    } catch (error) {
      throw new Error(`Erro ao criar diretório de backup: ${error.message}`)
    }
  }

  // Gerar nome do arquivo de backup
  generateBackupFilename(type = 'daily') {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')
    const date = timestamp[0]
    const time = timestamp[1].split('.')[0]
    
    const extension = this.config.backup.format === 'plain' ? 'sql' : 'backup'
    return `${this.config.database.database}_${type}_${date}_${time}.${extension}`
  }

  // Executar pg_dump
  async executePgDump(filename, options = {}) {
    const filePath = path.join(this.config.backup.directory, filename)
    
    // Construir comando pg_dump
    const args = [
      '--host', this.config.database.host,
      '--port', this.config.database.port.toString(),
      '--username', this.config.database.username,
      '--dbname', this.config.database.database,
      '--file', filePath,
      '--format', this.config.backup.format,
      '--compress', this.config.backup.compression.toString()
    ]

    // Adicionar opções específicas
    if (this.config.backup.verbose) args.push('--verbose')
    if (!this.config.backup.includeData) args.push('--schema-only')
    if (!this.config.backup.includeSchema) args.push('--data-only')
    
    // Excluir tabelas específicas
    this.config.backup.excludeTables.forEach(table => {
      args.push('--exclude-table', table)
    })
    
    // Incluir apenas tabelas específicas
    this.config.backup.onlyTables.forEach(table => {
      args.push('--table', table)
    })

    // Configurar variável de ambiente para senha
    const env = {
      ...process.env,
      PGPASSWORD: this.config.database.password
    }

    console.log(`🔄 Iniciando backup: ${filename}`)
    console.log(`📝 Comando: pg_dump ${args.join(' ')}`)

    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const pgDump = spawn('pg_dump', args, {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      pgDump.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pgDump.stderr.on('data', (data) => {
        stderr += data.toString()
        if (this.config.backup.verbose) {
          console.log(`pg_dump: ${data.toString().trim()}`)
        }
      })

      pgDump.on('close', async (code) => {
        const duration = Date.now() - startTime
        
        if (code === 0) {
          try {
            const stats = await fs.stat(filePath)
            const sizeKB = Math.round(stats.size / 1024)
            
            console.log(`✅ Backup concluído com sucesso!`)
            console.log(`   Arquivo: ${filename}`)
            console.log(`   Tamanho: ${sizeKB} KB`)
            console.log(`   Duração: ${duration}ms`)
            
            resolve({
              success: true,
              filename,
              filePath,
              size: stats.size,
              duration,
              timestamp: new Date().toISOString()
            })
          } catch (error) {
            reject(new Error(`Backup criado mas erro ao verificar arquivo: ${error.message}`))
          }
        } else {
          reject(new Error(`pg_dump falhou com código ${code}: ${stderr}`))
        }
      })

      pgDump.on('error', (error) => {
        reject(new Error(`Erro ao executar pg_dump: ${error.message}`))
      })
    })
  }

  // Verificar integridade do backup
  async verifyBackup(filePath) {
    if (!this.config.verification.enabled) {
      return { verified: true, message: 'Verificação desabilitada' }
    }

    try {
      console.log(`🔍 Verificando integridade do backup: ${path.basename(filePath)}`)
      
      // Verificar se o arquivo existe e tem tamanho > 0
      const stats = await fs.stat(filePath)
      if (stats.size === 0) {
        throw new Error('Arquivo de backup está vazio')
      }

      // Para backups em formato custom, usar pg_restore para verificar
      if (this.config.backup.format === 'custom') {
        const args = [
          '--list',
          '--file', filePath
        ]

        const { stdout, stderr } = await execAsync(`pg_restore ${args.join(' ')}`)
        
        if (stderr && !stderr.includes('WARNING')) {
          throw new Error(`Erro na verificação: ${stderr}`)
        }

        const tableCount = (stdout.match(/TABLE/g) || []).length
        console.log(`✅ Backup verificado - ${tableCount} tabelas encontradas`)
        
        return {
          verified: true,
          message: `Backup válido com ${tableCount} tabelas`,
          tableCount
        }
      }

      // Para outros formatos, verificação básica
      return {
        verified: true,
        message: 'Verificação básica passou',
        size: stats.size
      }
    } catch (error) {
      console.error(`❌ Falha na verificação do backup: ${error.message}`)
      return {
        verified: false,
        message: error.message
      }
    }
  }

  // Executar backup completo
  async performBackup(type = 'daily') {
    if (this.isRunning) {
      throw new Error('Backup já está em execução')
    }

    this.isRunning = true
    const startTime = Date.now()

    try {
      console.log(`🚀 Iniciando backup ${type}...`)
      console.log(`📅 Data/Hora: ${new Date().toLocaleString()}`)
      
      // Garantir diretório de backup
      await this.ensureBackupDirectory()
      
      // Gerar nome do arquivo
      const filename = this.generateBackupFilename(type)
      
      // Executar backup
      const backupResult = await this.executePgDump(filename)
      
      // Verificar integridade
      const verification = await this.verifyBackup(backupResult.filePath)
      
      // Registrar resultado
      const result = {
        ...backupResult,
        type,
        verification,
        totalDuration: Date.now() - startTime
      }
      
      this.lastBackup = result
      this.backupHistory.push(result)
      
      // Manter apenas os últimos 100 registros no histórico
      if (this.backupHistory.length > 100) {
        this.backupHistory = this.backupHistory.slice(-50)
      }
      
      console.log(`🎉 Backup ${type} concluído com sucesso!`)
      console.log(`⏱️  Duração total: ${result.totalDuration}ms`)
      
      if (this.config.notifications.onSuccess) {
        await this.sendNotification('success', `Backup ${type} concluído com sucesso`, result)
      }
      
      return result
    } catch (error) {
      console.error(`❌ Erro durante backup ${type}:`, error.message)
      
      const errorResult = {
        success: false,
        type,
        error: error.message,
        timestamp: new Date().toISOString(),
        totalDuration: Date.now() - startTime
      }
      
      this.backupHistory.push(errorResult)
      
      if (this.config.notifications.onFailure) {
        await this.sendNotification('error', `Falha no backup ${type}`, errorResult)
      }
      
      throw error
    } finally {
      this.isRunning = false
    }
  }

  // Listar backups existentes
  async listBackups() {
    try {
      const files = await fs.readdir(this.config.backup.directory)
      const backups = []
      
      for (const file of files) {
        if (file.includes(this.config.database.database)) {
          const filePath = path.join(this.config.backup.directory, file)
          const stats = await fs.stat(filePath)
          
          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: this.extractBackupType(file)
          })
        }
      }
      
      return backups.sort((a, b) => b.created - a.created)
    } catch (error) {
      console.error('Erro ao listar backups:', error.message)
      return []
    }
  }

  // Extrair tipo de backup do nome do arquivo
  extractBackupType(filename) {
    if (filename.includes('_daily_')) return 'daily'
    if (filename.includes('_weekly_')) return 'weekly'
    if (filename.includes('_monthly_')) return 'monthly'
    if (filename.includes('_yearly_')) return 'yearly'
    return 'manual'
  }

  // Rotação de backups (remover antigos)
  async rotateBackups() {
    console.log('🔄 Iniciando rotação de backups...')
    
    const backups = await this.listBackups()
    const now = new Date()
    const toDelete = []
    
    // Agrupar backups por tipo
    const backupsByType = {
      daily: backups.filter(b => b.type === 'daily'),
      weekly: backups.filter(b => b.type === 'weekly'),
      monthly: backups.filter(b => b.type === 'monthly'),
      yearly: backups.filter(b => b.type === 'yearly')
    }
    
    // Aplicar regras de rotação
    const rules = {
      daily: { keep: this.config.rotation.keepDaily, days: 1 },
      weekly: { keep: this.config.rotation.keepWeekly, days: 7 },
      monthly: { keep: this.config.rotation.keepMonthly, days: 30 },
      yearly: { keep: this.config.rotation.keepYearly, days: 365 }
    }
    
    for (const [type, rule] of Object.entries(rules)) {
      const typeBackups = backupsByType[type] || []
      
      if (typeBackups.length > rule.keep) {
        // Manter apenas os mais recentes
        const toKeep = typeBackups.slice(0, rule.keep)
        const toRemove = typeBackups.slice(rule.keep)
        
        toDelete.push(...toRemove)
        console.log(`📦 ${type}: mantendo ${toKeep.length}, removendo ${toRemove.length}`)
      }
    }
    
    // Remover arquivos antigos
    let deletedCount = 0
    let freedSpace = 0
    
    for (const backup of toDelete) {
      try {
        freedSpace += backup.size
        await fs.unlink(backup.path)
        deletedCount++
        console.log(`🗑️  Removido: ${backup.filename}`)
      } catch (error) {
        console.error(`❌ Erro ao remover ${backup.filename}:`, error.message)
      }
    }
    
    console.log(`✅ Rotação concluída: ${deletedCount} arquivos removidos, ${Math.round(freedSpace / 1024 / 1024)} MB liberados`)
    
    return {
      deleted: deletedCount,
      freedSpace,
      remaining: backups.length - deletedCount
    }
  }

  // Enviar notificação (placeholder - implementar conforme necessário)
  async sendNotification(type, message, data) {
    // Implementar integração com sistema de notificações
    // (email, Slack, webhook, etc.)
    console.log(`📢 Notificação [${type.toUpperCase()}]: ${message}`)
    
    if (data) {
      console.log(`📊 Dados:`, JSON.stringify(data, null, 2))
    }
  }

  // Obter estatísticas dos backups
  async getBackupStats() {
    const backups = await this.listBackups()
    
    const stats = {
      total: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      byType: {
        daily: backups.filter(b => b.type === 'daily').length,
        weekly: backups.filter(b => b.type === 'weekly').length,
        monthly: backups.filter(b => b.type === 'monthly').length,
        yearly: backups.filter(b => b.type === 'yearly').length,
        manual: backups.filter(b => b.type === 'manual').length
      },
      oldest: backups.length > 0 ? backups[backups.length - 1].created : null,
      newest: backups.length > 0 ? backups[0].created : null,
      lastBackup: this.lastBackup
    }
    
    return stats
  }

  // Restaurar backup (cuidado!)
  async restoreBackup(backupPath, targetDatabase = null) {
    console.log(`⚠️  ATENÇÃO: Iniciando restauração do backup!`)
    console.log(`📁 Arquivo: ${backupPath}`)
    
    const dbName = targetDatabase || this.config.database.database
    console.log(`🎯 Banco de destino: ${dbName}`)
    
    // Verificar se o arquivo existe
    try {
      await fs.access(backupPath)
    } catch (error) {
      throw new Error(`Arquivo de backup não encontrado: ${backupPath}`)
    }
    
    // Construir comando pg_restore
    const args = [
      '--host', this.config.database.host,
      '--port', this.config.database.port.toString(),
      '--username', this.config.database.username,
      '--dbname', dbName,
      '--clean',
      '--if-exists',
      '--verbose',
      backupPath
    ]
    
    const env = {
      ...process.env,
      PGPASSWORD: this.config.database.password
    }
    
    console.log(`🔄 Executando: pg_restore ${args.join(' ')}`)
    
    try {
      const { stdout, stderr } = await execAsync(`pg_restore ${args.join(' ')}`, { env })
      
      console.log(`✅ Restauração concluída com sucesso!`)
      if (stdout) console.log('STDOUT:', stdout)
      if (stderr) console.log('STDERR:', stderr)
      
      return {
        success: true,
        message: 'Backup restaurado com sucesso',
        stdout,
        stderr
      }
    } catch (error) {
      console.error(`❌ Erro durante restauração:`, error.message)
      throw error
    }
  }
}

// Função principal para executar backup
async function runBackup(type = 'daily') {
  const backupSystem = new PostgreSQLBackupSystem()
  
  try {
    const result = await backupSystem.performBackup(type)
    
    // Executar rotação após backup bem-sucedido
    if (result.success) {
      await backupSystem.rotateBackups()
    }
    
    return result
  } catch (error) {
    console.error('Erro no sistema de backup:', error.message)
    process.exit(1)
  }
}

// Função para listar backups
async function listBackups() {
  const backupSystem = new PostgreSQLBackupSystem()
  const backups = await backupSystem.listBackups()
  
  console.log('📋 Backups disponíveis:')
  console.log('=' .repeat(80))
  
  if (backups.length === 0) {
    console.log('Nenhum backup encontrado.')
    return
  }
  
  backups.forEach((backup, index) => {
    const sizeKB = Math.round(backup.size / 1024)
    console.log(`${index + 1}. ${backup.filename}`)
    console.log(`   Tipo: ${backup.type}`)
    console.log(`   Tamanho: ${sizeKB} KB`)
    console.log(`   Criado: ${backup.created.toLocaleString()}`)
    console.log('')
  })
}

// Função para obter estatísticas
async function getStats() {
  const backupSystem = new PostgreSQLBackupSystem()
  const stats = await backupSystem.getBackupStats()
  
  console.log('📊 Estatísticas dos Backups:')
  console.log('=' .repeat(50))
  console.log(`Total de backups: ${stats.total}`)
  console.log(`Tamanho total: ${Math.round(stats.totalSize / 1024 / 1024)} MB`)
  console.log('')
  console.log('Por tipo:')
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })
  
  if (stats.oldest) {
    console.log(`\nMais antigo: ${stats.oldest.toLocaleString()}`)
  }
  if (stats.newest) {
    console.log(`Mais recente: ${stats.newest.toLocaleString()}`)
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2]
  const arg = process.argv[3]
  
  switch (command) {
    case 'backup':
      runBackup(arg || 'daily')
      break
    case 'list':
      listBackups()
      break
    case 'stats':
      getStats()
      break
    case 'rotate':
      const backupSystem = new PostgreSQLBackupSystem()
      backupSystem.rotateBackups()
      break
    default:
      console.log('Uso:')
      console.log('  node postgres-backup-system.js backup [daily|weekly|monthly|yearly]')
      console.log('  node postgres-backup-system.js list')
      console.log('  node postgres-backup-system.js stats')
      console.log('  node postgres-backup-system.js rotate')
  }
}

module.exports = {
  PostgreSQLBackupSystem,
  runBackup,
  listBackups,
  getStats,
  backupConfig
}