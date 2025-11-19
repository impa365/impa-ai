# ================================================
# Script de Migração para Sistema Hierárquico
# Execute com: .\migrate-hierarchy.ps1
# ================================================

Write-Host "🚀 Iniciando migração do Sistema Hierárquico Multi-Tenant..." -ForegroundColor Cyan
Write-Host ""

# Verificar se arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "Crie um arquivo .env com DATABASE_URL"
    exit 1
}

# Carregar variáveis de ambiente
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$DATABASE_URL = $env:DATABASE_URL

# Verificar se DATABASE_URL está definida
if ([string]::IsNullOrEmpty($DATABASE_URL)) {
    Write-Host "❌ DATABASE_URL não está definida no .env" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "Database URL: $DATABASE_URL"
Write-Host ""

# Confirmar execução
$confirmation = Read-Host "Deseja continuar com a migração? (s/n)"
if ($confirmation -ne 's' -and $confirmation -ne 'S') {
    Write-Host "Migração cancelada."
    exit 0
}

Write-Host ""
Write-Host "🔧 Executando migração SQL..." -ForegroundColor Yellow

# Verificar se psql está instalado
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL psql não encontrado no PATH!" -ForegroundColor Red
    Write-Host "Instale o PostgreSQL ou adicione ao PATH"
    exit 1
}

# Executar migração
$migrationFile = "database\migrations\001_add_companies_and_hierarchy.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Arquivo de migração não encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

try {
    & psql $DATABASE_URL -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migração executada com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Verificando estrutura criada..." -ForegroundColor Yellow
        
        # Verificar se tabelas foram criadas
        $verifyQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'impaai' AND table_name IN ('companies', 'company_resource_usage', 'company_activity_logs') ORDER BY table_name;"
        & psql $DATABASE_URL -c $verifyQuery
        
        Write-Host ""
        Write-Host "✅ Estrutura criada com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "👤 Configurando Super Admin..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Para criar um Super Admin, execute:" -ForegroundColor White
        Write-Host ""
        Write-Host 'psql "$env:DATABASE_URL" -c "UPDATE impaai.user_profiles SET role = ''super_admin'', can_create_users = true, can_manage_company = true WHERE email = ''seu-email@exemplo.com'';"' -ForegroundColor Green
        Write-Host ""
        Write-Host "Ou crie um novo usuário como Super Admin através da API."
        Write-Host ""
        Write-Host "📚 Próximos passos:" -ForegroundColor Yellow
        Write-Host "1. Configure um Super Admin usando o comando acima"
        Write-Host "2. Acesse o painel de Super Admin em /super-admin"
        Write-Host "3. Crie empresas e defina limites de recursos"
        Write-Host "4. Crie usuários admin para cada empresa"
        Write-Host ""
        Write-Host "🎉 Sistema Hierárquico pronto para uso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📖 Leia a documentação completa em: docs\SISTEMA_HIERARQUICO_README.md"
    }
    else {
        Write-Host ""
        Write-Host "❌ Erro ao executar migração!" -ForegroundColor Red
        Write-Host "Verifique os logs acima para mais detalhes."
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar migração: $_" -ForegroundColor Red
    exit 1
}
