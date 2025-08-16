/**
 * Esquemas de Validação para Testes de Contrato
 * 
 * Define os esquemas de validação para todas as estruturas de dados
 * utilizadas na comunicação entre frontend e print-server.
 */

/**
 * Esquemas para validação de estruturas de dados
 */
const schemas = {
  // Esquema para dados de pedido
  orderData: {
    id: 'string',
    order_number: 'string',
    customer_name: 'string',
    customer_phone: 'string',
    payment_method: 'string',
    status: 'string',
    total: 'number',
    order_items: 'array'
  },
  
  // Esquema para item de pedido
  orderItem: {
    quantity: 'number',
    name: 'string',
    size: 'string'
  },
  
  // Esquema para item de pedido meio a meio
  halfAndHalfItem: {
    quantity: 'number',
    name: 'string',
    size: 'string',
    half_and_half: 'object'
  },
  
  // Esquema para configuração de impressora
  printerConfig: {
    type: 'string',
    interface: 'string',
    characterSet: 'string'
  },
  
  // Esquema para resultado de impressão
  printResult: {
    success: 'boolean',
    message: 'string'
  },
  
  // Esquema para status da impressora
  printerStatus: {
    connected: 'boolean',
    config: 'object'
  },
  
  // Esquema para resposta de status do servidor
  serverStatus: {
    status: 'string',
    timestamp: 'string',
    version: 'string'
  },
  
  // Esquema para resposta de teste
  testResult: {
    success: 'boolean',
    message: 'string'
  }
}

/**
 * Dados de exemplo válidos para testes
 */
const validExamples = {
  orderData: {
    id: 'test-order-123',
    order_number: '001234',
    customer_name: 'João Silva',
    customer_phone: '(11) 99999-9999',
    customer_code: 'C001',
    delivery_address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
    delivery_instructions: 'Portão azul, casa dos fundos',
    payment_method: 'CREDIT_CARD',
    status: 'RECEIVED',
    total: 89.90,
    order_items: [
      {
        quantity: 2,
        name: 'Pizza Margherita',
        size: 'Grande',
        toppings: ['Queijo extra', 'Manjericão'],
        special_instructions: 'Massa fina'
      },
      {
        quantity: 1,
        name: 'Refrigerante Coca-Cola',
        size: '2L'
      }
    ]
  },
  
  halfAndHalfOrder: {
    id: 'test-half-order-456',
    order_number: '001235',
    customer_name: 'Maria Santos',
    customer_phone: '(11) 88888-8888',
    payment_method: 'PIX',
    status: 'RECEIVED',
    total: 67.50,
    order_items: [
      {
        quantity: 1,
        name: 'Pizza Meio a Meio',
        size: 'Grande',
        half_and_half: {
          firstHalf: {
            productName: 'Margherita',
            toppings: ['Queijo extra']
          },
          secondHalf: {
            productName: 'Calabresa',
            toppings: ['Cebola', 'Azeitona']
          }
        },
        special_instructions: 'Bem assada'
      }
    ]
  },
  
  printerConfig: {
    type: 'EPSON',
    interface: 'tcp://192.168.1.100:9100',
    characterSet: 'PC860_PORTUGUESE',
    timeout: 5000,
    width: 48
  },
  
  bematechConfig: {
    type: 'BEMATECH',
    interface: 'tcp://192.168.1.101:9100',
    characterSet: 'PC860_PORTUGUESE',
    timeout: 3000,
    width: 48
  }
}

/**
 * Dados de exemplo inválidos para testes
 */
const invalidExamples = {
  orderData: {
    // Faltando campos obrigatórios
    incomplete: {
      id: 'incomplete-order'
      // Faltando outros campos obrigatórios
    },
    
    // Tipos incorretos
    wrongTypes: {
      id: 123, // Deveria ser string
      order_number: null,
      customer_name: '',
      total: 'invalid', // Deveria ser number
      order_items: 'not-array' // Deveria ser array
    },
    
    // Valores inválidos
    invalidValues: {
      id: '',
      order_number: '',
      customer_name: '',
      customer_phone: 'invalid-phone',
      payment_method: 'INVALID_METHOD',
      total: -10, // Valor negativo
      order_items: []
    }
  },
  
  printerConfig: {
    // Configuração incompleta
    incomplete: {
      type: 'EPSON'
      // Faltando interface
    },
    
    // Tipos incorretos
    wrongTypes: {
      type: 123,
      interface: null,
      characterSet: true
    },
    
    // Valores inválidos
    invalidValues: {
      type: 'INVALID_TYPE',
      interface: 'invalid-interface',
      characterSet: 'INVALID_CHARSET'
    }
  }
}

/**
 * Função para validar estrutura de dados
 * @param {Object} data - Dados para validar
 * @param {Object} schema - Esquema de validação
 * @param {string} path - Caminho atual (para mensagens de erro)
 * @returns {Object} Resultado da validação
 */
function validateSchema(data, schema, path = '') {
  const errors = []
  const warnings = []
  
  // Verificar se data é um objeto
  if (typeof data !== 'object' || data === null) {
    errors.push(`${path || 'root'}: Esperado objeto, recebido ${typeof data}`)
    return { valid: false, errors, warnings }
  }
  
  // Verificar campos obrigatórios
  for (const [field, expectedType] of Object.entries(schema)) {
    const currentPath = path ? `${path}.${field}` : field
    
    if (!(field in data)) {
      errors.push(`${currentPath}: Campo obrigatório não encontrado`)
      continue
    }
    
    const value = data[field]
    const actualType = Array.isArray(value) ? 'array' : typeof value
    
    if (expectedType !== actualType) {
      errors.push(`${currentPath}: Esperado ${expectedType}, recebido ${actualType}`)
    }
    
    // Validações específicas
    if (expectedType === 'string' && value === '') {
      warnings.push(`${currentPath}: String vazia`)
    }
    
    if (expectedType === 'number' && (isNaN(value) || !isFinite(value))) {
      errors.push(`${currentPath}: Número inválido`)
    }
    
    if (expectedType === 'array' && value.length === 0) {
      warnings.push(`${currentPath}: Array vazio`)
    }
  }
  
  // Verificar campos extras (não definidos no schema)
  for (const field of Object.keys(data)) {
    if (!(field in schema)) {
      warnings.push(`${path ? `${path}.${field}` : field}: Campo não definido no schema`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Função para validar dados de pedido
 * @param {Object} orderData - Dados do pedido
 * @returns {Object} Resultado da validação
 */
function validateOrderData(orderData) {
  const result = validateSchema(orderData, schemas.orderData)
  
  // Validações específicas para pedidos
  if (orderData.order_items && Array.isArray(orderData.order_items)) {
    orderData.order_items.forEach((item, index) => {
      const itemResult = validateSchema(item, schemas.orderItem, `order_items[${index}]`)
      result.errors.push(...itemResult.errors)
      result.warnings.push(...itemResult.warnings)
      
      // Validar meio a meio se presente
      if (item.half_and_half) {
        if (!item.half_and_half.firstHalf || !item.half_and_half.secondHalf) {
          result.errors.push(`order_items[${index}].half_and_half: Deve conter firstHalf e secondHalf`)
        }
      }
    })
  }
  
  // Validar total
  if (typeof orderData.total === 'number' && orderData.total < 0) {
    result.errors.push('total: Valor não pode ser negativo')
  }
  
  result.valid = result.errors.length === 0
  return result
}

/**
 * Função para validar configuração de impressora
 * @param {Object} config - Configuração da impressora
 * @returns {Object} Resultado da validação
 */
function validatePrinterConfig(config) {
  const result = validateSchema(config, schemas.printerConfig)
  
  // Validações específicas
  if (config.type && !['EPSON', 'BEMATECH', 'STAR'].includes(config.type)) {
    result.warnings.push('type: Tipo de impressora não reconhecido')
  }
  
  if (config.interface && !config.interface.match(/^(tcp:\/\/|usb:\/\/|serial:\/\/)/)) {
    result.warnings.push('interface: Formato de interface não reconhecido')
  }
  
  result.valid = result.errors.length === 0
  return result
}

/**
 * Função para gerar dados de teste válidos
 * @param {string} type - Tipo de dados (orderData, printerConfig, etc.)
 * @param {Object} overrides - Campos para sobrescrever
 * @returns {Object} Dados de teste
 */
function generateTestData(type, overrides = {}) {
  if (!validExamples[type]) {
    throw new Error(`Tipo de dados não reconhecido: ${type}`)
  }
  
  return {
    ...JSON.parse(JSON.stringify(validExamples[type])), // Deep clone
    ...overrides
  }
}

/**
 * Função para gerar dados de teste inválidos
 * @param {string} type - Tipo de dados
 * @param {string} variant - Variante de dados inválidos
 * @returns {Object} Dados de teste inválidos
 */
function generateInvalidTestData(type, variant = 'incomplete') {
  if (!invalidExamples[type] || !invalidExamples[type][variant]) {
    throw new Error(`Dados inválidos não encontrados: ${type}.${variant}`)
  }
  
  return JSON.parse(JSON.stringify(invalidExamples[type][variant]))
}

module.exports = {
  schemas,
  validExamples,
  invalidExamples,
  validateSchema,
  validateOrderData,
  validatePrinterConfig,
  generateTestData,
  generateInvalidTestData
}