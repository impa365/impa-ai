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

# Variáveis de ambiente para o build (se você decidir passá-las no build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# NÃO definir variáveis NEXT_PUBLIC_ aqui - elas serão carregadas dinamicamente
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação SEM variáveis específicas
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
# Copiar .env.production se você usar um para runtime configs (opcional)
# COPY --from=builder /app/.env.production ./.env.production
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Script de inicialização que mostra as variáveis e inicia a aplicação
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
echo "=================================="
echo "🔧 Impa AI - Docker Entrypoint"
echo "Timestamp: $(date)"
echo "=================================="

echo "📊 Variáveis de Ambiente Carregadas (Servidor):"
echo "SUPABASE_URL: ${SUPABASE_URL:-❌ NÃO DEFINIDA}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:+✅ Definida (verifique o comprimento)}${SUPABASE_ANON_KEY:-❌ NÃO DEFINIDA}"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+✅ Definida (verifique o comprimento)}${SUPABASE_SERVICE_ROLE_KEY:-❌ NÃO DEFINIDA}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-❌ NÃO DEFINIDA}"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+✅ Definida}${NEXTAUTH_SECRET:-❌ NÃO DEFINIDA}"
echo "CUSTOM_KEY: ${CUSTOM_KEY:+✅ Definida}${CUSTOM_KEY:-❌ NÃO DEFINIDA}"
echo "PORT: ${PORT:-❌ NÃO DEFINIDA (usará 3000)}"
echo "HOSTNAME: ${HOSTNAME:-❌ NÃO DEFINIDA (usará 0.0.0.0)}"
echo ""
echo "📊 Variáveis de Ambiente Carregadas (Públicas - NEXT_PUBLIC_):"
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-❌ NÃO DEFINIDA}"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+✅ Definida (verifique o comprimento)}${NEXT_PUBLIC_SUPABASE_ANON_KEY:-❌ NÃO DEFINIDA}"
# Adicione outras NEXT_PUBLIC_ que você usa
echo ""
echo "🚀 Verificando arquivos e permissões..."
ls -la /app
echo ""
echo "🚀 Iniciando aplicação Next.js..."
echo "=================================="

# Iniciar a aplicação
exec node server.js
EOF

RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usar o script de inicialização
CMD ["/app/start.sh"]
