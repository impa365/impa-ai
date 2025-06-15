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

# IMPORTANTE: Estas são APENAS para o build - não afetam o runtime
ENV NEXT_PUBLIC_SUPABASE_URL=https://build-placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=build-placeholder-key
ENV NEXTAUTH_SECRET=build-placeholder-secret
ENV NEXTAUTH_URL=https://build-placeholder.com
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# LIMPAR todas as variáveis de build para evitar conflitos
ENV NEXT_PUBLIC_SUPABASE_URL=
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=
ENV NEXTAUTH_SECRET=
ENV NEXTAUTH_URL=

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Script de inicialização
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
echo "🔧 Container Runtime Environment Check:"
echo "======================================"
echo "SUPABASE_URL: ${SUPABASE_URL:-❌ NOT SET}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:+✅ SET (${#SUPABASE_ANON_KEY} chars)}${SUPABASE_ANON_KEY:-❌ NOT SET}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-❌ NOT SET}"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+✅ SET}${NEXTAUTH_SECRET:-❌ NOT SET}"
echo "======================================"

# Verificar variáveis essenciais
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ ERRO CRÍTICO: SUPABASE_URL não está definida!"
    echo "   Configure esta variável na sua stack do Portainer."
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ ERRO CRÍTICO: SUPABASE_ANON_KEY não está definida!"
    echo "   Configure esta variável na sua stack do Portainer."
    exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ ERRO CRÍTICO: NEXTAUTH_URL não está definida!"
    echo "   Configure esta variável na sua stack do Portainer."
    exit 1
fi

echo "✅ Todas as variáveis essenciais estão configuradas!"
echo "🚀 Iniciando aplicação..."

exec "$@"
EOF

RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/start.sh"]
CMD ["node", "server.js"]
