/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',
  
  // Ignorar erros durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configurações de imagem
  images: {
    domains: ['localhost', 'supa.impa365.com'],
    unoptimized: true
  },
  
  // Configurações experimentais
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Repassar variáveis de ambiente sem valores padrão
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
  }
}

export default nextConfig
