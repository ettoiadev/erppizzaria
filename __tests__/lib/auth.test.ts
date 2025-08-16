import { hashPassword, comparePasswords, generateToken, verifyToken, authenticateUser } from '@/lib/auth'
import * as dbSupabase from '@/lib/db-supabase'

// Mock do módulo db-supabase
jest.mock('@/lib/db-supabase')
const mockDbSupabase = dbSupabase as jest.Mocked<typeof dbSupabase>

describe('Auth Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })
  })

  describe('comparePasswords', () => {
    it('should compare passwords correctly', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await comparePasswords(password, hash)
      const isInvalid = await comparePasswords('wrongpassword', hash)
      
      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'customer' as const
      }
      
      const token = generateToken(user)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'customer' as const
      }
      
      const token = generateToken(user)
      const decoded = await verifyToken(token)
      
      expect(decoded).toBeDefined()
      expect(decoded.id).toBe(user.id)
      expect(decoded.email).toBe(user.email)
      expect(decoded.role).toBe(user.role)
    })

    it('should return null for invalid token', async () => {
      const decoded = await verifyToken('invalid.token.here')
      expect(decoded).toBeNull()
    })
  })

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const email = 'test@example.com'
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      const mockUser = {
        id: '123',
        email,
        full_name: 'Test User',
        role: 'customer' as const,
        password_hash: hashedPassword
      }
      
      mockDbSupabase.getUserByEmail.mockResolvedValue(mockUser)
      
      const result = await authenticateUser(email, password)
      
      expect(result).toBeDefined()
      expect(result?.user.email).toBe(email)
      expect(result?.accessToken).toBeDefined()
      expect(result?.refreshToken).toBeDefined()
      expect(result?.expiresIn).toBe(15 * 60) // 15 minutes
    })

    it('should return null for non-existent user', async () => {
      mockDbSupabase.getUserByEmail.mockResolvedValue(null)
      
      const result = await authenticateUser('nonexistent@example.com', 'password')
      
      expect(result).toBeNull()
    })

    it('should return null for incorrect password', async () => {
      const email = 'test@example.com'
      const correctPassword = 'correctpassword'
      const wrongPassword = 'wrongpassword'
      const hashedPassword = await hashPassword(correctPassword)
      
      const mockUser = {
        id: '123',
        email,
        full_name: 'Test User',
        role: 'customer' as const,
        password_hash: hashedPassword
      }
      
      mockDbSupabase.getUserByEmail.mockResolvedValue(mockUser)
      
      const result = await authenticateUser(email, wrongPassword)
      
      expect(result).toBeNull()
    })
  })
})