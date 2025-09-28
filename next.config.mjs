/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configurações de imagem
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  
  // Headers personalizados para permitir iframe embedding
  async headers() {
    return [
      {
        // Rotas que podem ser incorporadas em iframes
        source: '/(admin|dashboard)/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' // Permite iframe do mesmo domínio
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *.impa365.com impa365.com;"
          }
        ],
      },
      {
        // Rota especial para embedding externo com parâmetro
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL' // Permite iframe de qualquer domínio
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;"
          }
        ],
      }
    ]
  },
  
  // Configurações de webpack para compatibilidade
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },

  // Configurações para external packages
  serverExternalPackages: ['@supabase/supabase-js']
}

export default nextConfig
