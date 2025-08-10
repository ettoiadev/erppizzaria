#!/usr/bin/env node

/**
 * Script para corrigir dependências deprecated e warnings de build
 * Execute com: node scripts/fix-dependencies.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 Iniciando correção de dependências...')

// 1. Limpar cache do npm
console.log('📦 Limpando cache do npm...')
try {
  execSync('npm cache clean --force', { stdio: 'inherit' })
} catch (error) {
  console.warn('⚠️ Aviso: Não foi possível limpar o cache do npm')
}

// 2. Remover node_modules e package-lock.json
console.log('🗑️ Removendo node_modules e package-lock.json...')
try {
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' })
  }
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json')
  }
} catch (error) {
  console.warn('⚠️ Aviso: Erro ao remover arquivos:', error.message)
}

// 3. Atualizar package.json com overrides para resolver dependências problemáticas
console.log('📝 Atualizando package.json...')
const packageJsonPath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

// Adicionar overrides para resolver dependências deprecated
packageJson.overrides = {
  "request": "npm:@cypress/request@^3.0.0",
  "har-validator": "npm:har-schema@^2.0.0",
  "uuid": "^9.0.0",
  "glob": "^10.0.0",
  "rimraf": "^5.0.0",
  "eslint": "^9.0.0"
}

// Adicionar resolutions para yarn (caso seja usado)
packageJson.resolutions = {
  "request": "npm:@cypress/request@^3.0.0",
  "har-validator": "npm:har-schema@^2.0.0",
  "uuid": "^9.0.0",
  "glob": "^10.0.0",
  "rimraf": "^5.0.0"
}

// Salvar package.json atualizado
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

// 4. Reinstalar dependências
console.log('📦 Reinstalando dependências...')
try {
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' })
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message)
  process.exit(1)
}

// 5. Verificar se há vulnerabilidades
console.log('🔍 Verificando vulnerabilidades...')
try {
  execSync('npm audit --audit-level=high', { stdio: 'inherit' })
} catch (error) {
  console.warn('⚠️ Vulnerabilidades encontradas. Execute "npm audit fix" se necessário.')
}

console.log('✅ Correção de dependências concluída!')
console.log('\n📋 Próximos passos:')
console.log('1. Execute "npm run build" para testar o build')
console.log('2. Se houver erros, execute "npm audit fix"')
console.log('3. Faça commit das alterações')
console.log('4. Faça deploy na Vercel')