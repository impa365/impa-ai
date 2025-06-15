# Use Node.js 18 Alpine como base
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Build da aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis temporárias VÁLIDAS para o build (apenas para que o build passe)
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder-supabase-url.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMjM0NTYsImV4cCI6MTk2MDY5OTQ1Nn0.placeholder-key-for-build-only
ENV NEXTAUTH_SECRET=temporary-secret-for-build-only
ENV NEXTAUTH_URL=https://placeholder-app-url.com
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Script para mostrar as variáveis de runtime
COPY --chown=nextjs:nodejs <<'EOF' /app/show-env.sh
#!/bin/sh
echo "🔧 Runtime environment variables:"

echo "📊 Runtime Variables (used by API):"
echo "SUPABASE_URL: ${SUPABASE_URL:-❌ NOT DEFINED}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:+✅ Defined}${SUPABASE_ANON_KEY:-❌ NOT DEFINED}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-❌ NOT DEFINED}"

echo "🚀 Starting application with dynamic configuration..."

exec "$@"
EOF

RUN chmod +x /app/show-env.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usar o script de verificação como entrypoint
ENTRYPOINT ["/app/show-env.sh"]
CMD ["node", "server.js"]
