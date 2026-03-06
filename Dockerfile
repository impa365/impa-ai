# Use Node.js 22 Alpine como base (compatível com Next.js 16 e React 19)
FROM node:22-alpine AS base

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

# NÃO definir variáveis  aqui - elas serão carregadas dinamicamente
ENV NEXT_TELEMETRY_DISABLED=1
# Desabilitar Turbopack para build de produção mais estável
ENV TURBOPACK=0

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
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib

# Script de inicialização que mostra as variáveis e inicia a aplicação + worker
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
echo "🔧 Impa AI - Configuração Runtime"
echo "=================================="

echo "📊 Variáveis de Ambiente Carregadas:"
echo "DATABASE_URL: ${DATABASE_URL:+✅ Definida}${DATABASE_URL:-❌ NÃO DEFINIDA}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-❌ NÃO DEFINIDA}"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+✅ Definida}${NEXTAUTH_SECRET:-❌ NÃO DEFINIDA}"
echo "REMINDER_CRON_SCHEDULE: ${REMINDER_CRON_SCHEDULE:-⏰ (default: * * * * *)}"
echo "REMINDER_CRON_TIMEZONE: ${REMINDER_CRON_TIMEZONE:-🌍 (default: America/Sao_Paulo)}"

echo ""
echo "🚀 Iniciando aplicação + worker..."
echo "=================================="

# Função para encerrar ambos os processos
cleanup() {
  echo "⏹️  Encerrando processos..."
  kill $NEXT_PID 2>/dev/null
  kill $WORKER_PID 2>/dev/null
  exit 0
}

trap cleanup SIGTERM SIGINT

# Iniciar o servidor Next.js em background
node server.js &
NEXT_PID=$!

# Iniciar o worker do cron em background
npx tsx scripts/reminder-cron-worker.ts &
WORKER_PID=$!

echo "✅ Next.js iniciado (PID: $NEXT_PID)"
echo "✅ Cron Worker iniciado (PID: $WORKER_PID)"

# Aguardar os processos
wait
EOF

RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usar o script de inicialização
CMD ["/app/start.sh"]
