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

      mockCreateClient.mockReturnValue(mockClient)

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

    it('deve lançar erro se variáveis de ambiente não estiverem definidas', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      expect(() => {
        getSupabaseServerClient()
      }).toThrow('Supabase environment variables are not defined')
    })
  })

  describe('Database Operations', () => {
    let mockClient
    let mockFrom
    let mockSelect
    let mockInsert
    let mockUpdate
    let mockDelete

    beforeEach(() => {
      mockSelect = jest.fn()
      mockInsert = jest.fn()
      mockUpdate = jest.fn()
      mockDelete = jest.fn()
      
      mockFrom = jest.fn().mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete
      })

      mockClient = {
        from: mockFrom,
        auth: {
          getUser: jest.fn(),
          signInWithPassword: jest.fn(),
          signUp: jest.fn(),
          signOut: jest.fn()
        }
      }

      mockCreateClient.mockReturnValue(mockClient)
    })

    it('deve executar query SELECT com sucesso', async () => {
      try {
        const mockData = [{ id: 1, name: 'Test Product' }]
        mockSelect.mockResolvedValue({ data: mockData, error: null })

        const client = getSupabaseServerClient()
        const result = await client.from('products').select('*')

        expect(mockFrom).toHaveBeenCalledWith('products')
        expect(mockSelect).toHaveBeenCalledWith('*')
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
      } catch (error) {
        console.error('Error in test "deve executar query SELECT com sucesso":', error)
        throw error
      }
    })

    it('deve executar query INSERT com sucesso', async () => {
      try {
        const newProduct = { name: 'New Product', price: 10.99 }
        const mockData = [{ id: 1, ...newProduct }]
        mockInsert.mockResolvedValue({ data: mockData, error: null })

        const client = getSupabaseServerClient()
        const result = await client.from('products').insert(newProduct)

        expect(mockFrom).toHaveBeenCalledWith('products')
        expect(mockInsert).toHaveBeenCalledWith(newProduct)
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
      } catch (error) {
        console.error('Error in test "deve executar query INSERT com sucesso":', error)
        throw error
      }
    })

    it('deve executar query UPDATE com sucesso', async () => {
      try {
        const updateData = { name: 'Updated Product' }
        const mockData = [{ id: 1, ...updateData }]
        
        const mockEq = jest.fn().mockResolvedValue({ data: mockData, error: null })
        mockUpdate.mockReturnValue({ eq: mockEq })

        const client = getSupabaseServerClient()
        const result = await client.from('products').update(updateData).eq('id', 1)

        expect(mockFrom).toHaveBeenCalledWith('products')
        expect(mockUpdate).toHaveBeenCalledWith(updateData)
        expect(mockEq).toHaveBeenCalledWith('id', 1)
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
      } catch (error) {
        console.error('Error in test "deve executar query UPDATE com sucesso":', error)
        throw error
      }
    })

    it('deve executar query DELETE com sucesso', async () => {
      try {
        const mockData = [{ id: 1 }]
        
        const mockEq = jest.fn().mockResolvedValue({ data: mockData, error: null })
        mockDelete.mockReturnValue({ eq: mockEq })

        const client = getSupabaseServerClient()
        const result = await client.from('products').delete().eq('id', 1)

        expect(mockFrom).toHaveBeenCalledWith('products')
        expect(mockDelete).toHaveBeenCalled()
        expect(mockEq).toHaveBeenCalledWith('id', 1)
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
      } catch (error) {
        console.error('Error in test "deve executar query DELETE com sucesso":', error)
        throw error
      }
    })

    it('deve executar queries com filtros complexos', async () => {
      try {
        const mockData = [{ id: 1, name: 'Filtered Product', price: 15.99 }]
        
        const mockGte = jest.fn().mockReturnValue({
          lt: jest.fn().mockReturnValue({
            ilike: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
        
        mockSelect.mockReturnValue({
          gte: mockGte
        })

        const client = getSupabaseServerClient()
        const result = await client
          .from('products')
          .select('*')
          .gte('price', 10)
          .lt('price', 20)
          .ilike('name', '%product%')

        expect(mockFrom).toHaveBeenCalledWith('products')
        expect(mockSelect).toHaveBeenCalledWith('*')
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
      } catch (error) {
        console.error('Error in test "deve executar queries com filtros complexos":', error)
        throw error
      }
    })

    describe('Authentication Operations', () => {
      beforeEach(() => {
        // Reutilizar o mockClient já configurado no beforeEach principal
        // que já tem os métodos de auth configurados
      })

      it('deve autenticar usuário com email e senha', async () => {
        try {
          const mockUser = {
            id: '123',
            email: 'test@example.com',
            user_metadata: {
              name: 'Test User'
            }
          }

          mockClient.auth.signInWithPassword.mockResolvedValue({
            data: { user: mockUser },
            error: null
          })

          const client = getSupabaseServerClient()
          const result = await client.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'password123'
          })

          expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123'
          })
          expect(result.data.user).toEqual(mockUser)
          expect(result.error).toBeNull()
        } catch (error) {
          console.error('Error in test "deve autenticar usuário com email e senha":', error)
          throw error
        }
      })

      it('deve registrar novo usuário', async () => {
        try {
          const mockUser = {
            id: '456',
            email: 'newuser@example.com',
            user_metadata: {
              name: 'New User'
            }
          }

          mockClient.auth.signUp.mockResolvedValue({
            data: { user: mockUser },
            error: null
          })

          const client = getSupabaseServerClient()
          const result = await client.auth.signUp({
            email: 'newuser@example.com',
            password: 'password123',
            options: {
              data: {
                name: 'New User'
              }
            }
          })

          expect(mockClient.auth.signUp).toHaveBeenCalledWith({
            email: 'newuser@example.com',
            password: 'password123',
            options: {
              data: {
                name: 'New User'
              }
            }
          })
          expect(result.data.user).toEqual(mockUser)
          expect(result.error).toBeNull()
        } catch (error) {
          console.error('Error in test "deve registrar novo usuário":', error)
          throw error
        }
      })

      it('deve fazer logout do usuário', async () => {
        try {
          mockClient.auth.signOut.mockResolvedValue({
            error: null
          })

          const client = getSupabaseServerClient()
          const result = await client.auth.signOut()

          expect(mockClient.auth.signOut).toHaveBeenCalled()
          expect(result.error).toBeNull()
        } catch (error) {
          console.error('Error in test "deve fazer logout do usuário":', error)
          throw error
        }
      })

      it('deve obter usuário atual', async () => {
        try {
          const mockUser = {
            id: '789',
            email: 'current@example.com',
            user_metadata: {
              name: 'Current User'
            }
          }

          mockClient.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null
          })

          const client = getSupabaseServerClient()
          const result = await client.auth.getUser()

          expect(mockClient.auth.getUser).toHaveBeenCalled()
          expect(result.data.user).toEqual(mockUser)
          expect(result.error).toBeNull()
        } catch (error) {
          console.error('Error in test "deve obter usuário atual":', error)
          throw error
        }
      })
    })

    describe('Error Handling', () => {
      it('deve tratar erros de conexão', async () => {
        try {
          const mockError = { message: 'Connection failed', code: 'CONNECTION_ERROR' }
          mockSelect.mockResolvedValue({ data: null, error: mockError })

          const client = getSupabaseServerClient()
          const result = await client.from('products').select('*')

          expect(result.data).toBeNull()
          expect(result.error).toEqual(mockError)
        } catch (error) {
          console.error('Error in test "deve tratar erros de conexão":', error)
          throw error
        }
      })

      it('deve tratar erros de autenticação', async () => {
        try {
          const mockError = { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
          mockClient.auth.signInWithPassword.mockResolvedValue({
            data: { user: null },
            error: mockError
          })

          const client = getSupabaseServerClient()
          const result = await client.auth.signInWithPassword({
            email: 'invalid@example.com',
            password: 'wrongpassword'
          })

          expect(result.data.user).toBeNull()
          expect(result.error).toEqual(mockError)
        } catch (error) {
          console.error('Error in test "deve tratar erros de autenticação":', error)
          throw error
        }
      })
    })
  })
})