import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Mock global objects
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js Request and Response
global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body
  }

  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'))
  }

  text() {
    return Promise.resolve(this.body || '')
  }
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Map(Object.entries(init.headers || {}))
  }

  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'))
  }

  text() {
    return Promise.resolve(this.body || '')
  }

  static json(data, init = {}) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers
      }
    })
  }
}

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest extends global.Request {
    constructor(input, init = {}) {
      super(input, init)
      this.nextUrl = {
        pathname: new URL(this.url).pathname,
        searchParams: new URL(this.url).searchParams
      }
    }
  },
  NextResponse: class MockNextResponse extends global.Response {
    static json(data, init = {}) {
      return new MockNextResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers
        }
      })
    }

    static redirect(url, status = 302) {
      return new MockNextResponse('', {
        status,
        headers: {
          Location: url
        }
      })
    }
  }
}))

// Mock do Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      },
      isFallback: false,
      isLocaleDomain: true,
      isReady: true,
      defaultLocale: 'pt',
      domainLocales: [],
      isPreview: false
    }
  }
}))

// Mock do Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  }
}))

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  getSupabaseServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  })),
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}))

// Mock de variáveis de ambiente
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Configuração global para testes
global.fetch = jest.fn()

// Configuração para capturar promise rejections não tratadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Falhar o teste quando há promise rejection não tratada
  throw new Error(`Unhandled Promise Rejection: ${reason}`)
})

// Configuração para capturar exceções não tratadas
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  throw error
})

// Configuração global para timeouts de promises
jest.setTimeout(30000)

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks()
})