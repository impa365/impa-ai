/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',

  // Otimizações de produção
  reactStrictMode: true,
  poweredByHeader: false, // Remove header "X-Powered-By: Next.js" por segurança
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configurações de imagem (atualizado para Next.js 16)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
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
  
  // Configurações Turbopack (Next.js 16+)
  turbopack: {
    // Configuração vazia para silenciar warning
  },

  // Configurações para external packages
  serverExternalPackages: ['@supabase/supabase-js']
}

export default nextConfig
