/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANTE: Removemos a seção 'env' para evitar exposição de variáveis sensíveis
  // As variáveis NEXT_PUBLIC_* são automaticamente expostas ao frontend
  // Variáveis sem prefixo ficam disponíveis apenas no servidor (API Routes/Server Components)
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    
    // Configurações específicas para o servidor
    if (isServer) {
      config.externals.push('ws')
    }
    
    return config
  },
  // Otimizações para produção
  experimental: {
    serverComponentsExternalPackages: ['ws'],
  },
  // Configurações para fontes externas
  images: {
    domains: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  },
}

module.exports = nextConfig
