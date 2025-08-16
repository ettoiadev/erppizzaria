/**
 * Jest Configuration
 * 
 * Configuração para executar todos os testes do projeto, incluindo
 * testes unitários, de integração, performance e API.
 */

module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Padrões de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.ts'
  ],
  
  // Configuração de cobertura
  collectCoverage: false,
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'components/**/*.{js,ts,tsx}',
    'app/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**'
  ],
  
  // Diretório de saída da cobertura
  coverageDirectory: 'coverage',
  
  // Configuração de relatórios
  reporters: [
    'default'
  ],
  
  // Configuração de verbose para debug
  verbose: true,
  
  // Configuração de módulos
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  
  // Configuração de transformação para TypeScript e ES modules
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ]
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ]
    }]
  },
  
  // Configuração de mock
  clearMocks: true,
  restoreMocks: true,
  
  // Configuração de bail (parar na primeira falha)
  bail: false,
  
  // Configuração de detecção de handles abertos
  detectOpenHandles: true,
  forceExit: true,
  
  // Configuração de path mapping (similar ao tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Configuração para transformar node_modules específicos
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|other-esm-package)/)'
  ],
  
  // Ignorar arquivos específicos
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/backup-cleanup/'
  ],
  
  // Configuração de setup para diferentes tipos de teste
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.test.{js,ts,tsx}'],
      testPathIgnorePatterns: [
        '<rootDir>/__tests__/integration/',
        '<rootDir>/__tests__/performance/',
        '<rootDir>/__tests__/api/'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript'
          ]
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }]
          ]
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@supabase|other-esm-package)/)'
      ]
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.{js,ts}'],
      testTimeout: 60000,
      transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript'
          ]
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }]
          ]
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@supabase|other-esm-package)/)'
      ]
    },
    {
      displayName: 'performance',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/performance/**/*.test.{js,ts}'],
      testTimeout: 120000,
      transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript'
          ]
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }]
          ]
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@supabase|other-esm-package)/)'
      ]
    },
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/api/**/*.test.{js,ts}'],
      testTimeout: 30000,
      transform: {
        '^.+\\.(ts|tsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }],
            '@babel/preset-typescript'
          ]
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
          presets: [
            ['@babel/preset-env', { targets: { node: 'current' } }]
          ]
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@supabase|other-esm-package)/)'
      ]
    }
  ]
}