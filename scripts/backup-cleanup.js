#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script de backup para limpeza de código
 * Cria backup dos arquivos e pastas que serão removidos
 */

const BACKUP_DIR = 'backup-cleanup';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Arquivos e pastas que serão removidos
const ITEMS_TO_BACKUP = [
  '.cursor',
  'src',
  'coverage',
  'tests',
  'package-simplified.json',
  'next.config.simplified.js',
  'tailwind.config.simplified.js',
  'tsconfig.simplified.json',
  'README-SIMPLIFIED.md',
  'REORGANIZATION_PLAN.md',
  'REORGANIZATION_SUMMARY.md'
];

function createBackupDir() {
  const backupPath = path.join(BACKUP_DIR, TIMESTAMP);
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  return backupPath;
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Item não encontrado: ${src}`);
    return;
  }

  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(
        path.join(src, file),
        path.join(dest, file)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function createBackup() {
  console.log('🔄 Criando backup dos arquivos que serão removidos...\n');
  
  const backupPath = createBackupDir();
  const backupInfo = {
    timestamp: new Date().toISOString(),
    items: [],
    totalSize: 0
  };

  ITEMS_TO_BACKUP.forEach(item => {
    const srcPath = path.resolve(item);
    const destPath = path.join(backupPath, item);
    
    if (fs.existsSync(srcPath)) {
      console.log(`📁 Fazendo backup: ${item}`);
      copyRecursive(srcPath, destPath);
      
      const stats = fs.statSync(srcPath);
      backupInfo.items.push({
        path: item,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size || 0
      });
      backupInfo.totalSize += stats.size || 0;
    } else {
      console.log(`⚠️  Item não encontrado: ${item}`);
    }
  });

  // Salvar informações do backup
  fs.writeFileSync(
    path.join(backupPath, 'backup-info.json'),
    JSON.stringify(backupInfo, null, 2)
  );

  console.log(`\n✅ Backup criado em: ${backupPath}`);
  console.log(`📊 Total de itens: ${backupInfo.items.length}`);
  console.log(`💾 Tamanho total: ${(backupInfo.totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  return backupPath;
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup, ITEMS_TO_BACKUP };