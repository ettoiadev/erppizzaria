import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from '@/lib/supabase'

// Mock do Supabase
jest.mock('@supabase/supabase-js')
const mockCreateClient = createClient

// Mock das variáveis de ambiente
const originalEnv = process.env

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getSupabaseServerClient', () => {
    it('deve criar cliente com service role key', () => {
      const mockClient = {
        from: jest.fn(),
        auth: {
          getUser: jest.fn(),
          signInWithPassword: jest.fn(),
          signUp: jest.fn(),
          signOut: jest.fn()
        }
      }

      mockCreateClient.mockReturnValue(mockClient as any)

      const client = getSupabaseServerClient()

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-role-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      expect(client).toBe(mockClient)
    })

    it('deve lançar erro quando variáveis de ambiente estão ausentes', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      expect(() => {
        getSupabaseServerClient()
      }).toThrow('Missing Supabase environment variables')
    })

    it('deve reutilizar instância existente (singleton)', () => {
      const mockClient = {
        from: jest.fn(),
        auth: {
          getUser: jest.fn()
        }
      }

      mockCreateClient.mockReturnValue(mockClient as any)

      const client1 = getSupabaseServerClient()
      const client2 = getSupabaseServerClient()

      expect(client1).toBe(client2)
      expect(mockCreateClient).toHaveBeenCalledTimes(1)
    })
  })

  describe('Database Operations', () => {
    let mockClient
    let mockTable

    beforeEach(() => {
      mockTable = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
        maybeSingle: jest.fn()
      }

      mockClient = {
        from: jest.fn(() => mockTable),
        auth: {
          getUser: jest.fn(),
          signInWithPassword: jest.fn(),
          signUp: jest.fn(),
          signOut: jest.fn()
        }
      }

      mockCreateClient.mockReturnValue(mockClient as any)
    })

    it('deve executar query SELECT com sucesso', async () => {
      const mockData = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' }
      ]

      mockTable.select().eq().order.mockResolvedValue({
        data: mockData,
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name')

      expect(client.from).toHaveBeenCalledWith('products')
      expect(mockTable.select).toHaveBeenCalledWith('*')
      expect(mockTable.eq).toHaveBeenCalledWith('active', true)
      expect(mockTable.order).toHaveBeenCalledWith('name')
      expect(result.data).toEqual(mockData)
      expect(result.error).toBeNull()
    })

    it('deve executar query INSERT com sucesso', async () => {
      const newProduct = {
        name: 'New Product',
        price: 29.90,
        active: true
      }

      const createdProduct = {
        id: 3,
        ...newProduct,
        created_at: new Date().toISOString()
      }

      mockTable.insert().select().single.mockResolvedValue({
        data: createdProduct,
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client
        .from('products')
        .insert(newProduct)
        .select()
        .single()

      expect(mockTable.insert).toHaveBeenCalledWith(newProduct)
      expect(mockTable.select).toHaveBeenCalled()
      expect(mockTable.single).toHaveBeenCalled()
      expect(result.data).toEqual(createdProduct)
      expect(result.error).toBeNull()
    })

    it('deve executar query UPDATE com sucesso', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 35.90
      }

      const updatedProduct = {
        id: 1,
        ...updateData,
        active: true,
        updated_at: new Date().toISOString()
      }

      mockTable.update().eq().select().single.mockResolvedValue({
        data: updatedProduct,
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client
        .from('products')
        .update(updateData)
        .eq('id', 1)
        .select()
        .single()

      expect(mockTable.update).toHaveBeenCalledWith(updateData)
      expect(mockTable.eq).toHaveBeenCalledWith('id', 1)
      expect(mockTable.select).toHaveBeenCalled()
      expect(mockTable.single).toHaveBeenCalled()
      expect(result.data).toEqual(updatedProduct)
      expect(result.error).toBeNull()
    })

    it('deve executar query DELETE com sucesso', async () => {
      mockTable.delete().eq.mockResolvedValue({
        data: null,
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client
        .from('products')
        .delete()
        .eq('id', 1)

      expect(mockTable.delete).toHaveBeenCalled()
      expect(mockTable.eq).toHaveBeenCalledWith('id', 1)
      expect(result.error).toBeNull()
    })

    it('deve tratar erros de banco de dados', async () => {
      const dbError = {
        message: 'Database connection failed',
        code: '08006'
      }

      mockTable.select.mockResolvedValue({
        data: null,
        error: dbError
      })

      const client = getSupabaseServerClient()
      const result = await client
        .from('products')
        .select('*')

      expect(result.data).toBeNull()
      expect(result.error).toEqual(dbError)
    })

    it('deve executar queries com filtros complexos', async () => {
      const mockData = [
        { id: 1, name: 'Product 1', price: 25.90, created_at: '2024-01-15' }
      ]

      mockTable.select().gte().lte().eq().order().limit.mockResolvedValue({
        data: mockData,
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client
        .from('products')
        .select('*')
        .gte('price', 20.00)
        .lte('price', 30.00)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(10)

      expect(mockTable.gte).toHaveBeenCalledWith('price', 20.00)
      expect(mockTable.lte).toHaveBeenCalledWith('price', 30.00)
      expect(mockTable.eq).toHaveBeenCalledWith('active', true)
      expect(mockTable.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockTable.limit).toHaveBeenCalledWith(10)
      expect(result.data).toEqual(mockData)
    })
  })

  describe('Authentication Operations', () => {
    let mockClient

    beforeEach(() => {
      mockClient = {
        from: jest.fn(),
        auth: {
          getUser: jest.fn(),
          signInWithPassword: jest.fn(),
          signUp: jest.fn(),
          signOut: jest.fn()
        }
      }

      mockCreateClient.mockReturnValue(mockClient as any)
    })

    it('deve autenticar usuário com email e senha', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {
          name: 'Test User'
        }
      }

      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token'
          }
        },
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'password123'
      })

      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123'
      })
      expect(result.data.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('deve registrar novo usuário', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123'
      }

      const mockUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        email_confirmed_at: null
      }

      mockClient.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null
        },
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client.auth.signUp(newUser)

      expect(mockClient.auth.signUp).toHaveBeenCalledWith(newUser)
      expect(result.data.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('deve obter usuário atual', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com'
      }

      mockClient.auth.getUser.mockResolvedValue({
        data: {
          user: mockUser
        },
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client.auth.getUser()

      expect(mockClient.auth.getUser).toHaveBeenCalled()
      expect(result.data.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('deve fazer logout do usuário', async () => {
      mockClient.auth.signOut.mockResolvedValue({
        error: null
      })

      const client = getSupabaseServerClient()
      const result = await client.auth.signOut()

      expect(mockClient.auth.signOut).toHaveBeenCalled()
      expect(result.error).toBeNull()
    })

    it('deve tratar erros de autenticação', async () => {
      const authError = {
        message: 'Invalid credentials',
        status: 400
      }

      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: null,
          session: null
        },
        error: authError
      })

      const client = getSupabaseServerClient()
      const result = await client.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      })

      expect(result.data.user).toBeNull()
      expect(result.error).toEqual(authError)
    })
  })
})