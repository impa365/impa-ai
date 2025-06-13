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

# Variáveis temporárias GENÉRICAS para o build (serão substituídas no runtime)
ENV NEXT_PUBLIC_SUPABASE_URL=__RUNTIME_SUPABASE_URL__
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=__RUNTIME_SUPABASE_ANON_KEY__
ENV NEXTAUTH_SECRET=temporary-secret-for-build
ENV NEXTAUTH_URL=__RUNTIME_NEXTAUTH_URL__
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

# Script para substituir variáveis no runtime
COPY --chown=nextjs:nodejs <<'EOF' /app/replace-env.sh
#!/bin/sh
echo "🔧 Replacing runtime environment variables..."

# Substituir placeholders nos arquivos JavaScript buildados
find /app/.next -name "*.js" -type f -exec sed -i \
  -e "s|__RUNTIME_SUPABASE_URL__|${NEXT_PUBLIC_SUPABASE_URL}|g" \
  -e "s|__RUNTIME_SUPABASE_ANON_KEY__|${NEXT_PUBLIC_SUPABASE_ANON_KEY}|g" \
  -e "s|__RUNTIME_NEXTAUTH_URL__|${NEXTAUTH_URL}|g" \
  {} +

echo "✅ Environment variables replaced successfully"
echo "🌐 SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}"
echo "🔑 SUPABASE_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
echo "🔗 NEXTAUTH_URL: ${NEXTAUTH_URL}"

exec "$@"
EOF

RUN chmod +x /app/replace-env.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usar o script de substituição como entrypoint
ENTRYPOINT ["/app/replace-env.sh"]
CMD ["node", "server.js"]
