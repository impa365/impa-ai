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

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Imagem de produção (runner)
FROM base AS runner
WORKDIR /app

# As variáveis de AMBIENTE para o RUNTIME virão do Portainer.
# NÃO definir ENV NEXT_PUBLIC_* aqui, a menos que você queira um fallback
# se o Portainer não injetar, mas o objetivo é depender do Portainer.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000 # PORT é para o servidor Node, não para o Next.js diretamente
ENV HOSTNAME="0.0.0.0" # HOSTNAME para o servidor Node

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar script de inicialização
COPY --chown=nextjs:nodejs scripts/start.js ./scripts/
RUN chmod +x ./scripts/start.js

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
# injetadas pelo Portainer.
CMD ["node", "scripts/start.js"]
