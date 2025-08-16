import '@testing-library/jest-dom'

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  }
}))

// Mock das variáveis de ambiente para testes
process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_KEY = 'test-key'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'

// Mock do Supabase client
jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    })),
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    }
  },
  getSupabaseServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    }))
  }))
}))

// Mock das funções de banco de dados
jest.mock('./lib/db-supabase', () => ({
  createAddress: jest.fn(),
  getAddressById: jest.fn(),
  updateAddress: jest.fn(),
  deleteAddress: jest.fn(),
  getAdminSettings: jest.fn(),
  updateAdminSetting: jest.fn(),
  saveCustomerAddress: jest.fn(),
  getUserByEmail: jest.fn(),
  updateOrderStatus: jest.fn(),
  updatePaymentStatus: jest.fn(),
  listOrders: jest.fn(),
  createOrder: jest.fn(),
  getOrderById: jest.fn(),
  archiveOrders: jest.fn()
}))

// Mock das funções de middleware
jest.mock('./lib/middlewares', () => ({
  withValidation: jest.fn((handler) => handler),
  withQueryValidation: jest.fn((handler) => handler),
  withParamsValidation: jest.fn((handler) => handler),
  withFullValidation: jest.fn((handler) => handler),
  withDatabaseErrorHandling: jest.fn((handler) => handler),
  withApiDatabaseErrorHandling: jest.fn((handler) => handler),
  withRateLimit: jest.fn((handler) => handler),
  withPresetRateLimit: jest.fn((handler) => handler),
  withUserRateLimit: jest.fn((handler) => handler),
  withAdaptiveRateLimit: jest.fn((handler) => handler),
  withSanitization: jest.fn((handler) => handler),
  withPresetSanitization: jest.fn((handler) => handler),
  withErrorMonitoring: jest.fn((handler) => handler),
  withApiLogging: jest.fn((handler) => handler),
  withErrorHandling: jest.fn((handler) => handler),
  withSensitiveLogging: jest.fn((handler) => handler),
  withDebugLogging: jest.fn((handler) => handler),
  withAuth: jest.fn((handler) => handler),
  withAdminAuth: jest.fn((handler) => handler),
  withManagerAuth: jest.fn((handler) => handler),
  withKitchenAuth: jest.fn((handler) => handler),
  withDeliveryAuth: jest.fn((handler) => handler)
}))

// Configuração global para testes
global.fetch = jest.fn()

// Mock global para Request e Response (Node.js 18+)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input?.url || ''
      this.method = init.method || 'GET'
      this.headers = new Map(Object.entries(init.headers || {}))
      this.body = init.body || null
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Map(Object.entries(init.headers || {}))
    }
    
    json() {
      return Promise.resolve(this.body)
    }
  }
}

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks()
})