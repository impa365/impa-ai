# Use Node.js 18 Alpine como base
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat bash curl
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

# IMPORTANTE: As variáveis NEXT_PUBLIC_* devem vir do Portainer/Docker Compose
# Elas são necessárias durante o BUILD TIME para serem compiladas no código
# ARG permite que sejam passadas durante o docker build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

# Definir as variáveis de ambiente para o build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Log para verificar se as variáveis estão sendo passadas corretamente
RUN echo "🔧 Building with environment variables:" && \
    echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-❌ NOT DEFINED}" && \
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+✅ Defined (hidden)}${NEXT_PUBLIC_SUPABASE_ANON_KEY:-❌ NOT DEFINED}" && \
    echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-❌ NOT DEFINED}" && \
    echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+✅ Defined (hidden)}${NEXTAUTH_SECRET:-❌ NOT DEFINED}" && \
    echo "🚀 Starting build process..."

RUN npm run build

# Imagem de produção (runner)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários da etapa de build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Script de inicialização simples
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
echo "🚀 Starting Impa AI application..."
echo "📊 Runtime configuration:"
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "🌐 Application starting on http://0.0.0.0:${PORT}"
exec "$@"
EOF

RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f "http://localhost:${PORT:-3000}/api/health" || exit 1

USER nextjs

EXPOSE 3000

# Usar o script de inicialização
ENTRYPOINT ["/app/start.sh"]
CMD ["node", "server.js"]
