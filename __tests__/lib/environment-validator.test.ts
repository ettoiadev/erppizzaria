import { validateEnvironment, validateAndLogEnvironment, isProduction, isDevelopment, getBaseUrl } from '@/lib/environment-validator'

describe('Environment Validator', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('validateEnvironment', () => {
    it('should return valid result when all required vars are set', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_KEY = 'test-key'
      process.env.JWT_SECRET = 'test-jwt-secret-with-32-characters'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com'
      process.env.NODE_ENV = 'test'

      const result = validateEnvironment()

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.config.SUPABASE_URL).toBe('https://test.supabase.co')
    })

    it('should return errors when required vars are missing', () => {
      delete process.env.SUPABASE_URL
      delete process.env.JWT_SECRET

      const result = validateEnvironment()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Variável obrigatória SUPABASE_URL não configurada')
      expect(result.errors).toContain('Variável obrigatória JWT_SECRET não configurada')
    })

    it('should validate SUPABASE_URL format', () => {
      process.env.SUPABASE_URL = 'invalid-url'
      process.env.SUPABASE_KEY = 'test-key'
      process.env.JWT_SECRET = 'test-jwt-secret-with-32-characters'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com'
      process.env.NODE_ENV = 'test'

      const result = validateEnvironment()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('SUPABASE_URL deve começar com http:// ou https://')
    })

    it('should warn about short JWT_SECRET', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co'
      process.env.SUPABASE_KEY = 'test-key'
      process.env.JWT_SECRET = 'short'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com'
      process.env.NODE_ENV = 'test'

      const result = validateEnvironment()

      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('JWT_SECRET deve ter pelo menos 32 caracteres para maior segurança')
    })

    it('should validate production environment', () => {
      process.env.SUPABASE_URL = 'http://localhost:54321'
      process.env.SUPABASE_KEY = 'test-key'
      process.env.JWT_SECRET = 'william-disk-pizza-dev-temp-key-2024'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://test.com'
      process.env.NODE_ENV = 'production'

      const result = validateEnvironment()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('JWT_SECRET temporário não deve ser usado em produção')
      expect(result.errors).toContain('SUPABASE_URL não deve apontar para localhost em produção')
    })
  })

  describe('utility functions', () => {
    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production'
      expect(isProduction()).toBe(true)
      expect(isDevelopment()).toBe(false)
    })

    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development'
      expect(isProduction()).toBe(false)
      expect(isDevelopment()).toBe(true)
    })

    it('should return correct base URL', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      expect(getBaseUrl()).toBe('https://example.com')

      delete process.env.NEXT_PUBLIC_SITE_URL
      expect(getBaseUrl()).toBe('http://localhost:3000')
    })
  })
})