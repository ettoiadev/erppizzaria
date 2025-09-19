import { NextRequest, NextResponse } from 'next/server'
import { appLogger } from '@/lib/logging'

// Interface para configuração de compressão
interface CompressionConfig {
  threshold: number // Tamanho mínimo em bytes para comprimir
  level: number // Nível de compressão (1-9)
  enableBrotli: boolean
  enableGzip: boolean
}

// Configuração padrão
const defaultConfig: CompressionConfig = {
  threshold: 1024, // 1KB
  level: 6, // Balanceamento entre velocidade e compressão
  enableBrotli: true,
  enableGzip: true
}

// Tipos de conteúdo que devem ser comprimidos
const COMPRESSIBLE_TYPES = [
  'application/json',
  'application/javascript',
  'text/html',
  'text/css',
  'text/plain',
  'text/xml',
  'application/xml',
  'image/svg+xml'
]

// Função para verificar se o conteúdo deve ser comprimido
function shouldCompress(contentType: string, contentLength: number, config: CompressionConfig): boolean {
  // Verificar tamanho mínimo
  if (contentLength < config.threshold) {
    return false
  }

  // Verificar tipo de conteúdo
  return COMPRESSIBLE_TYPES.some(type => contentType.includes(type))
}

// Função para obter encoding preferido do cliente
function getPreferredEncoding(acceptEncoding: string | null, config: CompressionConfig): string | null {
  if (!acceptEncoding) {
    return null
  }

  const encodings = acceptEncoding.toLowerCase()

  // Priorizar Brotli se disponível e habilitado
  if (config.enableBrotli && encodings.includes('br')) {
    return 'br'
  }

  // Fallback para Gzip se disponível e habilitado
  if (config.enableGzip && (encodings.includes('gzip') || encodings.includes('*'))) {
    return 'gzip'
  }

  return null
}

// Função para comprimir dados usando Gzip (Node.js built-in)
async function compressGzip(data: string): Promise<Buffer> {
  const { gzip } = await import('zlib')
  const { promisify } = await import('util')
  const gzipAsync = promisify(gzip)
  
  return gzipAsync(Buffer.from(data, 'utf8'))
}

// Função para comprimir dados usando Brotli (Node.js built-in)
async function compressBrotli(data: string): Promise<Buffer> {
  const { brotliCompress, constants } = await import('zlib')
  const { promisify } = await import('util')
  const brotliAsync = promisify(brotliCompress)
  
  const options = {
    [constants.BROTLI_PARAM_QUALITY]: 6, // Nível de compressão
    [constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(data, 'utf8')
  }
  
  return brotliAsync(Buffer.from(data, 'utf8'), options)
}

// Middleware principal de compressão
export function withCompression(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: Partial<CompressionConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config }

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Executar handler original
      const response = await handler(request)
      
      // Verificar se a resposta já está comprimida
      if (response.headers.get('content-encoding')) {
        return response
      }

      // Obter conteúdo da resposta
      const contentType = response.headers.get('content-type') || ''
      const responseText = await response.text()
      const contentLength = Buffer.byteLength(responseText, 'utf8')

      // Verificar se deve comprimir
      if (!shouldCompress(contentType, contentLength, finalConfig)) {
        // Retornar resposta original se não deve comprimir
        return new NextResponse(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })
      }

      // Obter encoding preferido
      const acceptEncoding = request.headers.get('accept-encoding')
      const preferredEncoding = getPreferredEncoding(acceptEncoding, finalConfig)

      if (!preferredEncoding) {
        // Cliente não suporta compressão
        return new NextResponse(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })
      }

      // Comprimir conteúdo
      let compressedData: Buffer
      let encoding: string

      if (preferredEncoding === 'br') {
        compressedData = await compressBrotli(responseText)
        encoding = 'br'
      } else {
        compressedData = await compressGzip(responseText)
        encoding = 'gzip'
      }

      // Calcular taxa de compressão
      const compressionRatio = ((contentLength - compressedData.length) / contentLength * 100).toFixed(1)
      
      appLogger.info('general', `Compressed response: ${contentLength} -> ${compressedData.length} bytes (${compressionRatio}% reduction) using ${encoding}`)

      // Criar nova resposta com conteúdo comprimido
      const newHeaders = new Headers(response.headers)
      newHeaders.set('content-encoding', encoding)
      newHeaders.set('content-length', compressedData.length.toString())
      newHeaders.set('vary', 'Accept-Encoding')

      return new NextResponse(new Uint8Array(compressedData), {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      })

    } catch (error) {
      appLogger.error('general', 'Erro na compressão', error instanceof Error ? error : new Error(String(error)))
      
      // Em caso de erro, retornar resposta original
      return handler(request)
    }
  }
}

// Middleware específico para APIs JSON
export function withJsonCompression(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withCompression(handler, {
    threshold: 512, // Comprimir JSONs menores
    level: 6,
    enableBrotli: true,
    enableGzip: true
  })
}

// Middleware para respostas grandes
export function withHeavyCompression(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withCompression(handler, {
    threshold: 2048, // 2KB
    level: 9, // Máxima compressão
    enableBrotli: true,
    enableGzip: true
  })
}

// Função utilitária para comprimir dados manualmente
export async function compressData(data: string, encoding: 'gzip' | 'br' = 'gzip'): Promise<Buffer> {
  if (encoding === 'br') {
    return compressBrotli(data)
  } else {
    return compressGzip(data)
  }
}

// Função para otimizar payloads JSON
export function optimizeJsonPayload(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  // Remover campos null/undefined
  const optimized = JSON.parse(JSON.stringify(data, (key, value) => {
    if (value === null || value === undefined) {
      return undefined
    }
    return value
  }))

  return optimized
}

// Middleware para otimização de JSON + compressão
export function withOptimizedJson(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)
    
    try {
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        const responseText = await response.text()
        const data = JSON.parse(responseText)
        
        // Otimizar payload
        const optimizedData = optimizeJsonPayload(data)
        const optimizedJson = JSON.stringify(optimizedData)
        
        // Criar nova resposta otimizada
        const newResponse = new NextResponse(optimizedJson, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })
        
        // Aplicar compressão
        return withJsonCompression(async () => newResponse)(request)
      }
      
      return response
    } catch (error) {
      appLogger.error('general', 'Erro na otimização de JSON', error instanceof Error ? error : new Error(String(error)))
      return response
    }
  }
}

// Estatísticas de compressão
interface CompressionStats {
  totalRequests: number
  compressedRequests: number
  totalBytesSaved: number
  averageCompressionRatio: number
}

let compressionStats: CompressionStats = {
  totalRequests: 0,
  compressedRequests: 0,
  totalBytesSaved: 0,
  averageCompressionRatio: 0
}

// Função para obter estatísticas
export function getCompressionStats(): CompressionStats {
  return { ...compressionStats }
}

// Função para resetar estatísticas
export function resetCompressionStats(): void {
  compressionStats = {
    totalRequests: 0,
    compressedRequests: 0,
    totalBytesSaved: 0,
    averageCompressionRatio: 0
  }
}