/**
 * Sistema de Backup Simplificado do PostgreSQL - FASE 2
 * Realiza backup usando conexão direta com PostgreSQL
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'erp_pizzaria',
  password: '134679',
  port: 5432,
};

class SimpleBackupSystem {
  constructor() {
    this.pool = new Pool(dbConfig);
    this.backupDir = './backups';
  }

  // Garantir que o diretório de backup existe
  async ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`✅ Diretório de backup criado: ${this.backupDir}`);
    }
  }

  // Gerar nome do arquivo de backup
  generateBackupFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('.')[0];
    return `backup_${dbConfig.database}_${timestamp}.sql`;
  }

  // Obter estrutura das tabelas
  async getTableStructure(tableName) {
    const client = await this.pool.connect();
    try {
      // Obter definição da tabela
      const tableQuery = `
        SELECT 
          'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
          string_agg(
            column_name || ' ' || data_type ||
            CASE 
              WHEN character_maximum_length IS NOT NULL 
              THEN '(' || character_maximum_length || ')'
              ELSE ''
            END ||
            CASE 
              WHEN is_nullable = 'NO' THEN ' NOT NULL'
              ELSE ''
            END,
            ', '
          ) || ');' as create_statement
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' AND t.table_name = $1
        GROUP BY schemaname, tablename
      `;
      
      const result = await client.query(tableQuery, [tableName]);
      return result.rows[0]?.create_statement || '';
    } finally {
      client.release();
    }
  }

  // Obter dados da tabela
  async getTableData(tableName) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`SELECT * FROM ${tableName}`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Gerar INSERT statements
  generateInsertStatements(tableName, rows) {
    if (rows.length === 0) return '';
    
    const columns = Object.keys(rows[0]);
    const insertStatements = [];
    
    rows.forEach(row => {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        return value;
      }).join(', ');
      
      insertStatements.push(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`);
    });
    
    return insertStatements.join('\n');
  }

  // Executar backup completo
  async performBackup() {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando backup do banco de dados...');
      console.log(`📅 Data/Hora: ${new Date().toLocaleString()}`);
      
      // Garantir diretório de backup
      await this.ensureBackupDirectory();
      
      // Gerar nome do arquivo
      const filename = this.generateBackupFilename();
      const filePath = path.join(this.backupDir, filename);
      
      // Obter lista de tabelas
      const client = await this.pool.connect();
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      client.release();
      
      const tables = tablesResult.rows.map(row => row.table_name);
      console.log(`📋 Encontradas ${tables.length} tabelas: ${tables.join(', ')}`);
      
      // Gerar conteúdo do backup
      let backupContent = `-- Backup do banco de dados: ${dbConfig.database}\n`;
      backupContent += `-- Data: ${new Date().toISOString()}\n`;
      backupContent += `-- Gerado por: Sistema de Backup Simplificado\n\n`;
      
      // Adicionar estrutura e dados de cada tabela
      for (const tableName of tables) {
        console.log(`🔄 Processando tabela: ${tableName}`);
        
        backupContent += `\n-- Tabela: ${tableName}\n`;
        backupContent += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
        
        // Estrutura da tabela (simplificada)
        const data = await this.getTableData(tableName);
        console.log(`   📊 ${data.length} registros encontrados`);
        
        // Dados da tabela
        if (data.length > 0) {
          const insertStatements = this.generateInsertStatements(tableName, data);
          backupContent += insertStatements + '\n';
        }
      }
      
      // Salvar arquivo de backup
      fs.writeFileSync(filePath, backupContent, 'utf8');
      
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Backup concluído com sucesso!`);
      console.log(`   📁 Arquivo: ${filename}`);
      console.log(`   📏 Tamanho: ${sizeKB} KB`);
      console.log(`   ⏱️  Duração: ${duration}ms`);
      
      return {
        success: true,
        filename,
        filePath,
        size: stats.size,
        duration,
        tablesCount: tables.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Erro durante backup:`, error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Listar backups existentes
  async listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        console.log('📂 Nenhum diretório de backup encontrado');
        return [];
      }
      
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024),
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);
      
      console.log(`📋 Encontrados ${files.length} backups:`);
      files.forEach(file => {
        console.log(`   📁 ${file.filename} (${file.sizeKB} KB) - ${file.created.toLocaleString()}`);
      });
      
      return files;
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error.message);
      return [];
    }
  }

  // Fechar conexões
  async close() {
    await this.pool.end();
  }
}

// Função principal
async function main() {
  const backup = new SimpleBackupSystem();
  
  try {
    const args = process.argv.slice(2);
    const command = args[0] || 'backup';
    
    switch (command) {
      case 'backup':
        await backup.performBackup();
        break;
        
      case 'list':
        await backup.listBackups();
        break;
        
      default:
        console.log('Uso:');
        console.log('  node simple-backup.js backup   # Executar backup');
        console.log('  node simple-backup.js list     # Listar backups');
    }
  } catch (error) {
    console.error('❌ Erro no sistema de backup:', error.message);
    process.exit(1);
  } finally {
    await backup.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = SimpleBackupSystem;