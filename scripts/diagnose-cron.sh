#!/bin/bash

# 🔍 DIAGNOSTIC SCRIPT - Detecta automaticamente o problema com o cron no Docker

echo "🔍 Iniciando diagnóstico do Cron Worker..."
echo "================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir resultado
print_result() {
    local status=$1
    local message=$2
    
    if [ "$status" = "ok" ]; then
        echo -e "${GREEN}✅${NC} $message"
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠️${NC}  $message"
    else
        echo -e "${RED}❌${NC} $message"
    fi
}

# Função para linha de separação
separator() {
    echo "================================================"
}

# ==================== CHECKS ====================

echo ""
echo -e "${BLUE}1. VERIFICANDO STATUS DO SERVICE${NC}"
SERVICE_STATUS=$(docker service ls 2>&1 | grep impa-ai)

if echo "$SERVICE_STATUS" | grep -q "1/1"; then
    print_result "ok" "Service rodando: impa-ai (1/1)"
elif echo "$SERVICE_STATUS" | grep -q "0/1"; then
    print_result "error" "Service não está rodando: impa-ai (0/1)"
    echo "   AÇÃO: docker service update --force-update impa-ai"
else
    print_result "error" "Service não encontrado"
    echo "   AÇÃO: docker stack deploy -c docker-compose-production.yml impa-ai"
fi

separator
echo ""
echo -e "${BLUE}2. VERIFICANDO LOGS DO NEXT.JS${NC}"

NEXTJS_LOG=$(docker service logs impa-ai 2>&1 | grep "Ready - started" | tail -1)

if [ -n "$NEXTJS_LOG" ]; then
    print_result "ok" "Next.js iniciou corretamente"
else
    print_result "error" "Next.js não inicializou"
    echo "   Verificar: docker service logs impa-ai 2>&1 | tail -50"
fi

separator
echo ""
echo -e "${BLUE}3. VERIFICANDO LOGS DO CRON WORKER${NC}"

WORKER_LOG=$(docker service logs impa-ai 2>&1 | grep "\[reminder-cron\]" | head -1)

if [ -n "$WORKER_LOG" ]; then
    print_result "ok" "Cron Worker iniciou"
    echo "   $WORKER_LOG"
else
    print_result "error" "Cron Worker NÃO iniciou (nenhum log [reminder-cron])"
    echo ""
    echo "   Possíveis causas:"
    
    # Verificar se há erro de tsx
    if docker service logs impa-ai 2>&1 | grep -q "Cannot find module 'tsx'"; then
        echo "   1. ❌ tsx não instalado no Docker"
        echo "      AÇÃO: docker build --no-cache -t impa365/impa-ai:fix ."
    fi
    
    # Verificar se há erro de start.sh
    if docker service logs impa-ai 2>&1 | grep -q "No such file or directory" && \
       docker service logs impa-ai 2>&1 | grep -q "start.sh"; then
        echo "   2. ❌ start.sh não encontrado"
        echo "      AÇÃO: Verificar se Dockerfile copia o arquivo"
    fi
    
    # Verificar se há erro de variáveis
    if docker service logs impa-ai 2>&1 | grep -q "SUPABASE"; then
        echo "   3. ❌ Variáveis SUPABASE faltando"
        echo "      AÇÃO: Adicionar ao docker-compose-production.yml:"
        echo "           - SUPABASE_URL=..."
        echo "           - SUPABASE_SERVICE_ROLE_KEY=..."
    fi
    
    # Mostrar últimos 10 erros
    echo ""
    echo "   Últimos erros encontrados:"
    ERROR_LINES=$(docker service logs impa-ai 2>&1 | grep -i "error\|fail\|fatal" | tail -5)
    if [ -n "$ERROR_LINES" ]; then
        echo "$ERROR_LINES" | sed 's/^/   /'
    else
        echo "   (Nenhum erro evidente nos logs)"
    fi
fi

separator
echo ""
echo -e "${BLUE}4. VERIFICANDO EXECUÇÃO RECENTE${NC}"

# Contar quantos [reminder-cron] execuções temos
CRON_RUNS=$(docker service logs impa-ai 2>&1 | grep "\[reminder-cron\]" | wc -l)

if [ "$CRON_RUNS" -gt 0 ]; then
    print_result "ok" "Cron executou $CRON_RUNS vezes"
    
    # Verificar última execução
    LAST_RUN=$(docker service logs impa-ai 2>&1 | grep "\[reminder-cron\].*Execução concluída" | tail -1)
    if [ -n "$LAST_RUN" ]; then
        print_result "ok" "Última execução: CONCLUÍDA com sucesso"
    fi
else
    print_result "error" "Cron nunca foi executado"
fi

separator
echo ""
echo -e "${BLUE}5. VERIFICANDO DOCKERFILE${NC}"

if [ -f "Dockerfile" ]; then
    if grep -q "COPY --from=builder /app/node_modules" Dockerfile; then
        print_result "ok" "Dockerfile copia node_modules"
    else
        print_result "error" "Dockerfile NÃO copia node_modules"
        echo "   AÇÃO: Adicionar linha ao Dockerfile:"
        echo "         COPY --from=builder /app/node_modules ./node_modules"
    fi
    
    if grep -q "COPY --from=builder /app/scripts" Dockerfile; then
        print_result "ok" "Dockerfile copia scripts"
    else
        print_result "error" "Dockerfile NÃO copia scripts"
        echo "   AÇÃO: Adicionar linha ao Dockerfile:"
        echo "         COPY --from=builder /app/scripts ./scripts"
    fi
    
    if grep -q 'CMD \["/app/start.sh"\]' Dockerfile; then
        print_result "ok" "Dockerfile executa start.sh"
    else
        print_result "error" "Dockerfile não executa start.sh"
        echo "   AÇÃO: Mudar CMD para:"
        echo "         CMD [\"/app/start.sh\"]"
    fi
else
    print_result "error" "Dockerfile não encontrado"
fi

separator
echo ""
echo -e "${BLUE}6. VERIFICANDO DOCKER-COMPOSE${NC}"

if [ -f "docker-compose-production.yml" ]; then
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" docker-compose-production.yml; then
        print_result "ok" "docker-compose tem SUPABASE_SERVICE_ROLE_KEY"
    else
        print_result "error" "docker-compose faltam variáveis SUPABASE"
    fi
else
    print_result "error" "docker-compose-production.yml não encontrado"
fi

separator
echo ""
echo "🎯 RESUMO E PRÓXIMOS PASSOS:"
echo ""

# Contar quantos problemas foram encontrados
PROBLEMS=0
if ! echo "$SERVICE_STATUS" | grep -q "1/1"; then
    ((PROBLEMS++))
fi
if [ -z "$WORKER_LOG" ]; then
    ((PROBLEMS++))
fi

if [ "$PROBLEMS" -eq 0 ]; then
    echo -e "${GREEN}✅ TUDO PARECE OK!${NC}"
    echo ""
    echo "Se ainda assim o cron não está funcionando:"
    echo "1. Abra: https://agentes.blackatende.com/admin/settings/cron"
    echo "2. Procure por alerta vermelho: '⚠️ Cron Worker Não Está Rodando!'"
    echo "3. Execute o comando de diagnóstico sugerido no alerta"
else
    echo -e "${RED}⚠️  PROBLEMAS ENCONTRADOS!${NC}"
    echo ""
    echo "SOLUÇÃO RECOMENDADA (ordem de execução):"
    echo ""
    echo "1️⃣  Reconstruir Docker:"
    echo "    docker build --no-cache -t impa365/impa-ai:fix ."
    echo ""
    echo "2️⃣  Fazer push:"
    echo "    docker push impa365/impa-ai:fix"
    echo ""
    echo "3️⃣  Fazer deploy:"
    echo "    docker service update --force-update impa-ai"
    echo ""
    echo "4️⃣  Aguardar 1 minuto e re-executar este script"
    echo ""
    echo "5️⃣  Se ainda não funcionar, execute:"
    echo "    docker service logs impa-ai 2>&1 | tail -200 > /tmp/impa-debug.txt"
    echo "    E envie o arquivo para análise"
fi

separator
echo ""
echo "✨ Script de diagnóstico concluído!"
echo ""
