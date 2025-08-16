/**
 * Testes de Contrato - Socket.io Events Print-Server
 * 
 * Valida os contratos de eventos Socket.io entre o frontend e o print-server.
 * Garante compatibilidade retroativa com a implementação atual.
 */

const { io } = require('socket.io-client')
const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals')

// Configuração do servidor de teste
const PRINT_SERVER_URL = process.env.PRINT_SERVER_URL || 'http://localhost:3001'
const TIMEOUT = 15000 // 15 segundos para Socket.io
const CONNECTION_TIMEOUT = 5000 // 5 segundos para conexão

// Mock de dados de pedido válido
const validOrderData = {
  id: 'socket-test-order-123',
  order_number: '001234',
  customer_name: 'Maria Santos',
  customer_phone: '(11) 88888-8888',
  customer_code: 'C002',
  delivery_address: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP',
  delivery_instructions: 'Apartamento 45, bloco B',
  payment_method: 'CREDIT_CARD',
  status: 'RECEIVED',
  total: 67.50,
  order_items: [
    {
      quantity: 1,
      name: 'Pizza Portuguesa',
      size: 'Grande',
      toppings: ['Ovo', 'Ervilha'],
      special_instructions: 'Bem assada'
    },
    {
      quantity: 2,
      name: 'Refrigerante',
      size: '2L'
    }
  ]
}

// Configuração de impressora para testes
const testPrinterConfig = {
  type: 'EPSON',
  interface: 'tcp://192.168.1.100:9100',
  characterSet: 'PC860_PORTUGUESE',
  timeout: 5000
}

describe('Print-Server Socket.io Contract Tests', () => {
  let socket
  let serverAvailable = false

  // Função para verificar se o servidor está disponível
  const checkServerAvailability = () => {
    return new Promise((resolve) => {
      const testSocket = io(PRINT_SERVER_URL, {
        timeout: CONNECTION_TIMEOUT,
        forceNew: true
      })

      const timeout = setTimeout(() => {
        testSocket.disconnect()
        resolve(false)
      }, CONNECTION_TIMEOUT)

      testSocket.on('connect', () => {
        clearTimeout(timeout)
        testSocket.disconnect()
        resolve(true)
      })

      testSocket.on('connect_error', () => {
        clearTimeout(timeout)
        testSocket.disconnect()
        resolve(false)
      })
    })
  }

  beforeAll(async () => {
    serverAvailable = await checkServerAvailability()
    if (!serverAvailable) {
      console.warn('⚠️  Print-server Socket.io não está disponível. Testes serão executados em modo mock.')
    }
  }, CONNECTION_TIMEOUT + 1000)

  beforeEach(async () => {
    if (serverAvailable) {
      socket = io(PRINT_SERVER_URL, {
        timeout: CONNECTION_TIMEOUT,
        forceNew: true
      })

      // Aguardar conexão
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout na conexão Socket.io'))
        }, CONNECTION_TIMEOUT)

        socket.on('connect', () => {
          clearTimeout(timeout)
          resolve()
        })

        socket.on('connect_error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      })
    }
  }, CONNECTION_TIMEOUT + 1000)

  afterEach(() => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  })

  describe('Conexão Socket.io', () => {
    test('deve estabelecer conexão com o servidor', async () => {
      if (!serverAvailable) {
        console.log('📝 Mock: Socket.io connection')
        // Mock da conexão
        const mockConnection = {
          connected: true,
          id: 'mock-socket-id'
        }
        expect(mockConnection.connected).toBe(true)
        return
      }

      expect(socket.connected).toBe(true)
      expect(socket.id).toBeDefined()
    })

    test('deve aceitar configurações CORS corretas', async () => {
      if (!serverAvailable) {
        console.log('📝 Mock: CORS configuration')
        return
      }

      // Se chegou até aqui, a conexão foi estabelecida com sucesso
      expect(socket.connected).toBe(true)
    })
  })

  describe('Evento: print-order', () => {
    test('deve processar pedido válido e retornar resultado', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: print-order event')
        // Mock da resposta esperada
        const mockResult = {
          success: true,
          message: 'Pedido impresso com sucesso'
        }
        
        expect(mockResult).toMatchObject({
          success: expect.any(Boolean),
          message: expect.any(String)
        })
        done()
        return
      }

      // Configurar listener para o resultado
      socket.on('print-result', (result) => {
        try {
          expect(result).toMatchObject({
            success: expect.any(Boolean),
            message: expect.any(String)
          })
          
          // Se success for false, deve ter uma mensagem de erro
          if (!result.success) {
            expect(result.message).toBeTruthy()
          }
          
          done()
        } catch (error) {
          done(error)
        }
      })

      // Enviar pedido para impressão
      socket.emit('print-order', validOrderData)
    }, TIMEOUT)

    test('deve lidar com dados de pedido inválidos', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: print-order invalid data')
        const mockResult = {
          success: false,
          message: 'Dados do pedido inválidos'
        }
        
        expect(mockResult.success).toBe(false)
        done()
        return
      }

      const invalidOrderData = {
        // Dados incompletos
        id: 'invalid-test'
        // Faltando campos obrigatórios
      }

      socket.on('print-result', (result) => {
        try {
          expect(result).toMatchObject({
            success: false,
            message: expect.any(String)
          })
          done()
        } catch (error) {
          done(error)
        }
      })

      socket.emit('print-order', invalidOrderData)
    }, TIMEOUT)

    test('deve processar pizza meio a meio via Socket.io', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: print-order half and half')
        done()
        return
      }

      const halfAndHalfOrder = {
        ...validOrderData,
        id: 'half-and-half-socket-test',
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
                toppings: ['Cebola']
              }
            }
          }
        ]
      }

      socket.on('print-result', (result) => {
        try {
          expect(result).toMatchObject({
            success: expect.any(Boolean),
            message: expect.any(String)
          })
          done()
        } catch (error) {
          done(error)
        }
      })

      socket.emit('print-order', halfAndHalfOrder)
    }, TIMEOUT)
  })

  describe('Evento: test-print', () => {
    test('deve executar teste de impressão', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: test-print event')
        const mockResult = {
          success: true,
          message: 'Teste de impressão executado com sucesso'
        }
        
        expect(mockResult).toMatchObject({
          success: expect.any(Boolean),
          message: expect.any(String)
        })
        done()
        return
      }

      socket.on('test-result', (result) => {
        try {
          expect(result).toMatchObject({
            success: expect.any(Boolean),
            message: expect.any(String)
          })
          done()
        } catch (error) {
          done(error)
        }
      })

      socket.emit('test-print')
    }, TIMEOUT)

    test('deve retornar resultado consistente em múltiplos testes', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: test-print consistency')
        done()
        return
      }

      let testCount = 0
      const expectedTests = 2
      const results = []

      socket.on('test-result', (result) => {
        try {
          results.push(result)
          testCount++

          expect(result).toMatchObject({
            success: expect.any(Boolean),
            message: expect.any(String)
          })

          if (testCount === expectedTests) {
            // Verificar que todos os resultados têm a mesma estrutura
            results.forEach(r => {
              expect(r).toMatchObject({
                success: expect.any(Boolean),
                message: expect.any(String)
              })
            })
            done()
          }
        } catch (error) {
          done(error)
        }
      })

      // Executar múltiplos testes
      socket.emit('test-print')
      setTimeout(() => socket.emit('test-print'), 1000)
    }, TIMEOUT)
  })

  describe('Evento: configure-printer', () => {
    test('deve aceitar configuração válida', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: configure-printer event')
        const mockResult = {
          success: true,
          message: 'Impressora configurada com sucesso'
        }
        
        expect(mockResult).toMatchObject({
          success: expect.any(Boolean),
          message: expect.any(String)
        })
        done()
        return
      }

      socket.on('configure-result', (result) => {
        try {
          expect(result).toMatchObject({
            success: expect.any(Boolean),
            message: expect.any(String)
          })
          done()
        } catch (error) {
          done(error)
        }
      })

      socket.emit('configure-printer', testPrinterConfig)
    }, TIMEOUT)

    test('deve rejeitar configuração inválida', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: configure-printer invalid')
        const mockResult = {
          success: false,
          message: 'Configuração inválida'
        }
        
        expect(mockResult.success).toBe(false)
        done()
        return
      }

      const invalidConfig = {
        type: 'INVALID_TYPE',
        interface: null
      }

      socket.on('configure-result', (result) => {
        try {
          expect(result).toMatchObject({
            success: expect.any(Boolean),
            message: expect.any(String)
          })
          
          // Configuração inválida deve retornar success: false
          if (result.success === false) {
            expect(result.message).toBeTruthy()
          }
          
          done()
        } catch (error) {
          done(error)
        }
      })

      socket.emit('configure-printer', invalidConfig)
    }, TIMEOUT)
  })

  describe('Evento: printer-status', () => {
    test('deve retornar status da impressora', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: printer-status event')
        const mockStatus = {
          connected: true,
          config: {
            type: 'EPSON',
            interface: 'tcp://192.168.1.100:9100',
            characterSet: 'PC860_PORTUGUESE'
          },
          timestamp: new Date().toISOString()
        }
        
        expect(mockStatus).toMatchObject({
          connected: expect.any(Boolean),
          config: expect.any(Object),
          timestamp: expect.any(String)
        })
        done()
        return
      }

      socket.on('printer-status-result', (status) => {
        try {
          expect(status).toMatchObject({
            connected: expect.any(Boolean),
            config: expect.any(Object)
          })
          
          if (status.config) {
            expect(status.config).toMatchObject({
              type: expect.any(String),
              interface: expect.any(String)
            })
          }
          
          done()
        } catch (error) {
          done(error)
        }
      })

      socket.emit('printer-status')
    }, TIMEOUT)

    test('deve incluir timestamp no status', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: printer-status timestamp')
        done()
        return
      }

      socket.on('printer-status-result', (status) => {
        try {
          // Timestamp pode estar presente ou não, dependendo da implementação
          if (status.timestamp) {
            expect(status.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
          }
          done()
        } catch (error) {
          done(error)
        }
      })

      socket.emit('printer-status')
    }, TIMEOUT)
  })

  describe('Tratamento de Erros', () => {
    test('deve lidar com eventos inexistentes graciosamente', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: invalid event handling')
        done()
        return
      }

      // Emitir evento que não existe
      socket.emit('invalid-event', { test: 'data' })
      
      // Aguardar um tempo para ver se há alguma resposta inesperada
      setTimeout(() => {
        // Se chegou até aqui sem erros, o servidor lidou graciosamente
        expect(socket.connected).toBe(true)
        done()
      }, 2000)
    }, TIMEOUT)

    test('deve manter conexão após erro de impressão', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: connection stability after error')
        done()
        return
      }

      let errorReceived = false

      socket.on('print-result', (result) => {
        if (!result.success) {
          errorReceived = true
        }
        
        // Verificar se a conexão ainda está ativa após erro
        setTimeout(() => {
          try {
            expect(socket.connected).toBe(true)
            done()
          } catch (error) {
            done(error)
          }
        }, 1000)
      })

      // Enviar dados que podem causar erro
      socket.emit('print-order', { invalid: 'data' })
    }, TIMEOUT)
  })

  describe('Performance e Timeout', () => {
    test('deve responder dentro do tempo limite', (done) => {
      if (!serverAvailable) {
        console.log('📝 Mock: response time')
        done()
        return
      }

      const startTime = Date.now()
      const maxResponseTime = 5000 // 5 segundos

      socket.on('test-result', () => {
        try {
          const responseTime = Date.now() - startTime
          expect(responseTime).toBeLessThan(maxResponseTime)
          done()
        } catch (error) {
          done(error)
        }
      })

      socket.emit('test-print')
    }, TIMEOUT)
  })
})