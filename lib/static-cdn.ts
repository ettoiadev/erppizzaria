/**
 * CDN Local para Assets Estáticos
 * Fase 3 - Otimizações Avançadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

interface AssetInfo {
  path: string;
  size: number;
  mimeType: string;
  etag: string;
  lastModified: Date;
  compressed?: {
    gzip?: Buffer;
    brotli?: Buffer;
  };
}

class StaticCDN {
  private assetCache = new Map<string, AssetInfo>();
  private publicDir: string;
  private maxAge = 31536000; // 1 ano em segundos
  private compressionEnabled = true;

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public');
    logger.info('CDN Local inicializado', { publicDir: this.publicDir });
  }

  /**
   * Servir asset estático com otimizações
   */
  async serveAsset(request: NextRequest, assetPath: string): Promise<NextResponse> {
    try {
      // Normalizar caminho do asset
      const normalizedPath = this.normalizePath(assetPath);
      const fullPath = path.join(this.publicDir, normalizedPath);
      
      // Verificar se arquivo existe e está dentro do diretório público
      if (!this.isValidPath(fullPath)) {
        return new NextResponse('Not Found', { status: 404 });
      }

      // Obter informações do asset (com cache)
      const assetInfo = await this.getAssetInfo(fullPath, normalizedPath);
      if (!assetInfo) {
        return new NextResponse('Not Found', { status: 404 });
      }

      // Verificar cache do cliente (ETag)
      const clientETag = request.headers.get('if-none-match');
      if (clientETag === assetInfo.etag) {
        return new NextResponse(null, { 
          status: 304,
          headers: this.getCacheHeaders(assetInfo)
        });
      }

      // Verificar cache do cliente (Last-Modified)
      const ifModifiedSince = request.headers.get('if-modified-since');
      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        if (clientDate >= assetInfo.lastModified) {
          return new NextResponse(null, { 
            status: 304,
            headers: this.getCacheHeaders(assetInfo)
          });
        }
      }

      // Determinar melhor encoding para resposta
      const acceptEncoding = request.headers.get('accept-encoding') || '';
      const { content, encoding } = await this.getBestContent(assetInfo, acceptEncoding);

      // Criar headers de resposta
      const headers = {
        ...this.getCacheHeaders(assetInfo),
        'Content-Type': assetInfo.mimeType,
        'Content-Length': content.length.toString(),
        ...(encoding && { 'Content-Encoding': encoding })
      };

      logger.debug('Asset servido', {
        path: normalizedPath,
        size: content.length,
        encoding,
        cached: this.assetCache.has(normalizedPath)
      });

      return new NextResponse(content, { headers });
    } catch (error) {
      logger.error('Erro ao servir asset', { assetPath, error });
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  /**
   * Pré-carregar e comprimir assets críticos
   */
  async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      '/favicon.ico',
      '/manifest.json',
      '/uploads/logo.png',
      '/uploads/default-pizza.jpg'
    ];

    logger.info('Pré-carregando assets críticos');

    for (const assetPath of criticalAssets) {
      try {
        const fullPath = path.join(this.publicDir, assetPath);
        await this.getAssetInfo(fullPath, assetPath);
      } catch (error) {
        logger.warn('Asset crítico não encontrado', { assetPath });
      }
    }

    logger.info('Pré-carregamento concluído', { 
      loaded: this.assetCache.size 
    });
  }

  /**
   * Limpar cache de assets
   */
  clearCache(): void {
    this.assetCache.clear();
    logger.info('Cache de assets limpo');
  }

  /**
   * Obter estatísticas do CDN
   */
  getStats(): {
    cachedAssets: number;
    totalSize: number;
    compressionRatio: number;
    hitRate: number;
  } {
    let totalSize = 0;
    let compressedSize = 0;
    let hits = 0;

    for (const asset of this.assetCache.values()) {
      totalSize += asset.size;
      if (asset.compressed?.gzip) {
        compressedSize += asset.compressed.gzip.length;
      } else {
        compressedSize += asset.size;
      }
    }

    const compressionRatio = totalSize > 0 ? (1 - compressedSize / totalSize) * 100 : 0;

    return {
      cachedAssets: this.assetCache.size,
      totalSize,
      compressionRatio: parseFloat(compressionRatio.toFixed(2)),
      hitRate: 0 // TODO: Implementar tracking de hits
    };
  }

  // Métodos privados
  private normalizePath(assetPath: string): string {
    return assetPath.replace(/^\/+/, '').replace(/\.\./g, '');
  }

  private isValidPath(fullPath: string): boolean {
    const resolvedPath = path.resolve(fullPath);
    const resolvedPublicDir = path.resolve(this.publicDir);
    return resolvedPath.startsWith(resolvedPublicDir);
  }

  private async getAssetInfo(fullPath: string, normalizedPath: string): Promise<AssetInfo | null> {
    // Verificar cache primeiro
    const cached = this.assetCache.get(normalizedPath);
    if (cached) {
      // Verificar se arquivo foi modificado
      try {
        const stats = await fs.stat(fullPath);
        if (stats.mtime <= cached.lastModified) {
          return cached;
        }
      } catch {
        // Arquivo não existe mais
        this.assetCache.delete(normalizedPath);
        return null;
      }
    }

    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        return null;
      }

      const content = await fs.readFile(fullPath);
      const etag = this.generateETag(content);
      const mimeType = this.getMimeType(fullPath);

      const assetInfo: AssetInfo = {
        path: normalizedPath,
        size: stats.size,
        mimeType,
        etag,
        lastModified: stats.mtime
      };

      // Comprimir se habilitado e arquivo for compressível
      if (this.compressionEnabled && this.isCompressible(mimeType)) {
        assetInfo.compressed = await this.compressContent(content);
      }

      // Armazenar no cache
      this.assetCache.set(normalizedPath, assetInfo);

      return assetInfo;
    } catch (error) {
      logger.error('Erro ao obter informações do asset', { fullPath, error });
      return null;
    }
  }

  private generateETag(content: Buffer): string {
    return `"${createHash('md5').update(content).digest('hex')}"`;
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private isCompressible(mimeType: string): boolean {
    const compressibleTypes = [
      'text/',
      'application/javascript',
      'application/json',
      'application/xml',
      'image/svg+xml'
    ];

    return compressibleTypes.some(type => mimeType.startsWith(type));
  }

  private async compressContent(content: Buffer): Promise<{
    gzip?: Buffer;
    brotli?: Buffer;
  }> {
    const compressed: { gzip?: Buffer; brotli?: Buffer } = {};

    try {
      // Importar módulos de compressão dinamicamente
      const zlib = await import('zlib');
      const { promisify } = await import('util');

      const gzip = promisify(zlib.gzip);
      const brotliCompress = promisify(zlib.brotliCompress);

      // Comprimir com gzip
      compressed.gzip = await gzip(content, { level: 6 });

      // Comprimir com brotli (se disponível)
      try {
        compressed.brotli = await brotliCompress(content, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 6
          }
        });
      } catch (error) {
        logger.warn('Brotli não disponível', { error });
      }
    } catch (error) {
      logger.error('Erro ao comprimir conteúdo', { error });
    }

    return compressed;
  }

  private async getBestContent(assetInfo: AssetInfo, acceptEncoding: string): Promise<{
    content: Buffer;
    encoding?: string;
  }> {
    // Verificar se cliente aceita brotli
    if (acceptEncoding.includes('br') && assetInfo.compressed?.brotli) {
      return {
        content: assetInfo.compressed.brotli,
        encoding: 'br'
      };
    }

    // Verificar se cliente aceita gzip
    if (acceptEncoding.includes('gzip') && assetInfo.compressed?.gzip) {
      return {
        content: assetInfo.compressed.gzip,
        encoding: 'gzip'
      };
    }

    // Retornar conteúdo original
    const fullPath = path.join(this.publicDir, assetInfo.path);
    const content = await fs.readFile(fullPath);
    
    return { content };
  }

  private getCacheHeaders(assetInfo: AssetInfo): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${this.maxAge}, immutable`,
      'ETag': assetInfo.etag,
      'Last-Modified': assetInfo.lastModified.toUTCString(),
      'Vary': 'Accept-Encoding'
    };
  }
}

// Instância global do CDN
export const staticCDN = new StaticCDN();

// Middleware para servir assets estáticos
export function createStaticMiddleware() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const url = new URL(request.url);
    
    // Verificar se é um asset estático
    if (url.pathname.startsWith('/uploads/') || 
        url.pathname.startsWith('/images/') ||
        url.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)) {
      
      return await staticCDN.serveAsset(request, url.pathname);
    }

    return null;
  };
}

// Utilitários para otimização de imagens
export const imageOptimizer = {
  /**
   * Gerar URLs otimizadas para imagens
   */
  getOptimizedUrl(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}): string {
    if (!src) return '';
    
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    
    const queryString = params.toString();
    return queryString ? `${src}?${queryString}` : src;
  },

  /**
   * Gerar srcset para imagens responsivas
   */
  generateSrcSet(src: string, widths: number[]): string {
    return widths
      .map(width => `${this.getOptimizedUrl(src, { width })} ${width}w`)
      .join(', ');
  },

  /**
   * Gerar sizes para imagens responsivas
   */
  generateSizes(breakpoints: { maxWidth: string; size: string }[]): string {
    return breakpoints
      .map(bp => `(max-width: ${bp.maxWidth}) ${bp.size}`)
      .join(', ');
  }
};

export { StaticCDN };