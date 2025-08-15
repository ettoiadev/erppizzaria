import { createMocks } from 'node-mocks-http'
import { GET, POST, DELETE } from '@/app/api/favorites/route'
import { getSupabaseServerClient } from '@/lib/supabase'

// Mock do Supabase
jest.mock('@/lib/supabase')
const mockSupabase = getSupabaseServerClient

describe('/api/favorites', () => {
  let mockSupabaseClient

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        and: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn()
      }))
    }
    mockSupabase.mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/favorites', () => {
    it('deve retornar lista de favoritos do usuário', async () => {
      try {
        const mockFavorites = [
          {
            id: 1,
            user_id: 'user-123',
            product_id: 1,
            product: {
              id: 1,
              name: 'Pizza Margherita',
              price: 25.90,
              active: true,
              category: {
                name: 'Pizzas'
              }
            }
          },
        {
          id: 2,
          user_id: 'user-123',
          product_id: 2,
          product: {
            id: 2,
            name: 'Pizza Pepperoni',
            price: 29.90,
            active: true,
            category: {
              name: 'Pizzas'
            }
          }
        }
      ]

      mockSupabaseClient.from().select().eq.mockResolvedValue({
        data: mockFavorites,
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        query: {
          userId: 'user-123'
        }
      })

        const response = await GET(req)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toHaveLength(2)
        expect(data.data[0].product.name).toBe('Pizza Margherita')
        expect(data.data[1].product.name).toBe('Pizza Pepperoni')
      } catch (error) {
        console.error('Error in test "deve retornar lista de favoritos do usuário":', error)
        throw error
      }
    })

    it('deve filtrar produtos inativos dos favoritos', async () => {
      try {
        const mockFavorites = [
          {
            id: 1,
            user_id: 'user-123',
            product_id: 1,
            product: {
              id: 1,
              name: 'Pizza Margherita',
              price: 25.90,
              active: true,
              category: {
                name: 'Pizzas'

      } catch (error) {
        console.error('Error in test "deve filtrar produtos inativos dos favoritos":', error)
        throw error
      }
                }
          }
        },
        {
          id: 2,
          user_id: 'user-123',
          product_id: 2,
          product: {
            id: 2,
            name: 'Pizza Descontinuada',
            price: 29.90,
            active: false,
            category: {
              name: 'Pizzas'
            }
          }
        }
      ]

      mockSupabaseClient.from().select().eq.mockResolvedValue({
        data: mockFavorites,
        error: null
      })

      const { req } = createMocks({
        method: 'GET',
        query: {
          userId: 'user-123'
        }
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].product.name).toBe('Pizza Margherita')
    })

    it('deve retornar erro quando userId não é fornecido', async () => {
      try {
        const { req } = createMocks({
          method: 'GET',
          query: {}
        })

        const response = await GET(req)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('userId é obrigatório')
      })
    })

    describe('POST /api/favorites', () => {
      it('deve adicionar produto aos favoritos', async () => {
        const favoriteData = {
          userId: 'user-123',
          productId: 1

      } catch (error) {
        console.error('Error in test "deve retornar erro quando userId não é fornecido":', error)
        throw error
      }
          }

      // Mock para verificar se o produto existe e está ativo
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 1,
          name: 'Pizza Margherita',
          active: true
        },
        error: null
      })

      // Mock para verificar se já não está nos favoritos
      mockSupabaseClient.from().select().eq().and().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      })

      // Mock para inserir o favorito
      const createdFavorite = {
        id: 1,
        user_id: 'user-123',
        product_id: 1,
        created_at: new Date().toISOString()
      }

      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: createdFavorite,
        error: null
      })

      const { req } = createMocks({
        method: 'POST',
        body: favoriteData
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user_id).toBe('user-123')
      expect(data.data.product_id).toBe(1)
    })

    it('deve retornar erro quando produto não existe', async () => {
      try {
        const favoriteData = {
          userId: 'user-123',
          productId: 999

      } catch (error) {
        console.error('Error in test "deve retornar erro quando produto não existe":', error)
        throw error
      }
          }

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Product not found' }
      })

      const { req } = createMocks({
        method: 'POST',
        body: favoriteData
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Produto não encontrado')
    })

    it('deve retornar erro quando produto está inativo', async () => {
      try {
        const favoriteData = {
          userId: 'user-123',
          productId: 1

      } catch (error) {
        console.error('Error in test "deve retornar erro quando produto está inativo":', error)
        throw error
      }
          }

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 1,
          name: 'Pizza Descontinuada',
          active: false
        },
        error: null
      })

      const { req } = createMocks({
        method: 'POST',
        body: favoriteData
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Produto não está disponível')
    })

    it('deve retornar erro quando produto já está nos favoritos', async () => {
      try {
        const favoriteData = {
          userId: 'user-123',
          productId: 1

      } catch (error) {
        console.error('Error in test "deve retornar erro quando produto já está nos favoritos":', error)
        throw error
      }
          }

      // Mock para verificar se o produto existe e está ativo
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 1,
          name: 'Pizza Margherita',
          active: true
        },
        error: null
      })

      // Mock para verificar se já está nos favoritos
      mockSupabaseClient.from().select().eq().and().maybeSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          user_id: 'user-123',
          product_id: 1
        },
        error: null
      })

      const { req } = createMocks({
        method: 'POST',
        body: favoriteData
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Produto já está nos favoritos')
    })
  })

  describe('DELETE /api/favorites', () => {
    it('deve remover produto dos favoritos', async () => {
      try {
        mockSupabaseClient.from().delete().eq().and.mockResolvedValue({
          data: null,
          error: null
        })

        const { req } = createMocks({
          method: 'DELETE',
          query: {
            userId: 'user-123',
            productId: '1'

      } catch (error) {
        console.error('Error in test "deve remover produto dos favoritos":', error)
        throw error
      }
            }
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Produto removido dos favoritos')
    })

    it('deve retornar erro quando parâmetros não são fornecidos', async () => {
      try {
        const { req } = createMocks({
          method: 'DELETE',
          query: {
            userId: 'user-123'
            // productId ausente

      } catch (error) {
        console.error('Error in test "deve retornar erro quando parâmetros não são fornecidos":', error)
        throw error
      }
            }
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('userId e productId são obrigatórios')
    })

    it('deve retornar erro quando falha na remoção', async () => {
      try {
        mockSupabaseClient.from().delete().eq().and.mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' }
        })

        const { req } = createMocks({
          method: 'DELETE',
          query: {
            userId: 'user-123',
            productId: '1'

      } catch (error) {
        console.error('Error in test "deve retornar erro quando falha na remoção":', error)
        throw error
      }
            }
      })

      const response = await DELETE(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Erro ao remover favorito')
    })
  })
})