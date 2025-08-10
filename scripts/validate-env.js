#!/usr/bin/env node

/**
 * Script de Validação de Variáveis de Ambiente
 * 
 * Este script verifica se todas as variáveis de ambiente necessárias
 * estão configuradas corretamente para o projeto ERP Pizzaria.
 * 
 * Uso:
 * node scripts/validate-env.js
 * npm run validate-env
 */

const fs = require('fs')
const path = require('path')

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

// Função para colorir texto
const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`

// Configuração das variáveis obrigatórias
const requiredVars = {
  // Supabase
  SUPABASE_URL: {
    description: 'URL do projeto Supabase',
    type: 'private',
    validation: (value) => {
      if (!value) return 'Variável não definida'
      if (!value.startsWith('http')) return 'Deve ser uma URL válida'
      return null
    }
  },
  SUPABASE_KEY: {
    description: 'Chave de autenticação do Supabase',
    type: 'private',
    validation: (value) => {
      if (!value) return 'Variável não definida'
      if (value.length < 20) return 'Chave muito curta'
      return null
    }
  },
  
  // JWT
  JWT_SECRET: {
    description: 'Chave secreta para tokens JWT',
    type: 'private',
    validation: (value) => {
      if (!value) return 'Variável não definida'
      if (value.length < 32) return 'Deve ter pelo menos 32 caracteres'
      if (value === 'sua_chave_secreta_super_segura_aqui') return 'Use uma chave personalizada'
      return null
    }
  },
  
  // Mercado Pago
  MERCADOPAGO_ACCESS_TOKEN: {
    description: 'Token de acesso do Mercado Pago',
    type: 'private',
    validation: (value) => {
      if (!value) return 'Variável não definida'
      if (!value.startsWith('TEST-') && !value.startsWith('APP_USR-')) {
        return 'Deve começar com TEST- ou APP_USR-'
      }
      return null
    }
  },
  MERCADOPAGO_WEBHOOK_SECRET: {
    description: 'Chave secreta para webhooks do Mercado Pago',
    type: 'private',
    validation: (value) => {
      if (!value) return 'Variável não definida'
      if (value === 'your_webhook_secret_here') return 'Use uma chave personalizada'
      return null
    }
  },
  
  // Públicas
  NEXT_PUBLIC_SITE_URL: {
    description: 'URL base da aplicação',
    type: 'public',
    validation: (value) => {
      if (!value) return 'Variável não definida'
      if (!value.startsWith('http')) return 'Deve ser uma URL válida'
      return null
    }
  }
}

// Variáveis opcionais
const optionalVars = {
  NODE_ENV: {
    description: 'Ambiente de execução',
    defaultValue: 'development',
    validation: (value) => {
      const validEnvs = ['development', 'production', 'test']
      if (value && !validEnvs.includes(value)) {
        return `Deve ser um de: ${validEnvs.join(', ')}`
      }
      return null
    }
  },
  ENABLE_QUERY_LOGS: {
    description: 'Habilitar logs de consultas',
    defaultValue: 'false',
    validation: (value) => {
      if (value && !['true', 'false'].includes(value)) {
        return 'Deve ser true ou false'
      }
      return null
    }
  },
  RATE_LIMIT_REQUESTS: {
    description: 'Limite de requisições por minuto',
    defaultValue: '100',
    validation: (value) => {
      if (value && isNaN(parseInt(value))) {
        return 'Deve ser um número'
      }
      return null
    }
  }
}

// Variáveis que NÃO devem estar presentes (legadas)
const deprecatedVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  const envExamplePath = path.join(process.cwd(), '.env.example')
  
  if (!fs.existsSync(envPath)) {
    console.log(colorize('⚠️  Arquivo .env.local não encontrado', 'yellow'))
    if (fs.existsSync(envExamplePath)) {
      console.log(colorize('💡 Copie .env.example para .env.local e configure as variáveis', 'blue'))
    }
    return false
  }
  
  // Carregar variáveis do arquivo .env.local
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  
  envLines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=')
      }
    }
  })
  
  return true
}

function validateEnvironment() {
  console.log(colorize('🔍 Validando Variáveis de Ambiente...', 'cyan'))
  console.log()
  
  let hasErrors = false
  let hasWarnings = false
  
  // Verificar variáveis obrigatórias
  console.log(colorize('📋 Variáveis Obrigatórias:', 'blue'))
  
  for (const [varName, config] of Object.entries(requiredVars)) {
    const value = process.env[varName]
    const error = config.validation(value)
    
    if (error) {
      console.log(colorize(`❌ ${varName}: ${error}`, 'red'))
      hasErrors = true
    } else {
      const typeIcon = config.type === 'private' ? '🔒' : '🌐'
      console.log(colorize(`✅ ${varName}: ${typeIcon} Configurada`, 'green'))
    }
  }
  
  console.log()
  
  // Verificar variáveis opcionais
  console.log(colorize('⚙️  Variáveis Opcionais:', 'blue'))
  
  for (const [varName, config] of Object.entries(optionalVars)) {
    const value = process.env[varName]
    
    if (!value) {
      console.log(colorize(`⚪ ${varName}: Usando padrão (${config.defaultValue})`, 'yellow'))
    } else {
      const error = config.validation(value)
      if (error) {
        console.log(colorize(`⚠️  ${varName}: ${error}`, 'yellow'))
        hasWarnings = true
      } else {
        console.log(colorize(`✅ ${varName}: ${value}`, 'green'))
      }
    }
  }
  
  console.log()
  
  // Verificar variáveis legadas
  console.log(colorize('🗑️  Verificando Variáveis Legadas:', 'blue'))
  
  let hasDeprecated = false
  for (const varName of deprecatedVars) {
    if (process.env[varName]) {
      console.log(colorize(`⚠️  ${varName}: Variável legada encontrada - remova do .env`, 'yellow'))
      hasDeprecated = true
      hasWarnings = true
    }
  }
  
  if (!hasDeprecated) {
    console.log(colorize('✅ Nenhuma variável legada encontrada', 'green'))
  }
  
  console.log()
  
  // Verificações específicas do ambiente
  console.log(colorize('🌍 Verificações de Ambiente:', 'blue'))
  
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'
  const isDevelopment = nodeEnv === 'development'
  
  // Verificar se está usando chaves de produção em desenvolvimento
  if (isDevelopment) {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (mpToken && mpToken.startsWith('APP_USR-')) {
      console.log(colorize('⚠️  Usando token de produção do MP em desenvolvimento', 'yellow'))
      hasWarnings = true
    }
    
    const supabaseUrl = process.env.SUPABASE_URL
    if (supabaseUrl && !supabaseUrl.includes('localhost')) {
      console.log(colorize('⚠️  Usando Supabase de produção em desenvolvimento', 'yellow'))
      hasWarnings = true
    }
  }
  
  // Verificar se está usando chaves de teste em produção
  if (isProduction) {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (mpToken && mpToken.startsWith('TEST-')) {
      console.log(colorize('❌ Usando token de teste do MP em produção', 'red'))
      hasErrors = true
    }
    
    const jwtSecret = process.env.JWT_SECRET
    if (jwtSecret && jwtSecret.includes('desenvolvimento')) {
      console.log(colorize('❌ JWT secret parece ser de desenvolvimento', 'red'))
      hasErrors = true
    }
  }
  
  console.log(colorize(`✅ Ambiente: ${nodeEnv}`, 'green'))
  
  console.log()
  
  // Resumo final
  if (hasErrors) {
    console.log(colorize('❌ VALIDAÇÃO FALHOU - Corrija os erros acima', 'red'))
    process.exit(1)
  } else if (hasWarnings) {
    console.log(colorize('⚠️  VALIDAÇÃO COM AVISOS - Revise as configurações', 'yellow'))
    process.exit(0)
  } else {
    console.log(colorize('✅ VALIDAÇÃO PASSOU - Todas as variáveis estão corretas!', 'green'))
    process.exit(0)
  }
}

function showHelp() {
  console.log(colorize('🔧 Script de Validação de Variáveis de Ambiente', 'cyan'))
  console.log()
  console.log('Este script verifica se todas as variáveis de ambiente necessárias')
  console.log('estão configuradas corretamente para o projeto ERP Pizzaria.')
  console.log()
  console.log(colorize('Uso:', 'blue'))
  console.log('  node scripts/validate-env.js')
  console.log('  npm run validate-env')
  console.log()
  console.log(colorize('Opções:', 'blue'))
  console.log('  --help    Mostra esta ajuda')
  console.log()
}

// Verificar argumentos da linha de comando
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp()
  process.exit(0)
}

// Executar validação
if (loadEnvFile()) {
  validateEnvironment()
} else {
  console.log(colorize('❌ Não foi possível carregar arquivo de ambiente', 'red'))
  process.exit(1)
}