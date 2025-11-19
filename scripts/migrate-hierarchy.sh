#!/bin/bash

# ================================================
# Script de Migração para Sistema Hierárquico
# Execute com: bash migrate-hierarchy.sh
# ================================================

echo "🚀 Iniciando migração do Sistema Hierárquico Multi-Tenant..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "Crie um arquivo .env com DATABASE_URL"
    exit 1
fi

# Carregar variáveis de ambiente
source .env

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL não está definida no .env${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuração:${NC}"
echo "Database URL: ${DATABASE_URL}"
echo ""

# Confirmar execução
read -p "Deseja continuar com a migração? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Migração cancelada."
    exit 0
fi

echo ""
echo -e "${YELLOW}🔧 Executando migração SQL...${NC}"

# Executar migração
psql "$DATABASE_URL" -f database/migrations/001_add_companies_and_hierarchy.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migração executada com sucesso!${NC}"
    echo ""
    echo -e "${YELLOW}📊 Verificando estrutura criada...${NC}"
    
    # Verificar se tabelas foram criadas
    psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'impaai' AND table_name IN ('companies', 'company_resource_usage', 'company_activity_logs') ORDER BY table_name;"
    
    echo ""
    echo -e "${GREEN}✅ Estrutura criada com sucesso!${NC}"
    echo ""
    echo -e "${YELLOW}👤 Configurando Super Admin...${NC}"
    echo ""
    echo "Para criar um Super Admin, execute:"
    echo ""
    echo -e "${GREEN}psql \"\$DATABASE_URL\" -c \"UPDATE impaai.user_profiles SET role = 'super_admin', can_create_users = true, can_manage_company = true WHERE email = 'seu-email@exemplo.com';\"${NC}"
    echo ""
    echo "Ou crie um novo usuário como Super Admin através da API."
    echo ""
    echo -e "${YELLOW}📚 Próximos passos:${NC}"
    echo "1. Configure um Super Admin usando o comando acima"
    echo "2. Acesse o painel de Super Admin em /super-admin"
    echo "3. Crie empresas e defina limites de recursos"
    echo "4. Crie usuários admin para cada empresa"
    echo ""
    echo -e "${GREEN}🎉 Sistema Hierárquico pronto para uso!${NC}"
    echo ""
    echo "📖 Leia a documentação completa em: docs/SISTEMA_HIERARQUICO_README.md"
    
else
    echo ""
    echo -e "${RED}❌ Erro ao executar migração!${NC}"
    echo "Verifique os logs acima para mais detalhes."
    exit 1
fi
