import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/products/route'
import { getSupabaseServerClient } from '@/lib/supabase'

// Mock do Supabase
jest.mock('@/lib/supabase')
const mockSupabase = getSupabaseServerClient

describe('/api/products', () => {
  let mockSupabaseClient

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn()
    }

    mockSupabase.mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/products', () => {
    it('deve retornar lista de produtos', async () => {
      try {
        const mockProducts = [
          {
            id: 1,
            name: 'Pizza Margherita',
            description: 'Pizza com molho de tomate, mussarela e manjericão',
            price: 29.90,
            category: 'pizza',
            available: true
          },
          {
            id: 2,
            name: 'Pizza Calabresa',
            description: 'Pizza com calabresa e cebola',
            price: 27.90,
            category: 'pizza',
            available: true
          }
        ]

        mockSupabaseClient.select.mockResolvedValue({
          data: mockProducts,
          error: null
        })

        const { req } = createMocks({
          method: 'GET',
          url: '/api/products'
        })

        const response = await GET(req)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toHaveLength(2)
        expect(data.data[0].name).toBe('Pizza Margherita')
      } catch (error) {
        console.error('Error in test "deve retornar lista de produtos":', error)
        throw error
      }
    })

    it('deve retornar erro quando falha na consulta', async () => {
      try {
        mockSupabaseClient.select.mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })

        const { req } = createMocks({
          method: 'GET',
          url: '/api/products'
        })

        const response = await GET(req)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Erro ao buscar produtos')
      } catch (error) {
        console.error('Error in test "deve retornar erro quando falha na consulta":', error)
        throw error
      }
    })
  })

  describe('POST /api/products', () => {
    it('deve criar um novo produto', async () => {
      try {
        const newProduct = {
          name: 'Pizza Margherita',
          description: 'Pizza com molho de tomate, mussarela e manjericão',
          price: 29.90,
          category: 'pizza',
          available: true
        }

        const createdProduct = {
          id: 3,
          ...newProduct,
          created_at: new Date().toISOString()
        }

        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: createdProduct,
          error: null
        })

        const { req } = createMocks({
          method: 'POST',
          url: '/api/products',
          body: newProduct
        })

        const response = await POST(req)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(data.data.name).toBe('Pizza Margherita')
        expect(data.data.id).toBe(3)
      } catch (error) {
        console.error('Error in test "deve criar um novo produto":', error)
        throw error
      }
    })

    it('deve retornar erro com dados inválidos', async () => {
      try {
        const invalidProduct = {
          name: '', // Nome vazio
          price: -10 // Preço negativo
        }

        const { req } = createMocks({
          method: 'POST',
          url: '/api/products',
          body: invalidProduct
        })

        const response = await POST(req)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Dados inválidos')
      } catch (error) {
        console.error('Error in test "deve retornar erro com dados inválidos":', error)
        throw error
      }
    })

    it('deve retornar erro quando falha na inserção', async () => {
      try {
        const newProduct = {
          name: 'Pizza Calabresa',
          description: 'Pizza com calabresa e cebola',
          price: 27.90,
          category_id: 1,
          active: true
        }

        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' }
        })

        const { req } = createMocks({
          method: 'POST',
          url: '/api/products',
          body: newProduct
        })

        const response = await POST(req)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Erro ao criar produto')
      } catch (error) {
        console.error('Error in test "deve retornar erro quando falha na inserção":', error)
        throw error
      }
    })
  })
})