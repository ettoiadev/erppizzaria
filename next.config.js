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
}

module.exports = nextConfig
