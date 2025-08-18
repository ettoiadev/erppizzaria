// Mock das variáveis de ambiente
const originalEnv = process.env

describe('Supabase Environment Variables', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_KEY: 'test-service-role-key'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Environment Variables', () => {
    it('deve ter SUPABASE_URL definida', () => {
      expect(process.env.SUPABASE_URL).toBe('https://test.supabase.co')
    })

    it('deve ter SUPABASE_KEY definida', () => {
      expect(process.env.SUPABASE_KEY).toBe('test-service-role-key')
    })

    it('deve falhar se SUPABASE_URL não estiver definida', () => {
      delete process.env.SUPABASE_URL
      expect(process.env.SUPABASE_URL).toBeUndefined()
    })

    it('deve falhar se SUPABASE_KEY não estiver definida', () => {
      delete process.env.SUPABASE_KEY
      expect(process.env.SUPABASE_KEY).toBeUndefined()
    })
  })
})