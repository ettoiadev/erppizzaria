/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "ewoihxpitbbypqylhdkm.supabase.co"],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Content-Type",
            value: "image/x-icon",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configurações específicas para Vercel
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Garantir que as rotas de API usem Node.js runtime
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

module.exports = nextConfig
