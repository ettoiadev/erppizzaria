/**
 * Configuração de Variáveis de Ambiente para Testes de Contrato
 * 
 * Define variáveis de ambiente específicas para os testes de contrato.
 */

// Configuração de variáveis de ambiente para testes
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.PRINT_SERVER_URL = process.env.PRINT_SERVER_URL || 'http://localhost:3001'

// Configurações de timeout para diferentes ambientes
if (process.env.CI) {
  // Configurações para CI/CD (timeouts maiores)
  process.env.TEST_TIMEOUT = '45000'
  process.env.CONNECTION_TIMEOUT = '10000'
  process.env.RESPONSE_TIMEOUT = '20000'
} else {
  // Configurações para desenvolvimento local
  process.env.TEST_TIMEOUT = '30000'
  process.env.CONNECTION_TIMEOUT = '5000'
  process.env.RESPONSE_TIMEOUT = '15000'
}

// Configurações de retry
process.env.TEST_RETRY_ATTEMPTS = process.env.TEST_RETRY_ATTEMPTS || '3'
process.env.TEST_RETRY_DELAY = process.env.TEST_RETRY_DELAY || '1000'

// Configurações de log
process.env.TEST_LOG_LEVEL = process.env.TEST_LOG_LEVEL || 'info'
process.env.TEST_VERBOSE = process.env.TEST_VERBOSE || 'false'

// Configurações específicas do print-server
process.env.PRINT_SERVER_HOST = process.env.PRINT_SERVER_HOST || 'localhost'
process.env.PRINT_SERVER_PORT = process.env.PRINT_SERVER_PORT || '3001'

// Configurações de mock (para quando o servidor não estiver disponível)
process.env.ENABLE_MOCK_MODE = process.env.ENABLE_MOCK_MODE || 'true'
process.env.MOCK_SUCCESS_RATE = process.env.MOCK_SUCCESS_RATE || '0.8' // 80% de sucesso

// Log das configurações carregadas
if (process.env.TEST_VERBOSE === 'true') {
  console.log('🔧 Configurações de ambiente para testes:')
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`   PRINT_SERVER_URL: ${process.env.PRINT_SERVER_URL}`)
  console.log(`   TEST_TIMEOUT: ${process.env.TEST_TIMEOUT}ms`)
  console.log(`   CONNECTION_TIMEOUT: ${process.env.CONNECTION_TIMEOUT}ms`)
  console.log(`   RESPONSE_TIMEOUT: ${process.env.RESPONSE_TIMEOUT}ms`)
  console.log(`   ENABLE_MOCK_MODE: ${process.env.ENABLE_MOCK_MODE}`)
}