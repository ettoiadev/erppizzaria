import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/orders/route'
import { getSupabaseServerClient } from '@/lib/supabase'

// Mock do Supabase
jest.mock('@/lib/supabase')
const mockSupabase = getSupabaseServerClient

describe('/api/orders', () => {
  let mockSupabaseClient

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn()
      }))
    }
    mockSupabase.mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/orders', () => {
    it('deve retornar lista de pedidos', async () => {
      const mockOrders = [
        {
          id: 1,
          user_id: 'user-123',
          status: 'pending',
          total: 45.80,
          created_at: '2024-01-15T10:00:00Z',
          order_items: [
            {
              id: 1,
              quantity: 2,
              price: 25.90,
              product: { name: 'Pizza Margherita' }
            }
          ]
        },
        {
          id: 2,
          user_id: 'user-456',
          status: 'completed',
          total: 32.90,
          created_at: '2024-01-15T09:30:00Z',
          order_items: [
            {
              id: 2,
              quantity: 1,
              price: 32.90,
              product: { name: 'Pizza Pepperoni' }
            }
          ]
        }
      ]

      mockSupabaseClient.from().select().order().limit().range.mockResolvedValue({
        data: mockOrders,
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        query: {
          limit: '10',
          offset: '0'
        }
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].id).toBe(1)
      expect(data.data[0].status).toBe('pending')
    })

    it('deve filtrar pedidos por status', async () => {
      const mockOrders = [
        {
          id: 1,
          user_id: 'user-123',
          status: 'pending',
          total: 45.80,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      mockSupabaseClient.from().select().eq().order().limit().range.mockResolvedValue({
        data: mockOrders,
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        query: {
          status: 'pending',
          limit: '10',
          offset: '0'
        }
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].status).toBe('pending')
    })

    it('deve filtrar pedidos por usuário', async () => {
      const mockOrders = [
        {
          id: 1,
          user_id: 'user-123',
          status: 'pending',
          total: 45.80,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      mockSupabaseClient.from().select().eq().order().limit().range.mockResolvedValue({
        data: mockOrders,
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        query: {
          userId: 'user-123',
          limit: '10',
          offset: '0'
        }
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].user_id).toBe('user-123')
    })
  })

  describe('POST /api/orders', () => {
    it('deve criar um novo pedido com dados válidos', async () => {
      const newOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 25.90
          },
          {
            productId: 2,
            quantity: 1,
            price: 29.90
          }
        ],
        total: 81.70,
        deliveryAddress: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          zipCode: '01234-567'
        },
        paymentMethod: 'credit_card'
      }

      const createdOrder = {
        id: 3,
        user_id: newOrder.userId,
        status: 'pending',
        total: newOrder.total,
        delivery_address: newOrder.deliveryAddress,
        payment_method: newOrder.paymentMethod,
        created_at: new Date().toISOString()
      }

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: createdOrder,
        error: null
      })

      const { req } = createMocks({
        method: 'POST',
        body: newOrder
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(3)
      expect(data.data.status).toBe('pending')
      expect(data.data.total).toBe(81.70)
    })

    it('deve retornar erro com dados inválidos', async () => {
      const invalidOrder = {
        userId: '', // User ID vazio
        items: [], // Array de itens vazio
        total: -10 // Total negativo
      }

      const { req } = createMocks({
        method: 'POST',
        body: invalidOrder
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Dados inválidos')
    })

    it('deve retornar erro quando total não confere', async () => {
      const orderWithWrongTotal = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 25.90
          }
        ],
        total: 100.00 // Total incorreto
      }

      const { req } = createMocks({
        method: 'POST',
        body: orderWithWrongTotal
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Total do pedido não confere')
    })

    it('deve retornar erro quando falha na inserção', async () => {
      const newOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 25.90
          }
        ],
        total: 51.80
      }

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      })

      const { req } = createMocks({
        method: 'POST',
        body: newOrder
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Erro ao criar pedido')
    })
  })
})