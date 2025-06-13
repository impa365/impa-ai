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

# Variáveis temporárias VÁLIDAS para o build (serão substituídas no runtime)
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

# Script para substituir variáveis no runtime
COPY --chown=nextjs:nodejs <<'EOF' /app/replace-env.sh
#!/bin/sh
echo "🔧 Replacing runtime environment variables..."

# Verificar se as variáveis estão definidas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not defined"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY not defined"
  exit 1
fi

# Substituir placeholders nos arquivos JavaScript buildados
find /app/.next -name "*.js" -type f -exec sed -i \
  -e "s|https://placeholder-supabase-url.supabase.co|${NEXT_PUBLIC_SUPABASE_URL}|g" \
  -e "s|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMjM0NTYsImV4cCI6MTk2MDY5OTQ1Nn0.placeholder-key-for-build-only|${NEXT_PUBLIC_SUPABASE_ANON_KEY}|g" \
  -e "s|https://placeholder-app-url.com|${NEXTAUTH_URL}|g" \
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
