#!/usr/bin/env node

/**
 * Script de Validação de Integração Supabase
 * Verifica se o sistema está usando exclusivamente o Supabase
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Iniciando auditoria de integração Supabase...\n')

// Configurações
const PROJECT_ROOT = process.cwd()
const EXCLUDED_DIRS = ['node_modules', '.next', '.git', 'dist', 'build']
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// Padrões proibidos
const FORBIDDEN_PATTERNS = [
  {
    pattern: /\bpg\.|Pool\s*\(|new\s+Client\s*\(|require\(['"]pg['"]|import.*from\s+['"]pg['"]/gi,
    description: 'Conexões diretas PostgreSQL',
    severity: 'CRITICAL'
  },
  {
    pattern: /mysql|mongodb|sqlite/gi,
    description: 'Outros bancos de dados',
    severity: 'CRITICAL'
  },
  {
    pattern: /prisma|sequelize|typeorm|knex/gi,
    description: 'ORMs externos',
    severity: 'CRITICAL'
  },
  {
    pattern: /firebase|auth0|cognito|passport|nextauth/gi,
    description: 'Sistemas de autenticação externos',
    severity: 'CRITICAL'
  },
  {
    pattern: /DATABASE_URL|POSTGRES_URL|MYSQL_URL|MONGODB_URL/gi,
    description: 'URLs de conexão direta com banco',
    severity: 'HIGH'
  }
]

// Padrões obrigatórios
const REQUIRED_PATTERNS = [
  {
    pattern: /@supabase\/supabase-js/,
    description: 'Cliente oficial Supabase',
    files: ['lib/supabase.ts', 'package.json']
  },
  {
    pattern: /getSupabaseServerClient/,
    description: 'Função de cliente servidor',
    files: ['lib/db/', 'lib/supabase.ts']
  }
]

let violations = []
let warnings = []
let passed = []

/**
 * Verifica se um diretório deve ser excluído
 */
function shouldExcludeDir(dirPath) {
  return EXCLUDED_DIRS.some(excluded => dirPath.includes(excluded))
}

/**
 * Verifica se um arquivo deve ser processado
 */
function shouldProcessFile(filePath) {
  return FILE_EXTENSIONS.some(ext => filePath.endsWith(ext))
}

/**
 * Busca arquivos recursivamente
 */
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && !shouldExcludeDir(fullPath)) {
      findFiles(fullPath, files)
    } else if (stat.isFile() && shouldProcessFile(fullPath)) {
      files.push(fullPath)
    }
  }
  
  return files
}

/**
 * Analisa um arquivo em busca de padrões proibidos
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const relativePath = path.relative(PROJECT_ROOT, filePath)
    
    // Pular o próprio script de validação
    if (relativePath.includes('validate-supabase-integration.js')) {
      return
    }
    
    for (const { pattern, description, severity } of FORBIDDEN_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        const violation = {
          file: relativePath,
          pattern: pattern.toString(),
          description,
          severity,
          matches: matches.slice(0, 3) // Limitar a 3 matches
        }
        
        if (severity === 'CRITICAL') {
          violations.push(violation)
        } else {
          warnings.push(violation)
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Erro ao ler arquivo ${filePath}: ${error.message}`)
  }
}

/**
 * Verifica se padrões obrigatórios estão presentes
 */
function checkRequiredPatterns() {
  for (const { pattern, description, files } of REQUIRED_PATTERNS) {
    let found = false
    
    for (const filePattern of files) {
      // Buscar arquivos que correspondem ao padrão
      const allFiles = findFiles(PROJECT_ROOT)
      const matchingFiles = allFiles.filter(f => {
        const relativePath = path.relative(PROJECT_ROOT, f)
        return relativePath.includes(filePattern)
      })
      
      for (const file of matchingFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8')
          if (pattern.test(content)) {
            found = true
            passed.push({
              description,
              file: path.relative(PROJECT_ROOT, file)
            })
            break
          }
        } catch (error) {
          // Ignorar erros de leitura
        }
      }
      
      if (found) break
    }
    
    if (!found) {
      // Verificar se pelo menos existe no package.json ou lib/supabase.ts
      try {
        const packageJson = fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')
        const supabaseLib = fs.readFileSync(path.join(PROJECT_ROOT, 'lib/supabase.ts'), 'utf8')
        
        if (pattern.test(packageJson) || pattern.test(supabaseLib)) {
          found = true
          passed.push({
            description,
            file: pattern.test(packageJson) ? 'package.json' : 'lib/supabase.ts'
          })
        }
      } catch (error) {
        // Arquivos não encontrados
      }
    }
    
    if (!found) {
      violations.push({
        file: 'GLOBAL',
        pattern: pattern.toString(),
        description: `Padrão obrigatório não encontrado: ${description}`,
        severity: 'CRITICAL',
        matches: []
      })
    }
  }
}

/**
 * Verifica configuração do Supabase
 */
function checkSupabaseConfig() {
  const envExample = path.join(PROJECT_ROOT, '.env.example')
  const supabaseConfig = path.join(PROJECT_ROOT, 'lib/supabase.ts')
  
  // Verificar .env.example
  if (fs.existsSync(envExample)) {
    const content = fs.readFileSync(envExample, 'utf8')
    if (content.includes('SUPABASE_URL') && content.includes('SUPABASE_KEY')) {
      passed.push({
        description: 'Variáveis Supabase configuradas em .env.example',
        file: '.env.example'
      })
    } else {
      warnings.push({
        file: '.env.example',
        description: 'Variáveis Supabase não encontradas',
        severity: 'HIGH'
      })
    }
  }
  
  // Verificar configuração do cliente
  if (fs.existsSync(supabaseConfig)) {
    const content = fs.readFileSync(supabaseConfig, 'utf8')
    if (content.includes('createClient') && content.includes('SUPABASE_URL')) {
      passed.push({
        description: 'Cliente Supabase configurado corretamente',
        file: 'lib/supabase.ts'
      })
    }
  }
}

/**
 * Verifica configuração MCP
 */
function checkMCPConfig() {
  const mcpConfig = path.join(PROJECT_ROOT, '.kiro/settings/mcp.json')
  
  if (fs.existsSync(mcpConfig)) {
    try {
      const content = JSON.parse(fs.readFileSync(mcpConfig, 'utf8'))
      if (content.mcpServers && content.mcpServers.supabase) {
        passed.push({
          description: 'Configuração MCP Supabase encontrada',
          file: '.kiro/settings/mcp.json'
        })
      }
    } catch (error) {
      warnings.push({
        file: '.kiro/settings/mcp.json',
        description: 'Erro ao ler configuração MCP',
        severity: 'MEDIUM'
      })
    }
  } else {
    warnings.push({
      file: '.kiro/settings/mcp.json',
      description: 'Configuração MCP não encontrada',
      severity: 'MEDIUM'
    })
  }
}

/**
 * Executa a auditoria completa
 */
function runAudit() {
  console.log('📁 Buscando arquivos...')
  const files = findFiles(PROJECT_ROOT)
  console.log(`   Encontrados ${files.length} arquivos para análise\n`)
  
  console.log('🔍 Analisando padrões proibidos...')
  files.forEach(analyzeFile)
  
  console.log('✅ Verificando padrões obrigatórios...')
  checkRequiredPatterns()
  
  console.log('⚙️  Verificando configurações...')
  checkSupabaseConfig()
  checkMCPConfig()
}

/**
 * Exibe relatório final
 */
function showReport() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RELATÓRIO DE AUDITORIA SUPABASE')
  console.log('='.repeat(60))
  
  // Violações críticas
  if (violations.length > 0) {
    console.log('\n❌ VIOLAÇÕES CRÍTICAS:')
    violations.forEach(v => {
      console.log(`   📁 ${v.file}`)
      console.log(`   🚫 ${v.description}`)
      console.log(`   🔍 Padrão: ${v.pattern}`)
      if (v.matches && v.matches.length > 0) {
        console.log(`   📝 Matches: ${v.matches.join(', ')}`)
      }
      console.log('')
    })
  }
  
  // Avisos
  if (warnings.length > 0) {
    console.log('\n⚠️  AVISOS:')
    warnings.forEach(w => {
      console.log(`   📁 ${w.file}`)
      console.log(`   ⚠️  ${w.description}`)
      console.log('')
    })
  }
  
  // Sucessos
  if (passed.length > 0) {
    console.log('\n✅ VERIFICAÇÕES APROVADAS:')
    passed.forEach(p => {
      console.log(`   📁 ${p.file}`)
      console.log(`   ✅ ${p.description}`)
      console.log('')
    })
  }
  
  // Resumo
  console.log('📈 RESUMO:')
  console.log(`   ✅ Aprovadas: ${passed.length}`)
  console.log(`   ⚠️  Avisos: ${warnings.length}`)
  console.log(`   ❌ Violações: ${violations.length}`)
  
  // Status final
  if (violations.length === 0) {
    console.log('\n🎉 AUDITORIA APROVADA: Sistema 100% integrado ao Supabase!')
    process.exit(0)
  } else {
    console.log('\n🚨 AUDITORIA REPROVADA: Violações críticas encontradas!')
    process.exit(1)
  }
}

// Executar auditoria
try {
  runAudit()
  showReport()
} catch (error) {
  console.error('❌ Erro durante auditoria:', error.message)
  process.exit(1)
}