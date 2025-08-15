#!/usr/bin/env node

/**
 * Script de Execução dos Testes de Contrato
 * 
 * Script para executar os testes de contrato da API do print-server
 * com diferentes configurações e relatórios.
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Configurações
const config = {
  printServerUrl: process.env.PRINT_SERVER_URL || 'http://localhost:3001',
  timeout: process.env.TEST_TIMEOUT || '30000',
  verbose: process.env.TEST_VERBOSE === 'true',
  ci: process.env.CI === 'true',
  coverage: process.argv.includes('--coverage'),
  watch: process.argv.includes('--watch'),
  restOnly: process.argv.includes('--rest-only'),
  socketOnly: process.argv.includes('--socket-only'),
  debug: process.argv.includes('--debug')
}

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Função para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Função para verificar se o print-server está rodando
function checkPrintServer() {
  return new Promise((resolve) => {
    const http = require('http')
    const url = new URL(config.printServerUrl)
    
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: '/status',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(res.statusCode === 200)
    })
    
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    
    req.end()
  })
}

// Função para executar Jest
function runJest(args = []) {
  return new Promise((resolve, reject) => {
    // Usar o Jest CLI diretamente
    const jestArgs = [
      require.resolve('jest/bin/jest'),
      '--config=jest.config.js',
      ...args
    ]
    
    if (config.ci) {
      jestArgs.push('--ci', '--watchAll=false')
    }
    
    if (config.coverage) {
      jestArgs.push('--coverage')
    }
    
    if (config.watch) {
      jestArgs.push('--watch')
    }
    
    if (config.verbose) {
      jestArgs.push('--verbose')
    }
    
    if (config.debug) {
      jestArgs.unshift('--inspect-brk')
      jestArgs.push('--runInBand')
    }
    
    if (config.restOnly) {
      jestArgs.push('rest-api.test.js')
    } else if (config.socketOnly) {
      jestArgs.push('socket-events.test.js')
    }
    
    const jest = spawn('node', jestArgs, {
      stdio: 'inherit',
      cwd: __dirname,
      env: {
        ...process.env,
        PRINT_SERVER_URL: config.printServerUrl,
        TEST_TIMEOUT: config.timeout
      }
    })
    
    jest.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Jest exited with code ${code}`))
      }
    })
    
    jest.on('error', reject)
  })
}

// Função para criar diretório de relatórios
function ensureReportsDir() {
  const reportsDir = path.join(__dirname, 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
}

// Função para exibir ajuda
function showHelp() {
  log('\n📋 Testes de Contrato - Print Server API', 'cyan')
  log('\nUso: node run-tests.js [opções]\n', 'bright')
  log('Opções:', 'yellow')
  log('  --coverage     Gerar relatório de cobertura')
  log('  --watch        Executar em modo watch')
  log('  --rest-only    Executar apenas testes REST API')
  log('  --socket-only  Executar apenas testes Socket.io')
  log('  --debug        Executar em modo debug')
  log('  --help         Exibir esta ajuda')
  log('\nVariáveis de ambiente:', 'yellow')
  log('  PRINT_SERVER_URL    URL do print-server (padrão: http://localhost:3001)')
  log('  TEST_TIMEOUT        Timeout dos testes em ms (padrão: 30000)')
  log('  TEST_VERBOSE        Log verboso (true/false)')
  log('  CI                  Modo CI/CD (true/false)')
  log('\nExemplos:', 'yellow')
  log('  node run-tests.js                    # Executar todos os testes')
  log('  node run-tests.js --rest-only        # Apenas testes REST')
  log('  node run-tests.js --coverage         # Com cobertura')
  log('  PRINT_SERVER_URL=http://localhost:3002 node run-tests.js  # URL customizada\n')
}

// Função principal
async function main() {
  // Verificar se é pedido de ajuda
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp()
    return
  }
  
  log('🧪 Iniciando Testes de Contrato - Print Server API', 'cyan')
  log(`📡 URL do Print Server: ${config.printServerUrl}`, 'blue')
  
  // Verificar se o print-server está rodando
  log('\n🔍 Verificando disponibilidade do print-server...', 'yellow')
  const serverAvailable = await checkPrintServer()
  
  if (serverAvailable) {
    log('✅ Print-server está disponível', 'green')
  } else {
    log('⚠️  Print-server não está disponível - testes serão executados em modo mock', 'yellow')
  }
  
  // Criar diretório de relatórios
  ensureReportsDir()
  
  // Executar testes
  try {
    log('\n🚀 Executando testes...', 'cyan')
    await runJest()
    log('\n✅ Todos os testes foram executados com sucesso!', 'green')
    
    // Exibir informações sobre relatórios
    if (config.coverage) {
      log('📊 Relatório de cobertura gerado em: ./coverage/', 'blue')
    }
    
    const reportsDir = path.join(__dirname, 'reports')
    if (fs.existsSync(reportsDir)) {
      log('📋 Relatórios de teste disponíveis em: ./reports/', 'blue')
    }
    
  } catch (error) {
    log(`\n❌ Erro ao executar testes: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Tratamento de sinais
process.on('SIGINT', () => {
  log('\n🛑 Testes interrompidos pelo usuário', 'yellow')
  process.exit(0)
})

process.on('SIGTERM', () => {
  log('\n🛑 Testes terminados', 'yellow')
  process.exit(0)
})

// Executar função principal
if (require.main === module) {
  main().catch((error) => {
    log(`\n💥 Erro fatal: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { main, checkPrintServer, runJest }