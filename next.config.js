/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    
    if (isServer) {
      config.externals.push('ws')
    }
    
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['ws'],
  },
  images: {
    domains: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  serverRuntimeConfig: {
    api: {
      bodyParser: {
        sizeLimit: '1mb',
      },
      externalResolver: true,
      responseLimit: false,
    },
  },
}

module.exports = nextConfig
