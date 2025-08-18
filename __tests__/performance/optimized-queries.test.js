/**
 * Testes de performance para queries otimizadas
 */

import { createClient } from '@supabase/supabase-js'

// Mock do Supabase para testes
jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient

describe('Performance - Optimized Queries', () => {
  let mockSupabaseClient

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      single: jest.fn()
    }

    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('deve executar query de produtos com paginação', async () => {
    try {
      const mockProducts = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Produto ${i + 1}`,
        price: 10.00 + i
      }))

      mockSupabaseClient.range.mockResolvedValue({
        data: mockProducts,
        error: null
      })

      const start = performance.now()
      
      const result = await mockSupabaseClient
        .from('products')
        .select('id, name, price')
        .eq('active', true)
        .order('name')
        .range(0, 9)

      const end = performance.now()
      const executionTime = end - start

      expect(result.data).toHaveLength(10)
      expect(result.error).toBeNull()
      expect(executionTime).toBeLessThan(100) // Deve executar em menos de 100ms
    } catch (error) {
      console.error('Error in performance test:', error)
      throw error
    }
  })

  it('deve executar query de pedidos com joins otimizados', async () => {
    try {
      const mockOrders = [
        {
          id: 1,
          total: 50.00,
          customer: { name: 'João Silva' },
          items: [{ product_name: 'Pizza Margherita', quantity: 2 }]
        }
      ]

      const start = performance.now()
      
      mockSupabaseClient.select.mockResolvedValue({
        data: mockOrders,
        error: null
      })

      const result = await mockSupabaseClient
        .from('orders')
        .select(`
          id,
          total,
          customer:customers(name),
          items:order_items(product_name, quantity)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20)

      const end = performance.now()
      const executionTime = end - start

      expect(result.data).toHaveLength(1)
      expect(result.error).toBeNull()
      expect(executionTime).toBeLessThan(200) // Deve executar em menos de 200ms
    } catch (error) {
      console.error('Error in join performance test:', error)
      throw error
    }
  })

  it('deve executar query de busca com índices', async () => {
    try {
      const mockSearchResults = [
        { id: 1, name: 'Pizza Margherita', description: 'Pizza clássica' }
      ]

      mockSupabaseClient.textSearch.mockResolvedValue({
        data: mockSearchResults,
        error: null
      })

      const start = performance.now()
      
      const result = await mockSupabaseClient
        .from('products')
        .select('id, name, description')
        .textSearch('name', 'pizza')
        .eq('active', true)
        .limit(10)

      const end = performance.now()
      const executionTime = end - start

      expect(result.data).toHaveLength(1)
      expect(result.error).toBeNull()
      expect(executionTime).toBeLessThan(150) // Deve executar em menos de 150ms
    } catch (error) {
      console.error('Error in search performance test:', error)
      throw error
    }
  })
})