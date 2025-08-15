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
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn()
      }))
    }
    mockSupabase.mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/products', () => {
    it('deve retornar lista de produtos ativos', async () => {
      try {
        const mockProducts = [
          {
            id: 1,
            name: 'Pizza Margherita',
            price: 25.90,
            active: true,
            category: { name: 'Pizzas' }
          },
          {
            id: 2,
            name: 'Pizza Pepperoni',
            price: 29.90,
            active: true,
            category: { name: 'Pizzas' }

      } catch (error) {
        console.error('Error in test "deve retornar lista de produtos ativos":', error)
        throw error
      }
            }
      ]

      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: mockProducts,
        error: null
      })

      const { req } = createMocks({
        method: 'GET'
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].name).toBe('Pizza Margherita')
    })

    it('deve retornar erro quando falha na consulta', async () => {
      try {
        mockSupabaseClient.from().select().eq().order.mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })

        const { req } = createMocks({
          method: 'GET'
        })

        const response = await GET(req)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Erro ao buscar produtos')
      })

      it('deve retornar array vazio quando não há produtos', async () => {
        mockSupabaseClient.from().select().eq().order.mockResolvedValue({
          data: [],
          error: null
        })

        const { req } = createMocks({
          method: 'GET'
        })

        const response = await GET(req)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toHaveLength(0)
      })
    })

    describe('POST /api/products', () => {
      it('deve criar um novo produto com dados válidos', async () => {
        const newProduct = {
          name: 'Pizza Calabresa',
          description: 'Pizza com calabresa e cebola',
          price: 27.90,
          category_id: 1,
          active: true

      } catch (error) {
        console.error('Error in test "deve retornar erro quando falha na consulta":', error)
        throw error
      }
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
        body: newProduct
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Pizza Calabresa')
      expect(data.data.id).toBe(3)
    })

    it('deve retornar erro com dados inválidos', async () => {
      try {
        const invalidProduct = {
          name: '', // Nome vazio
          price: -10 // Preço negativo

      } catch (error) {
        console.error('Error in test "deve retornar erro com dados inválidos":', error)
        throw error
      }
          }

      const { req } = createMocks({
        method: 'POST',
        body: invalidProduct
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Dados inválidos')
    })

    it('deve retornar erro quando falha na inserção', async () => {
      try {
        const newProduct = {
          name: 'Pizza Calabresa',
          description: 'Pizza com calabresa e cebola',
          price: 27.90,
          category_id: 1,
          active: true

      } catch (error) {
        console.error('Error in test "deve retornar erro quando falha na inserção":', error)
        throw error
      }
          }

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      })

      const { req } = createMocks({
        method: 'POST',
        body: newProduct
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Erro ao criar produto')
    })
  })
})