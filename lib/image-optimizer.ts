import { NextRequest } from 'next/server'
import { appLogger } from '@/lib/logging'

// Interface para configuração de otimização
interface ImageOptimizationConfig {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'webp' | 'jpeg' | 'png' | 'auto'
  enableProgressive: boolean
  stripMetadata: boolean
  maxFileSize: number // em bytes
}

// Interface para resultado da otimização
interface OptimizationResult {
  buffer: Buffer
  format: string
  width: number
  height: number
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  processingTime: number
}

// Configurações padrão para diferentes tipos de imagem
const IMAGE_CONFIGS = {
  thumbnail: {
    maxWidth: 150,
    maxHeight: 150,
    quality: 80,
    format: 'webp' as const,
    enableProgressive: false,
    stripMetadata: true,
    maxFileSize: 50 * 1024 // 50KB
  },
  product: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 85,
    format: 'webp' as const,
    enableProgressive: true,
    stripMetadata: true,
    maxFileSize: 500 * 1024 // 500KB
  },
  banner: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 90,
    format: 'webp' as const,
    enableProgressive: true,
    stripMetadata: true,
    maxFileSize: 1024 * 1024 // 1MB
  },
  avatar: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 85,
    format: 'webp' as const,
    enableProgressive: false,
    stripMetadata: true,
    maxFileSize: 100 * 1024 // 100KB
  }
}

// Tipos MIME suportados
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]

// Classe principal para otimização de imagens
class ImageOptimizer {
  private sharp: any = null

  constructor() {
    this.initializeSharp()
  }

  // Inicializar Sharp (biblioteca de processamento de imagens)
  private async initializeSharp() {
    try {
      // Tentar importar Sharp dinamicamente
      this.sharp = await import('sharp')
      appLogger.info('general', 'Sharp inicializado com sucesso')
    } catch (error) {
      appLogger.warn('general', 'Sharp não disponível, usando fallback básico')
      this.sharp = null
    }
  }

  // Verificar se o tipo de arquivo é suportado
  public isSupportedFormat(mimeType: string): boolean {
    return SUPPORTED_MIME_TYPES.includes(mimeType.toLowerCase())
  }

  // Obter configuração baseada no tipo de imagem
  public getConfig(type: keyof typeof IMAGE_CONFIGS): ImageOptimizationConfig {
    return { ...IMAGE_CONFIGS[type] }
  }

  // Otimizar imagem usando Sharp
  private async optimizeWithSharp(
    buffer: Buffer,
    config: ImageOptimizationConfig
  ): Promise<OptimizationResult> {
    const startTime = Date.now()
    
    try {
      const sharp = this.sharp.default || this.sharp
      let image = sharp(buffer)
      
      // Obter metadados da imagem original
      const metadata = await image.metadata()
      const originalSize = buffer.length
      
      // Redimensionar se necessário
      if (metadata.width! > config.maxWidth || metadata.height! > config.maxHeight) {
        image = image.resize(config.maxWidth, config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
      
      // Remover metadados se configurado
      if (config.stripMetadata) {
        image = image.removeAlpha()
      }
      
      // Configurar formato e qualidade
      switch (config.format) {
        case 'webp':
          image = image.webp({ 
            quality: config.quality,
            progressive: config.enableProgressive
          })
          break
        case 'jpeg':
          image = image.jpeg({ 
            quality: config.quality,
            progressive: config.enableProgressive
          })
          break
        case 'png':
          image = image.png({ 
            quality: config.quality,
            progressive: config.enableProgressive
          })
          break
        case 'auto':
          // Escolher melhor formato baseado no conteúdo
          if (metadata.hasAlpha) {
            image = image.png({ quality: config.quality })
          } else {
            image = image.webp({ quality: config.quality })
          }
          break
      }
      
      // Processar imagem
      const optimizedBuffer = await image.toBuffer()
      const finalMetadata = await sharp(optimizedBuffer).metadata()
      
      const processingTime = Date.now() - startTime
      const compressionRatio = ((originalSize - optimizedBuffer.length) / originalSize) * 100
      
      return {
        buffer: optimizedBuffer,
        format: finalMetadata.format || config.format,
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
        originalSize,
        optimizedSize: optimizedBuffer.length,
        compressionRatio,
        processingTime
      }
    } catch (error) {
      appLogger.error('general', 'Erro na otimização com Sharp', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Fallback básico sem Sharp (apenas validação e redimensionamento básico)
  private async optimizeBasic(
    buffer: Buffer,
    config: ImageOptimizationConfig
  ): Promise<OptimizationResult> {
    const startTime = Date.now()
    
    // Sem Sharp, retornar buffer original com informações básicas
    const processingTime = Date.now() - startTime
    
    return {
      buffer,
      format: 'unknown',
      width: 0,
      height: 0,
      originalSize: buffer.length,
      optimizedSize: buffer.length,
      compressionRatio: 0,
      processingTime
    }
  }

  // Método principal de otimização
  public async optimize(
    buffer: Buffer,
    type: keyof typeof IMAGE_CONFIGS = 'product',
    customConfig?: Partial<ImageOptimizationConfig>
  ): Promise<OptimizationResult> {
    const config = { ...this.getConfig(type), ...customConfig }
    
    // Verificar tamanho do arquivo
    if (buffer.length > config.maxFileSize * 2) { // Permitir 2x o tamanho máximo para processamento
      throw new Error(`Arquivo muito grande: ${buffer.length} bytes (máximo: ${config.maxFileSize * 2} bytes)`)
    }
    
    try {
      if (this.sharp) {
        return await this.optimizeWithSharp(buffer, config)
      } else {
        return await this.optimizeBasic(buffer, config)
      }
    } catch (error) {
      appLogger.error('general', 'Erro na otimização de imagem', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Otimizar múltiplas variações de uma imagem
  public async optimizeMultiple(
    buffer: Buffer,
    types: (keyof typeof IMAGE_CONFIGS)[]
  ): Promise<Record<string, OptimizationResult>> {
    const results: Record<string, OptimizationResult> = {}
    
    for (const type of types) {
      try {
        results[type] = await this.optimize(buffer, type)
        appLogger.info('general', `Otimização ${type} concluída`, {
          originalSize: results[type].originalSize,
          optimizedSize: results[type].optimizedSize,
          compressionRatio: results[type].compressionRatio
        })
      } catch (error) {
        appLogger.error('general', `Erro na otimização ${type}`, error instanceof Error ? error : new Error(String(error)))
        // Continuar com outras otimizações mesmo se uma falhar
      }
    }
    
    return results
  }

  // Validar imagem
  public async validateImage(buffer: Buffer): Promise<{
    isValid: boolean
    mimeType?: string
    width?: number
    height?: number
    size: number
    errors: string[]
  }> {
    const errors: string[] = []
    let isValid = true
    let mimeType: string | undefined
    let width: number | undefined
    let height: number | undefined
    
    try {
      if (this.sharp) {
        const sharp = this.sharp.default || this.sharp
        const metadata = await sharp(buffer).metadata()
        
        mimeType = `image/${metadata.format}`
        width = metadata.width
        height = metadata.height
        
        if (!this.isSupportedFormat(mimeType)) {
          errors.push(`Formato não suportado: ${mimeType}`)
          isValid = false
        }
        
        if (!width || !height) {
          errors.push('Não foi possível determinar dimensões da imagem')
          isValid = false
        }
        
        if (width && width > 4000) {
          errors.push(`Largura muito grande: ${width}px (máximo: 4000px)`)
          isValid = false
        }
        
        if (height && height > 4000) {
          errors.push(`Altura muito grande: ${height}px (máximo: 4000px)`)
          isValid = false
        }
      } else {
        // Validação básica sem Sharp
        if (buffer.length === 0) {
          errors.push('Arquivo vazio')
          isValid = false
        }
        
        if (buffer.length > 10 * 1024 * 1024) { // 10MB
          errors.push('Arquivo muito grande (máximo: 10MB)')
          isValid = false
        }
      }
    } catch (error) {
      errors.push('Erro ao processar imagem')
      isValid = false
    }
    
    return {
      isValid,
      mimeType,
      width,
      height,
      size: buffer.length,
      errors
    }
  }

  // Gerar thumbnail
  public async generateThumbnail(buffer: Buffer, size: number = 150): Promise<OptimizationResult> {
    return this.optimize(buffer, 'thumbnail', {
      maxWidth: size,
      maxHeight: size,
      quality: 80
    })
  }

  // Converter formato
  public async convertFormat(
    buffer: Buffer,
    targetFormat: 'webp' | 'jpeg' | 'png',
    quality: number = 85
  ): Promise<OptimizationResult> {
    return this.optimize(buffer, 'product', {
      format: targetFormat,
      quality
    })
  }
}

// Instância global do otimizador
const globalOptimizer = new ImageOptimizer()

// Middleware para otimização automática de uploads
export function withImageOptimization(
  handler: (request: NextRequest) => Promise<Response>,
  type: keyof typeof IMAGE_CONFIGS = 'product'
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      // Verificar se é upload de imagem
      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('multipart/form-data')) {
        // Processar FormData para otimizar imagens
        const formData = await request.formData()
        const optimizedFormData = new FormData()
        
        for (const [key, value] of formData.entries()) {
          if (value instanceof File && globalOptimizer.isSupportedFormat(value.type)) {
            try {
              const buffer = Buffer.from(await value.arrayBuffer())
              const result = await globalOptimizer.optimize(buffer, type)
              
              const optimizedFile = new File(
                [new Uint8Array(result.buffer)],
                value.name,
                { type: `image/${result.format}` }
              )
              
              optimizedFormData.append(key, optimizedFile)
              
              appLogger.info('general', `Imagem otimizada: ${value.name}`, {
                originalSize: result.originalSize,
                optimizedSize: result.optimizedSize,
                compressionRatio: result.compressionRatio
              })
            } catch (error) {
              appLogger.error('general', 'Erro na otimização automática', error instanceof Error ? error : new Error(String(error)))
              // Em caso de erro, usar arquivo original
              optimizedFormData.append(key, value)
            }
          } else {
            optimizedFormData.append(key, value)
          }
        }
        
        // Criar nova request com FormData otimizado
        const newRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: optimizedFormData
        })
        
        return handler(newRequest)
      }
      
      return handler(request)
    } catch (error) {
      appLogger.error('general', 'Erro no middleware de otimização', error instanceof Error ? error : new Error(String(error)))
      return handler(request)
    }
  }
}

// Exportar funções utilitárias
export { globalOptimizer as imageOptimizer, IMAGE_CONFIGS }

export async function optimizeImage(
  buffer: Buffer,
  type: keyof typeof IMAGE_CONFIGS = 'product',
  customConfig?: Partial<ImageOptimizationConfig>
): Promise<OptimizationResult> {
  return globalOptimizer.optimize(buffer, type, customConfig)
}

export async function validateImage(buffer: Buffer) {
  return globalOptimizer.validateImage(buffer)
}

export async function generateThumbnail(buffer: Buffer, size: number = 150): Promise<OptimizationResult> {
  return globalOptimizer.generateThumbnail(buffer, size)
}

export async function convertImageFormat(
  buffer: Buffer,
  targetFormat: 'webp' | 'jpeg' | 'png',
  quality: number = 85
): Promise<OptimizationResult> {
  return globalOptimizer.convertFormat(buffer, targetFormat, quality)
}