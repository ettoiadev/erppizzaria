#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ITEMS_TO_BACKUP } = require('./backup-cleanup');

/**
 * Script de análise de dependências
 * Analisa referências cruzadas antes da remoção de arquivos
 */

const ANALYSIS_OUTPUT = 'dependency-analysis.json';

// Extensões de arquivo para analisar
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.scss'];

// Padrões de import/require para buscar
const IMPORT_PATTERNS = [
  /import.*from\s+['"`]([^'"`]+)['"`]/g,
  /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  /@\/([^'"`\s]+)/g,
  /\.\/([^'"`\s]+)/g,
  /\.\.\/([^'"`\s]+)/g
];

function getAllFiles(dir, extensions = CODE_EXTENSIONS) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Pular node_modules e outras pastas irrelevantes
        if (!['node_modules', '.git', '.next', 'coverage'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

function findReferences(content, filePath) {
  const references = [];
  
  IMPORT_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const ref = match[1];
      if (ref && !ref.startsWith('node:') && !ref.startsWith('http')) {
        references.push({
          reference: ref,
          line: content.substring(0, match.index).split('\n').length,
          context: match[0]
        });
      }
    }
  });
  
  return references;
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const references = findReferences(content, filePath);
    
    return {
      path: filePath,
      references,
      size: fs.statSync(filePath).size
    };
  } catch (error) {
    console.error(`Erro ao analisar ${filePath}:`, error.message);
    return null;
  }
}

function checkIfReferenced(itemPath, allAnalysis) {
  const referencedBy = [];
  
  allAnalysis.forEach(analysis => {
    if (!analysis || analysis.path === itemPath) return;
    
    analysis.references.forEach(ref => {
      const resolvedRef = resolveReference(ref.reference, analysis.path);
      if (resolvedRef && resolvedRef.includes(itemPath)) {
        referencedBy.push({
          file: analysis.path,
          reference: ref.reference,
          line: ref.line,
          context: ref.context
        });
      }
    });
  });
  
  return referencedBy;
}

function resolveReference(reference, fromFile) {
  try {
    // Resolver referências relativas
    if (reference.startsWith('./') || reference.startsWith('../')) {
      return path.resolve(path.dirname(fromFile), reference);
    }
    
    // Resolver alias @/
    if (reference.startsWith('@/')) {
      return path.resolve(reference.replace('@/', './'));
    }
    
    // Referência absoluta do projeto
    if (!reference.includes('/') || reference.startsWith('/')) {
      return path.resolve('.', reference);
    }
    
    return reference;
  } catch (error) {
    return reference;
  }
}

function analyzeDependencies() {
  console.log('🔍 Analisando dependências do projeto...\n');
  
  // Obter todos os arquivos do projeto
  const allFiles = getAllFiles('.');
  console.log(`📁 Encontrados ${allFiles.length} arquivos para análise`);
  
  // Analisar cada arquivo
  const allAnalysis = allFiles.map(file => {
    process.stdout.write(`\r🔄 Analisando: ${file.substring(0, 50)}...`);
    return analyzeFile(file);
  }).filter(Boolean);
  
  console.log(`\n✅ Análise concluída para ${allAnalysis.length} arquivos\n`);
  
  // Analisar itens que serão removidos
  const removalAnalysis = ITEMS_TO_BACKUP.map(item => {
    console.log(`🔍 Verificando referências para: ${item}`);
    
    const itemPath = path.resolve(item);
    const referencedBy = checkIfReferenced(itemPath, allAnalysis);
    
    const analysis = {
      item,
      exists: fs.existsSync(itemPath),
      isReferenced: referencedBy.length > 0,
      referencedBy,
      canRemove: referencedBy.length === 0,
      type: fs.existsSync(itemPath) ? 
        (fs.statSync(itemPath).isDirectory() ? 'directory' : 'file') : 'missing'
    };
    
    if (analysis.isReferenced) {
      console.log(`  ⚠️  Referenciado por ${referencedBy.length} arquivo(s)`);
    } else {
      console.log(`  ✅ Seguro para remoção`);
    }
    
    return analysis;
  });
  
  // Gerar relatório
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: allFiles.length,
      itemsToRemove: ITEMS_TO_BACKUP.length,
      safeToRemove: removalAnalysis.filter(item => item.canRemove).length,
      hasReferences: removalAnalysis.filter(item => item.isReferenced).length
    },
    itemAnalysis: removalAnalysis,
    recommendations: generateRecommendations(removalAnalysis)
  };
  
  // Salvar relatório
  fs.writeFileSync(ANALYSIS_OUTPUT, JSON.stringify(report, null, 2));
  
  console.log('\n📊 RESUMO DA ANÁLISE:');
  console.log(`   Total de arquivos analisados: ${report.summary.totalFiles}`);
  console.log(`   Itens para remoção: ${report.summary.itemsToRemove}`);
  console.log(`   Seguros para remoção: ${report.summary.safeToRemove}`);
  console.log(`   Com referências: ${report.summary.hasReferences}`);
  console.log(`\n📄 Relatório salvo em: ${ANALYSIS_OUTPUT}`);
  
  return report;
}

function generateRecommendations(analysis) {
  const recommendations = [];
  
  analysis.forEach(item => {
    if (item.isReferenced) {
      recommendations.push({
        item: item.item,
        severity: 'warning',
        message: `Item referenciado por ${item.referencedBy.length} arquivo(s). Verificar antes de remover.`,
        references: item.referencedBy.map(ref => ({
          file: ref.file,
          line: ref.line
        }))
      });
    } else if (item.exists) {
      recommendations.push({
        item: item.item,
        severity: 'info',
        message: 'Seguro para remoção - nenhuma referência encontrada.'
      });
    } else {
      recommendations.push({
        item: item.item,
        severity: 'info',
        message: 'Item não existe - pode ser removido da lista.'
      });
    }
  });
  
  return recommendations;
}

if (require.main === module) {
  analyzeDependencies();
}

module.exports = { analyzeDependencies };