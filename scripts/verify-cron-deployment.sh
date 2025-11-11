#!/bin/bash

###############################################################################
# Script de Verificação de Deployment do Cron de Reminders
# Uso: bash verify-cron-deployment.sh
###############################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DOCKER_SERVICE_NAME="${1:-impa-ai}"
API_URL="${2:-https://agentes.blackatende.com}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Verificação de Deployment do Cron de Reminders${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Array para rastrear status
CHECKS_PASSED=0
CHECKS_FAILED=0

###############################################################################
# Função auxiliar para verificações
###############################################################################

check_status() {
    local check_name=$1
    local check_cmd=$2
    
    echo -n "  $check_name ... "
    
    if eval "$check_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

###############################################################################
# 1. VERIFICAÇÕES DOCKER
###############################################################################

echo -e "${BLUE}📦 VERIFICAÇÕES DOCKER${NC}"
echo ""

check_status "Docker daemon ativo" "docker info > /dev/null 2>&1"

if docker service ls > /dev/null 2>&1; then
    check_status "Docker Swarm ativo" "docker service ls > /dev/null 2>&1"
    
    check_status "Service $DOCKER_SERVICE_NAME existe" \
        "docker service ls --format '{{.Name}}' | grep -q '^${DOCKER_SERVICE_NAME}$'"
    
    if docker service ls --format '{{.Name}}' | grep -q "^${DOCKER_SERVICE_NAME}$"; then
        check_status "Container rodando" \
            "docker service ls --filter 'name=${DOCKER_SERVICE_NAME}' --format '{{.Replicas}}' | grep -qE '^1/1$|^2/2$|^3/3$'"
    fi
else
    echo -n "  Docker Compose ativo ... "
    if docker compose ls > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠️  (Pode estar usando Docker local)${NC}"
    fi
fi

echo ""

###############################################################################
# 2. VERIFICAÇÕES DE LOGS
###############################################################################

echo -e "${BLUE}📋 VERIFICAÇÕES DE LOGS${NC}"
echo ""

if docker service ls --format '{{.Name}}' | grep -q "^${DOCKER_SERVICE_NAME}$" 2>/dev/null; then
    # Docker Swarm
    LOGS=$(docker service logs "${DOCKER_SERVICE_NAME}" 2>/dev/null | tail -100)
else
    # Docker Compose - tenta ambas as formas
    LOGS=$(docker compose logs "${DOCKER_SERVICE_NAME}" 2>/dev/null | tail -100) || \
    LOGS=$(docker logs "${DOCKER_SERVICE_NAME}" 2>/dev/null | tail -100) || \
    LOGS=""
fi

if [ -z "$LOGS" ]; then
    echo -n "  Logs acessíveis ... "
    echo -e "${YELLOW}⚠️  (Não foi possível ler logs)${NC}"
else
    check_status "Worker iniciado" "echo '$LOGS' | grep -q 'Worker iniciado'"
    
    check_status "Supabase conectado" "echo '$LOGS' | grep -qE '(SUPABASE_URL|Supabase)' || echo '$LOGS' | grep -qE '(Executando cron)'"
    
    check_status "Execução do cron" "echo '$LOGS' | grep -q 'Executando cron'"
    
    check_status "Sem erros críticos" "! echo '$LOGS' | grep -q 'FATAL\\|Cannot find module'"
fi

echo ""

###############################################################################
# 3. VERIFICAÇÕES DE API
###############################################################################

echo -e "${BLUE}🌐 VERIFICAÇÕES DE API${NC}"
echo ""

if [[ $API_URL == https://* ]]; then
    check_status "HTTPS respondendo" "curl -s -o /dev/null -w '%{http_code}' ${API_URL} | grep -qE '^(200|301|302|404)$'"
    
    check_status "API de status do cron" \
        "curl -s ${API_URL}/api/admin/reminders/cron | grep -q 'success'"
    
    check_status "API de trigger manual" \
        "curl -s -X POST ${API_URL}/api/internal/reminders/run \
              -H 'x-reminder-cron-secret: test' \
              -H 'x-dry-run: 1' | grep -qE '(success|erro)'"
else
    echo "  ⚠️  URL não é HTTPS, pulando verificações de API"
fi

echo ""

###############################################################################
# 4. VERIFICAÇÕES DE AMBIENTE
###############################################################################

echo -e "${BLUE}🔧 VERIFICAÇÕES DE AMBIENTE${NC}"
echo ""

if docker service ls --format '{{.Name}}' | grep -q "^${DOCKER_SERVICE_NAME}$" 2>/dev/null; then
    # Docker Swarm
    ENV_VARS=$(docker service inspect "${DOCKER_SERVICE_NAME}" 2>/dev/null | grep -o 'REMINDER_CRON[^"]*' || true)
else
    # Docker Compose
    ENV_VARS=$(docker compose config 2>/dev/null | grep -o 'REMINDER_CRON[^"]*' || true)
fi

echo "  Variáveis de ambiente do Cron:"
if [ -z "$ENV_VARS" ]; then
    echo -e "    ${YELLOW}⚠️  Não encontradas (usar 'docker service inspect' para verificar)${NC}"
else
    echo "$ENV_VARS" | while read -r var; do
        echo "    ✓ $var"
    done
fi

echo ""

###############################################################################
# 5. VERIFICAÇÕES DE BANCO DE DADOS (se possível)
###############################################################################

echo -e "${BLUE}🗄️  VERIFICAÇÕES DE BANCO DE DADOS${NC}"
echo ""

echo "  Execute estas queries no Supabase para verificação completa:"
echo ""
echo -e "  ${YELLOW}-- Últimas execuções do cron${NC}"
echo "  SELECT started_at, duration_ms, success, reminders_sent, reminders_failed"
echo "  FROM impaai.reminder_cron_runs"
echo "  ORDER BY started_at DESC"
echo "  LIMIT 5;"
echo ""
echo -e "  ${YELLOW}-- Triggers ativos${NC}"
echo "  SELECT COUNT(*) as total FROM impaai.reminder_triggers WHERE is_active = true;"
echo ""
echo -e "  ${YELLOW}-- Últimos logs de disparo${NC}"
echo "  SELECT trigger_id, booking_uid, executed_at, success, error_message"
echo "  FROM impaai.reminder_trigger_logs"
echo "  ORDER BY executed_at DESC"
echo "  LIMIT 10;"
echo ""

###############################################################################
# RESUMO FINAL
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 RESUMO${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Verificações passadas: ${CHECKS_PASSED}${NC}"
echo -e "  ${RED}Verificações falhadas: ${CHECKS_FAILED}${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo parece estar funcionando corretamente!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Acessar o monitor: $API_URL/admin/settings/cron"
    echo "  2. Verificar as próximas execuções programadas"
    echo "  3. Monitorar logs em tempo real: docker service logs -f $DOCKER_SERVICE_NAME"
    exit 0
else
    echo -e "${RED}❌ Algumas verificações falharam!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verificar se o container está rodando: docker ps | grep $DOCKER_SERVICE_NAME"
    echo "  2. Ver logs completos: docker service logs $DOCKER_SERVICE_NAME"
    echo "  3. Verificar variáveis de ambiente no Docker Compose"
    echo "  4. Consultar docs/CRON_DEPLOYMENT_GUIDE.md"
    exit 1
fi
