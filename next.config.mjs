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
    // Removido 'localhost' daqui. Adicione domínios de imagem de produção se necessário.
    // Ex: domains: ['cdn.example.com', 'supa.impa365.com'],
    domains: ['supa.impa365.com'], // Manter apenas domínios de produção ou CDN
    unoptimized: true // Mantido, pode ser útil em alguns cenários de Docker
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
