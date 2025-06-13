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

# IMPORTANTE: Definir placeholders APENAS para a etapa de BUILD
# Estas variáveis permitem que o `next build` funcione corretamente.
# Elas NÃO serão usadas em runtime se o Portainer injetar as variáveis corretas.
ENV NEXT_PUBLIC_SUPABASE_URL=http://placeholder-build.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-build-anon-key
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BUILD_TIME=true

# Log para verificar se as variáveis de build estão presentes
RUN echo "--- Building with build-time Supabase placeholders ---" && \
    echo "NEXT_PUBLIC_SUPABASE_URL (build-time): $NEXT_PUBLIC_SUPABASE_URL" && \
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY (build-time): $NEXT_PUBLIC_SUPABASE_ANON_KEY" && \
    echo "   Runtime values will be injected by Portainer / fetched via /api/config." && \
    echo "--------------------------------------------------------------------------"

RUN npm run build

# Imagem de produção (runner)
FROM base AS runner
WORKDIR /app

# NÃO definir ENV NEXT_PUBLIC_* aqui. Elas virão do Portainer.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# PORT é para o servidor Node, não para o Next.js diretamente
ENV PORT=3000
# HOSTNAME para o servidor Node
ENV HOSTNAME="0.0.0.0"

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar script de inicialização e diagnóstico
COPY --chown=nextjs:nodejs scripts/start.js ./scripts/
COPY --chown=nextjs:nodejs scripts/check-env.js ./scripts/
RUN chmod +x ./scripts/start.js ./scripts/check-env.js

# Copiar arquivos necessários da etapa de build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f "http://localhost:${PORT:-3000}/api/health" || exit 1

USER nextjs

EXPOSE 3000

# Usar script de inicialização que valida as variáveis de AMBIENTE (runtime)
CMD ["node", "scripts/start.js"]
