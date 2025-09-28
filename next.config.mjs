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
    // Verificar variável de ambiente para controlar embed
    const allowEmbedding = process.env.ALLOW_IFRAME_EMBEDDING !== 'false' // Default: true
    const embedPolicy = process.env.IFRAME_EMBEDDING_POLICY || 'ALLOWALL' // ALLOWALL, SAMEORIGIN, DENY
    const allowedDomains = process.env.IFRAME_ALLOWED_DOMAINS || '*' // Lista de domínios ou *
    
    console.log('🖼️ [IFRAME CONFIG]', {
      allowEmbedding,
      embedPolicy,
      allowedDomains
    })
    
    // Se embedding está desabilitado, usar DENY
    if (!allowEmbedding) {
      return [
        {
          source: '/(admin|dashboard|embed)/:path*',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY'
            },
            {
              key: 'Content-Security-Policy',
              value: "frame-ancestors 'none';"
            }
          ],
        }
      ]
    }
    
    // Configurar CSP baseado nos domínios permitidos
    let cspValue = "frame-ancestors 'none';"
    if (embedPolicy === 'ALLOWALL' || allowedDomains === '*') {
      cspValue = "frame-ancestors *;"
    } else if (embedPolicy === 'SAMEORIGIN') {
      cspValue = "frame-ancestors 'self';"
    } else if (allowedDomains && allowedDomains !== '*') {
      // Lista específica de domínios
      const domains = allowedDomains.split(',').map(d => d.trim()).join(' ')
      cspValue = `frame-ancestors 'self' ${domains};`
    }
    
    return [
      {
        // Rotas admin e dashboard
        source: '/(admin|dashboard)/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: embedPolicy
          },
          {
            key: 'Content-Security-Policy',
            value: cspValue
          }
        ],
      },
      {
        // Rota especial para embedding externo
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: embedPolicy
          },
          {
            key: 'Content-Security-Policy',
            value: cspValue
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
