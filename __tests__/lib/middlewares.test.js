import {
  withValidation,
  withDatabaseErrorHandling,
  withPresetRateLimit,
  withPresetSanitization,
  withErrorMonitoring,
  withApiLogging
} from '@/lib/middlewares'
import { z } from 'zod'
import { createMocks } from 'node-mocks-http'

// Mock do console para capturar logs
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}
global.console = mockConsole

describe('Middlewares', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('withValidation', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      email: z.string().email('Email inválido'),
      age: z.number().min(18, 'Idade mínima é 18 anos')
    })

    const mockHandler = jest.fn(async (req, validatedData) => {
      return new Response(JSON.stringify({ success: true, data: validatedData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    })

    it('deve validar dados corretos e chamar o handler', async () => {
      const validData = {
        name: 'João Silva',
        email: 'joao@email.com',
        age: 25
      }

      const { req } = createMocks({
        method: 'POST',
        body: validData
      })

      const wrappedHandler = withValidation(testSchema)(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith(req, validData)
    })

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = {
        name: '', // Nome vazio
        email: 'email-inválido', // Email inválido
        age: 15 // Idade menor que 18
      }

      const { req } = createMocks({
        method: 'POST',
        body: invalidData
      })

      const wrappedHandler = withValidation(testSchema)(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Dados inválidos')
      expect(data.details).toBeDefined()
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('deve retornar erro 400 quando body está ausente', async () => {
      const { req } = createMocks({
        method: 'POST'
        // body ausente
      })

      const wrappedHandler = withValidation(testSchema)(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Dados inválidos')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('withDatabaseErrorHandling', () => {
    const mockHandler = jest.fn()
    const customMessages = {
      create: 'Erro ao criar registro',
      read: 'Erro ao buscar dados',
      update: 'Erro ao atualizar registro',
      delete: 'Erro ao deletar registro'
    }

    it('deve retornar resposta normal quando não há erro', async () => {
      const successResponse = new Response(JSON.stringify({ success: true }), {
        status: 200
      })
      mockHandler.mockResolvedValue(successResponse)

      const { req } = createMocks({ method: 'GET' })
      const wrappedHandler = withDatabaseErrorHandling(customMessages)(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('deve capturar e tratar erros do handler', async () => {
      const error = new Error('Database connection failed')
      mockHandler.mockRejectedValue(error)

      const { req } = createMocks({ method: 'POST' })
      const wrappedHandler = withDatabaseErrorHandling(customMessages)(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe(customMessages.create)
      expect(mockConsole.error).toHaveBeenCalledWith('Database error:', error)
    })

    it('deve usar mensagem padrão quando método não tem mensagem customizada', async () => {
      const error = new Error('Database error')
      mockHandler.mockRejectedValue(error)

      const { req } = createMocks({ method: 'PATCH' })
      const wrappedHandler = withDatabaseErrorHandling(customMessages)(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Erro interno do servidor')
    })
  })

  describe('withPresetSanitization', () => {
    const mockHandler = jest.fn(async (req) => {
      const body = await req.json()
      return new Response(JSON.stringify({ success: true, data: body }), {
        status: 200
      })
    })

    it('deve sanitizar strings removendo scripts maliciosos', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>João',
        description: 'Produto <img src=x onerror=alert(1)> especial'
      }

      const { req } = createMocks({
        method: 'POST',
        body: maliciousData
      })

      const wrappedHandler = withPresetSanitization()(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).not.toContain('<script>')
      expect(data.data.description).not.toContain('onerror')
    })

    it('deve preservar dados não-string', async () => {
      const mixedData = {
        name: 'João Silva',
        age: 25,
        active: true,
        tags: ['pizza', 'italiana'],
        metadata: {
          created: new Date().toISOString()
        }
      }

      const { req } = createMocks({
        method: 'POST',
        body: mixedData
      })

      const wrappedHandler = withPresetSanitization()(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.age).toBe(25)
      expect(data.data.active).toBe(true)
      expect(data.data.tags).toEqual(['pizza', 'italiana'])
      expect(typeof data.data.metadata).toBe('object')
    })
  })

  describe('withErrorMonitoring', () => {
    const mockHandler = jest.fn()

    it('deve registrar erros e re-lançá-los', async () => {
      const error = new Error('Test error')
      mockHandler.mockRejectedValue(error)

      const { req } = createMocks({ method: 'GET' })
      const wrappedHandler = withErrorMonitoring()(mockHandler)

      await expect(wrappedHandler(req)).rejects.toThrow('Test error')
      expect(mockConsole.error).toHaveBeenCalledWith('Error in API handler:', error)
    })

    it('deve passar resposta normal sem interferir', async () => {
      const successResponse = new Response(JSON.stringify({ success: true }), {
        status: 200
      })
      mockHandler.mockResolvedValue(successResponse)

      const { req } = createMocks({ method: 'GET' })
      const wrappedHandler = withErrorMonitoring()(mockHandler)
      const response = await wrappedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockConsole.error).not.toHaveBeenCalled()
    })
  })

  describe('withApiLogging', () => {
    const mockHandler = jest.fn(async () => {
      return new Response(JSON.stringify({ success: true }), {
        status: 200
      })
    })

    it('deve registrar informações da requisição e resposta', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/test',
        headers: {
          'user-agent': 'test-agent'
        }
      })

      const wrappedHandler = withApiLogging()(mockHandler)
      const response = await wrappedHandler(req)

      expect(response.status).toBe(200)
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('API Request: POST')
      )
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('API Response: 200')
      )
    })

    it('deve registrar tempo de execução', async () => {
      // Simular delay no handler
      mockHandler.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return new Response(JSON.stringify({ success: true }), {
          status: 200
        })
      })

      const { req } = createMocks({ method: 'GET' })
      const wrappedHandler = withApiLogging()(mockHandler)
      await wrappedHandler(req)

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('ms')
      )
    })
  })

  describe('Middleware Composition', () => {
    it('deve compor múltiplos middlewares corretamente', async () => {
      const schema = z.object({
        name: z.string().min(1)
      })

      const baseHandler = jest.fn(async (req, validatedData) => {
        return new Response(JSON.stringify({ success: true, data: validatedData }), {
          status: 200
        })
      })

      const composedHandler = withErrorMonitoring()(
        withApiLogging()(
          withPresetSanitization()(
            withValidation(schema)(
              withDatabaseErrorHandling({ create: 'Erro ao criar' })(baseHandler)
            )
          )
        )
      )

      const { req } = createMocks({
        method: 'POST',
        body: { name: 'Test <script>alert(1)</script>' }
      })

      const response = await composedHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).not.toContain('<script>')
      expect(baseHandler).toHaveBeenCalled()
      expect(mockConsole.log).toHaveBeenCalled() // API logging
    })
  })
})