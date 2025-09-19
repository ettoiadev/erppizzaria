import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { frontendLogger } from '@/lib/frontend-logger'
import fs from 'fs'
import path from 'path'

// Configuração de runtime para suporte aos módulos fs e path
export const runtime = 'nodejs'

interface BackupEntry {
  filename: string
  size: number
  sizeFormatted: string
  date: Date
  dateFormatted: string
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const admin = await verifyAdmin(token)
    
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado - usuário não é admin' }, { status: 403 })
    }

    const backupDir = '/backups/database'
    const filesBackupDir = '/backups/files'
    
    // Verificar se diretórios existem
    const dbBackupExists = fs.existsSync(backupDir)
    const filesBackupExists = fs.existsSync(filesBackupDir)
    
    let databaseBackups: BackupEntry[] = []
    let filesBackups: BackupEntry[] = []
    let lastDatabaseBackup: BackupEntry | null = null
    let lastFilesBackup: BackupEntry | null = null
    
    // Buscar backups de banco de dados
    if (dbBackupExists) {
      try {
        const files = fs.readdirSync(backupDir)
        databaseBackups = files
          .filter(f => f.endsWith('.sql.gz'))
          .map(f => {
            const filePath = path.join(backupDir, f)
            const stats = fs.statSync(filePath)
            return {
              filename: f,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
              date: stats.mtime,
              dateFormatted: stats.mtime.toLocaleString('pt-BR')
            }
          })
          .sort((a, b) => b.date.getTime() - a.date.getTime())
        
        if (databaseBackups.length > 0) {
          lastDatabaseBackup = databaseBackups[0]
        }
      } catch (error) {
        frontendLogger.logError('Erro ao ler backups de banco de dados', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          backupDir
        })
      }
    }
    
    // Buscar backups de arquivos
    if (filesBackupExists) {
      try {
        const files = fs.readdirSync(filesBackupDir)
        filesBackups = files
          .filter(f => f.endsWith('.tar.gz'))
          .map(f => {
            const filePath = path.join(filesBackupDir, f)
            const stats = fs.statSync(filePath)
            return {
              filename: f,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
              date: stats.mtime,
              dateFormatted: stats.mtime.toLocaleString('pt-BR')
            }
          })
          .sort((a, b) => b.date.getTime() - a.date.getTime())
        
        if (filesBackups.length > 0) {
          lastFilesBackup = filesBackups[0]
        }
      } catch (error) {
        frontendLogger.logError('Erro ao ler backups de arquivos', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          filesBackupDir
        })
      }
    }
    
    // Calcular estatísticas
    const totalDatabaseSize = databaseBackups.reduce((sum, backup) => sum + backup.size, 0)
    const totalFilesSize = filesBackups.reduce((sum, backup) => sum + backup.size, 0)
    
    // Verificar espaço em disco
    let diskUsage = 0
    let diskTotal = 0
    let diskFree = 0
    
    try {
      const { execSync } = require('child_process')
      const dfOutput = execSync(`df ${backupDir} | tail -1`).toString()
      const parts = dfOutput.trim().split(/\s+/)
      diskTotal = parseInt(parts[1]) * 1024 // Em bytes
      diskFree = parseInt(parts[3]) * 1024 // Em bytes
      diskUsage = ((diskTotal - diskFree) / diskTotal) * 100
    } catch (error) {
      frontendLogger.logError('Erro ao verificar espaço em disco', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        backupDir
      })
    }
    
    // Verificar se há backups recentes (últimas 24h)
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentDatabaseBackups = databaseBackups.filter(b => b.date > oneDayAgo).length
    const recentFilesBackups = filesBackups.filter(b => b.date > oneDayAgo).length
    
    return NextResponse.json({
      status: 'success',
      database: {
        enabled: dbBackupExists,
        backups: databaseBackups,
        lastBackup: lastDatabaseBackup,
        totalBackups: databaseBackups.length,
        totalSize: totalDatabaseSize,
        totalSizeFormatted: formatBytes(totalDatabaseSize),
        recentBackups: recentDatabaseBackups
      },
      files: {
        enabled: filesBackupExists,
        backups: filesBackups,
        lastBackup: lastFilesBackup,
        totalBackups: filesBackups.length,
        totalSize: totalFilesSize,
        totalSizeFormatted: formatBytes(totalFilesSize),
        recentBackups: recentFilesBackups
      },
      system: {
        diskUsage: Math.round(diskUsage),
        diskTotal: formatBytes(diskTotal),
        diskFree: formatBytes(diskFree),
        backupHealth: {
          database: recentDatabaseBackups > 0 ? 'healthy' : 'warning',
          files: recentFilesBackups > 0 ? 'healthy' : 'warning',
          disk: diskUsage > 90 ? 'critical' : diskUsage > 80 ? 'warning' : 'healthy'
        }
      }
    })
    
  } catch (error: any) {
    frontendLogger.logError('Erro ao obter status de backup', {
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Função para formatar bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}