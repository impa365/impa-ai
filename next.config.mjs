/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'supa.impa365.com'],
    unoptimized: true,
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Garantir que o Next.js use as variáveis de ambiente do processo
  // para NEXT_PUBLIC_ prefixed vars durante o build e no servidor.
  // No cliente, confiaremos na injeção via window.__RUNTIME_CONFIG__.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Adicione outras NEXT_PUBLIC_ vars aqui se necessário
  },
};

export default nextConfig;
