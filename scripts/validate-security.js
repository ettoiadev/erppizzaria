#!/usr/bin/env node

/**
 * Script de Validação de Segurança
 * Verifica se as variáveis críticas estão configuradas corretamente
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env.local') })

console.log('🔒 Validando configurações de segurança...\n')

let hasErrors = false
const errors = []
const warnings = []

// Verificações críticas
function checkCritical(envVar, description) {
  if (!process.env[envVar]) {
    errors.push(`❌ ${envVar}: ${description}`)
    hasErrors = true
  } else {
    console.log(`✅ ${envVar}: Configurado`)
  }
}

// Verificações de aviso
function checkWarning(envVar, description, defaultValue) {
  if (!process.env[envVar]) {
    warnings.push(`⚠️  ${envVar}: ${description} (usando padrão: ${defaultValue})`)
  } else {
    console.log(`✅ ${envVar}: Configurado`)
  }
}

// Verificações de ambiente
function checkEnvironment() {
  const env = process.env.NODE_ENV || 'development'
  console.log(`\n🌍 Ambiente: ${env}`)
  
  if (env === 'production') {
    console.log('🚨 AMBIENTE DE PRODUÇÃO - Verificações rigorosas ativadas')
  } else {
    console.log('🔧 Ambiente de desenvolvimento - Verificações relaxadas')
  }
}

// Verificações críticas
console.log('🔐 Variáveis Críticas:')
checkCritical('JWT_SECRET', 'Chave secreta para JWT (obrigatória)')
checkCritical('SUPABASE_URL', 'URL do projeto Supabase (obrigatória)')
checkCritical('SUPABASE_KEY', 'Chave de serviço do Supabase (obrigatória)')

// Verificações de aviso
console.log('\n💰 Variáveis de Pagamento:')
checkWarning('MERCADOPAGO_ACCESS_TOKEN', 'Token de acesso do Mercado Pago', 'Não configurado')
checkWarning('MERCADOPAGO_WEBHOOK_SECRET', 'Segredo do webhook MP', 'Não configurado')

// Verificações de ambiente
checkEnvironment()

// Verificações específicas de produção
if (process.env.NODE_ENV === 'production') {
  console.log('\n🚨 Verificações de Produção:')
  
  // Verificar se JWT_SECRET não é o padrão de desenvolvimento
  if (process.env.JWT_SECRET === 'william-disk-pizza-dev-temp-key-2024') {
    errors.push('❌ JWT_SECRET: Usando chave de desenvolvimento em produção!')
    hasErrors = true
  }
  
  // Verificar se MERCADOPAGO_WEBHOOK_SECRET está configurado
  if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    errors.push('❌ MERCADOPAGO_WEBHOOK_SECRET: Obrigatório em produção para segurança')
    hasErrors = true
  }
  
  // Verificar se não há variáveis de desenvolvimento
  const devVars = ['NODE_ENV', 'SUPABASE_URL']
  devVars.forEach(varName => {
    if (process.env[varName]?.includes('localhost') || process.env[varName]?.includes('127.0.0.1')) {
      errors.push(`❌ ${varName}: Usando endereço local em produção!`)
      hasErrors = true
    }
  })
}

// Verificações de segurança adicional
console.log('\n🛡️ Verificações de Segurança:')

// Verificar força do JWT_SECRET
if (process.env.JWT_SECRET) {
  const secret = process.env.JWT_SECRET
  if (secret.length < 32) {
    warnings.push('⚠️  JWT_SECRET: Muito curto, recomendado mínimo 32 caracteres')
  }
  if (secret === secret.toLowerCase() || secret === secret.toUpperCase()) {
    warnings.push('⚠️  JWT_SECRET: Considere usar maiúsculas e minúsculas')
  }
  if (!/\d/.test(secret)) {
    warnings.push('⚠️  JWT_SECRET: Considere incluir números')
  }
}

// Verificar HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl && !siteUrl.startsWith('https://')) {
    warnings.push('⚠️  NEXT_PUBLIC_SITE_URL: Recomendado usar HTTPS em produção')
  }
}

// Resultado final
console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.log('❌ VALIDAÇÃO FALHOU - Corrija os erros críticos:')
  errors.forEach(error => console.log(error))
  
  if (warnings.length > 0) {
    console.log('\n⚠️  AVISOS (não críticos):')
    warnings.forEach(warning => console.log(warning))
  }
  
  console.log('\n🚨 A aplicação NÃO deve ser executada em produção até corrigir os erros críticos!')
  process.exit(1)
} else {
  console.log('✅ VALIDAÇÃO PASSOU - Configurações de segurança adequadas')
  
  if (warnings.length > 0) {
    console.log('\n⚠️  AVISOS (recomendações):')
    warnings.forEach(warning => console.log(warning))
  }
  
  console.log('\n🚀 A aplicação está pronta para execução!')
}

console.log('\n' + '='.repeat(50))
