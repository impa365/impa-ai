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
