#!/usr/bin/env node

/**
 * Script para aplicar migrações do PostgreSQL local
 * Sistema de migração para PostgreSQL local
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco PostgreSQL local
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'erp_pizzaria',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '134679',
  ssl: process.env.POSTGRES_SSL === 'true'
});

// Diretório de migrações
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

/**
 * Criar tabela de controle de migrações
 */
async function createMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64) NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename 
    ON schema_migrations(filename);
  `;
  
  await pool.query(query);
  console.log('✅ Tabela de controle de migrações criada/verificada');
}

/**
 * Calcular checksum de um arquivo
 */
function calculateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Obter migrações já aplicadas
 */
async function getAppliedMigrations() {
  try {
    const result = await pool.query(
      'SELECT filename, checksum FROM schema_migrations ORDER BY applied_at'
    );
    return new Map(result.rows.map(row => [row.filename, row.checksum]));
  } catch (error) {
    console.log('⚠️ Tabela de migrações não existe ainda');
    return new Map();
  }
}

/**
 * Obter arquivos de migração
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('⚠️ Diretório de migrações não encontrado:', MIGRATIONS_DIR);
    return [];
  }
  
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ordenar alfabeticamente
}

/**
 * Aplicar uma migração
 */
async function applyMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const checksum = calculateChecksum(content);
  
  console.log(`🔄 Aplicando migração: ${filename}`);
  
  try {
    // Executar a migração em uma transação
    await pool.query('BEGIN');
    
    // Executar o SQL da migração
    await pool.query(content);
    
    // Registrar a migração como aplicada
    await pool.query(
      'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
      [filename, checksum]
    );
    
    await pool.query('COMMIT');
    console.log(`✅ Migração aplicada com sucesso: ${filename}`);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`❌ Erro ao aplicar migração ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Verificar se uma migração foi modificada
 */
function isMigrationModified(filename, appliedChecksum) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const currentChecksum = calculateChecksum(content);
  
  return currentChecksum !== appliedChecksum;
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando aplicação de migrações PostgreSQL...');
    console.log('📁 Diretório de migrações:', MIGRATIONS_DIR);
    
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida');
    
    // Criar tabela de controle
    await createMigrationsTable();
    
    // Obter migrações aplicadas e arquivos disponíveis
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();
    
    console.log(`📊 Migrações encontradas: ${migrationFiles.length}`);
    console.log(`📊 Migrações já aplicadas: ${appliedMigrations.size}`);
    
    if (migrationFiles.length === 0) {
      console.log('⚠️ Nenhuma migração encontrada');
      return;
    }
    
    let appliedCount = 0;
    let skippedCount = 0;
    let modifiedCount = 0;
    
    // Processar cada arquivo de migração
    for (const filename of migrationFiles) {
      if (appliedMigrations.has(filename)) {
        // Verificar se a migração foi modificada
        if (isMigrationModified(filename, appliedMigrations.get(filename))) {
          console.log(`⚠️ Migração modificada detectada: ${filename}`);
          console.log(`   Use --force para reaplicar migrações modificadas`);
          modifiedCount++;
        } else {
          console.log(`⏭️ Migração já aplicada: ${filename}`);
          skippedCount++;
        }
      } else {
        // Aplicar nova migração
        await applyMigration(filename);
        appliedCount++;
      }
    }
    
    // Resumo
    console.log('\n📋 Resumo da execução:');
    console.log(`   ✅ Migrações aplicadas: ${appliedCount}`);
    console.log(`   ⏭️ Migrações ignoradas: ${skippedCount}`);
    console.log(`   ⚠️ Migrações modificadas: ${modifiedCount}`);
    
    if (appliedCount > 0) {
      console.log('\n🎉 Migrações aplicadas com sucesso!');
    } else if (modifiedCount > 0) {
      console.log('\n⚠️ Algumas migrações foram modificadas após serem aplicadas');
    } else {
      console.log('\n✨ Todas as migrações já estão aplicadas');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a aplicação de migrações:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Função para forçar reaplicação de migrações
 */
async function forceApplyMigrations() {
  try {
    console.log('🔄 Modo FORCE: Reaplicando todas as migrações...');
    
    // Limpar tabela de migrações
    await pool.query('DELETE FROM schema_migrations');
    console.log('🗑️ Histórico de migrações limpo');
    
    // Aplicar todas as migrações novamente
    await main();
    
  } catch (error) {
    console.error('❌ Erro no modo force:', error.message);
    process.exit(1);
  }
}

/**
 * Função para listar status das migrações
 */
async function listMigrations() {
  try {
    console.log('📋 Status das migrações:');
    
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = getMigrationFiles();
    
    console.log('\n' + '='.repeat(80));
    console.log('ARQUIVO'.padEnd(40) + 'STATUS'.padEnd(20) + 'APLICADA EM');
    console.log('='.repeat(80));
    
    for (const filename of migrationFiles) {
      if (appliedMigrations.has(filename)) {
        const isModified = isMigrationModified(filename, appliedMigrations.get(filename));
        const status = isModified ? '⚠️ MODIFICADA' : '✅ APLICADA';
        
        // Obter data de aplicação
        const result = await pool.query(
          'SELECT applied_at FROM schema_migrations WHERE filename = $1',
          [filename]
        );
        const appliedAt = result.rows[0]?.applied_at?.toISOString().split('T')[0] || 'N/A';
        
        console.log(filename.padEnd(40) + status.padEnd(20) + appliedAt);
      } else {
        console.log(filename.padEnd(40) + '⏳ PENDENTE'.padEnd(20) + '-');
      }
    }
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Erro ao listar migrações:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📚 Script de Migrações PostgreSQL

Uso:
  node apply-migrations.js [opções]

Opções:
  --force, -f     Reaplicar todas as migrações (CUIDADO!)
  --list, -l      Listar status das migrações
  --help, -h      Mostrar esta ajuda

Exemplos:
  node apply-migrations.js              # Aplicar migrações pendentes
  node apply-migrations.js --list        # Listar status
  node apply-migrations.js --force       # Reaplicar todas (CUIDADO!)
`);
  process.exit(0);
}

if (args.includes('--force') || args.includes('-f')) {
  forceApplyMigrations();
} else if (args.includes('--list') || args.includes('-l')) {
  listMigrations();
} else {
  main();
}