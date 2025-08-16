#!/usr/bin/env node

/**
 * Script de validação para deploy
 * Verifica se todas as configurações estão corretas antes do deploy
 */

const { validateEnvironment } = require('../lib/environment-validator')

async function validateDeployment() {
  console.log('🔍 Validando configuração para deploy...\n')

  try {
    // Validar ambiente
    const envResult = validateEnvironment()
    
    if (!envResult.isValid) {
      console.error('❌ Configuração de ambiente inválida:')
      envResult.errors.forEach(error => {
        console.error(`  - ${error}`)
      })
      process.exit(1)
    }

    if (envResult.warnings.length > 0) {
      console.warn('⚠️  Avisos de configuração:')
      envResult.warnings.forEach(warning => {
        console.warn(`  - ${warning}`)
      })
    }

    console.log('✅ Configuração de ambiente válida')

    // Verificar se é produção
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Validação para ambiente de produção')
      
      // Verificações específicas de produção
      const prodChecks = [
        {
          name: 'JWT_SECRET não é temporário',
          check: () => process.env.JWT_SECRET !== 'william-disk-pizza-dev-temp-key-2024'
        },
        {
          name: 'SUPABASE_URL não é localhost',
          check: () => !process.env.SUPABASE_URL?.includes('localhost')
        },
        {
          name: 'NEXT_PUBLIC_SITE_URL é HTTPS',
          check: () => process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://')
        }
      ]

      let prodValid = true
      for (const check of prodChecks) {
        if (check.check()) {
          console.log(`  ✅ ${check.name}`)
        } else {
          console.error(`  ❌ ${check.name}`)
          prodValid = false
        }
      }

      if (!prodValid) {
        console.error('\n❌ Falha na validação de produção')
        process.exit(1)
      }
    }

    console.log('\n🎉 Todas as validações passaram! Deploy pode prosseguir.')
    
  } catch (error) {
    console.error('❌ Erro durante validação:', error.message)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  validateDeployment()
}

module.exports = { validateDeployment }