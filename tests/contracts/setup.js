/**
 * Setup para Testes de Contrato
 * 
 * Configurações globais e utilitários para os testes de contrato da API do print-server.
 */

// Configuração de timeout global para Jest
jest.setTimeout(30000)

// Configuração de console para testes
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

// Suprimir warnings específicos durante os testes
console.warn = (...args) => {
  const message = args.join(' ')
  
  // Suprimir warnings conhecidos do Socket.io durante testes
  if (
    message.includes('socket.io') ||
    message.includes('xhr poll error') ||
    message.includes('websocket error')
  ) {
    return
  }
  
  originalConsoleWarn.apply(console, args)
}

// Manter erros importantes mas filtrar ruído
console.error = (...args) => {
  const message = args.join(' ')
  
  // Suprimir erros de conexão esperados durante testes
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('connect_error') ||
    message.includes('timeout')
  ) {
    return
  }
  
  originalConsoleError.apply(console, args)
}

// Configuração global para testes
global.testConfig = {
  printServerUrl: process.env.PRINT_SERVER_URL || 'http://localhost:3001',
  timeout: {
    connection: 5000,
    response: 15000,
    test: 30000
  },
  retry: {
    attempts: 3,
    delay: 1000
  }
}

// Utilitários globais para testes
global.testUtils = {
  /**
   * Aguarda um tempo específico
   * @param {number} ms - Milissegundos para aguardar
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Retry de função com backoff
   * @param {Function} fn - Função para executar
   * @param {number} attempts - Número de tentativas
   * @param {number} delay - Delay entre tentativas
   */
  retry: async (fn, attempts = 3, delay = 1000) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === attempts - 1) throw error
        await global.testUtils.sleep(delay * (i + 1))
      }
    }
  },
  
  /**
   * Valida estrutura de resposta da API
   * @param {Object} response - Resposta para validar
   * @param {Object} expectedStructure - Estrutura esperada
   */
  validateResponseStructure: (response, expectedStructure) => {
    const validate = (obj, structure, path = '') => {
      for (const [key, expectedType] of Object.entries(structure)) {
        const currentPath = path ? `${path}.${key}` : key
        
        if (!(key in obj)) {
          throw new Error(`Campo obrigatório '${currentPath}' não encontrado`)
        }
        
        const value = obj[key]
        const actualType = typeof value
        
        if (expectedType === 'array' && !Array.isArray(value)) {
          throw new Error(`Campo '${currentPath}' deveria ser array, mas é ${actualType}`)
        } else if (expectedType !== 'array' && actualType !== expectedType) {
          throw new Error(`Campo '${currentPath}' deveria ser ${expectedType}, mas é ${actualType}`)
        }
      }
    }
    
    validate(response, expectedStructure)
  },
  
  /**
   * Gera dados de teste válidos
   */
  generateTestData: {
    order: () => ({
      id: `test-order-${Date.now()}`,
      order_number: `${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
      customer_name: 'Cliente Teste',
      customer_phone: '(11) 99999-9999',
      customer_code: 'TEST001',
      delivery_address: 'Endereço de Teste, 123',
      payment_method: 'CREDIT_CARD',
      status: 'RECEIVED',
      total: 45.90,
      order_items: [
        {
          quantity: 1,
          name: 'Pizza Teste',
          size: 'Média',
          toppings: ['Queijo', 'Tomate']
        }
      ]
    }),
    
    printerConfig: () => ({
      type: 'EPSON',
      interface: 'tcp://192.168.1.100:9100',
      characterSet: 'PC860_PORTUGUESE',
      timeout: 5000
    })
  }
}

// Configuração de cleanup após cada teste
afterEach(() => {
  // Limpar timers pendentes
  jest.clearAllTimers()
})

// Configuração de cleanup após todos os testes
afterAll(() => {
  // Restaurar console original
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})

// Log de início dos testes
console.log('🧪 Configuração de testes de contrato carregada')
console.log(`📡 Print Server URL: ${global.testConfig.printServerUrl}`)