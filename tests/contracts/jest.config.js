/**
 * Configuração Jest para Testes de Contrato
 * 
 * Configuração específica para executar os testes de contrato da API do print-server.
 */

module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Padrão de arquivos de teste
  testMatch: [
    '**/tests/contracts/**/*.test.js'
  ],
  
  // Timeout global para testes (importante para Socket.io)
  testTimeout: 30000,
  
  // Configuração de setup
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  
  // Configuração de cobertura
  collectCoverage: false,
  
  // Configuração de relatórios
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'contract-tests.xml'
    }]
  ],
  
  // Configuração de verbose para debug
  verbose: true,
  
  // Configuração de módulos
  moduleFileExtensions: ['js', 'json'],
  
  // Configuração de transformação
  transform: {},
  
  // Configuração de mock
  clearMocks: true,
  restoreMocks: true,
  
  // Configuração removida: retry não é uma opção válida do Jest
  
  // Configuração de bail (parar na primeira falha)
  bail: false,
  
  // Configuração de detecção de handles abertos
  detectOpenHandles: true,
  forceExit: true,
  
  // Configuração de variáveis de ambiente
  setupFiles: ['<rootDir>/env.js']
}