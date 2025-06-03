# 🐳 Instalação com Docker - IMPA AI

Este guia mostra como instalar o IMPA AI usando Docker e Portainer.

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Portainer (opcional, mas recomendado)
- 4GB RAM mínimo
- 20GB espaço em disco

## 🚀 Instalação Rápida

### Método 1: Docker Compose Local

\`\`\`bash
# 1. Clone o repositório
git clone https://github.com/seu-repo/impa-ai.git
cd impa-ai

# 2. Criar volumes
docker volume create postgres_data
docker volume create impa_uploads
docker volume create nginx_logs

# 3. Criar rede
docker network create ImpaServer

# 4. Executar SQL de setup (primeira vez)
docker run --rm -v $(pwd)/database:/sql -v postgres_data:/var/lib/postgresql/data postgres:14 sh -c "
  initdb -D /var/lib/postgresql/data &&
  pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/data/logfile start &&
  createdb -h localhost impa_ai &&
  psql -h localhost -d impa_ai -f /sql/complete-setup.sql
"

# 5. Subir os serviços
docker-compose up -d
\`\`\`

### Método 2: Portainer Stack

## 🎛️ Configuração no Portainer

### 1. Preparar Volumes e Rede

No Portainer, vá para **Volumes** e crie:
- `postgres_data`
- `impa_uploads`
- `nginx_logs`

Vá para **Networks** e crie:
- `ImpaServer` (bridge)

### 2. Criar Stack

1. Vá para **Stacks** → **Add Stack**
2. Nome: `impa-ai`
3. Cole o conteúdo do arquivo `portainer-stack.yml`

### 3. Configurar Variáveis de Ambiente

No Portainer, configure estas variáveis obrigatórias:

#### 🐘 **Banco de Dados**
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `POSTGRES_PASSWORD` | `MinhaSenh@Segura123` | Senha do PostgreSQL |

#### 🚀 **Aplicação**
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `DOCKER_IMAGE` | `impa-ai:latest` | Imagem Docker da aplicação |
| `APP_PORT` | `3000` | Porta da aplicação no host |

#### 🔐 **Supabase (Obrigatório)**
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `SUPABASE_URL` | `https://abcdefgh.supabase.co` | URL do seu projeto Supabase |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Chave pública/anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Chave de serviço do Supabase (admin) |
| `SUPABASE_JWT_SECRET` | `super-secret-jwt-token-with-at-least-32-characters-long` | Segredo JWT do Supabase |

#### 🔑 **Autenticação**
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `NEXTAUTH_URL` | `http://localhost:3000` | URL completa da aplicação |
| `NEXTAUTH_SECRET` | `meu-nextauth-secret-super-seguro-123` | Segredo do NextAuth (32+ caracteres) |

### 📋 **Como obter as informações do Supabase:**

1. **Acesse seu projeto no Supabase**: https://app.supabase.com
2. **Vá para Settings → API**
3. **Copie as informações:**
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
4. **Vá para Settings → API → JWT Settings**
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

### ⚠️ **Importante:**
- **NUNCA** compartilhe a `SUPABASE_SERVICE_ROLE_KEY` publicamente
- **SEMPRE** use HTTPS em produção
- **ALTERE** o `NEXTAUTH_SECRET` para um valor único e seguro

### 4. Deploy da Stack

1. Clique em **Deploy the stack**
2. Aguarde o download das imagens
3. Verifique se todos os serviços estão rodando

## 🔧 Build da Imagem Docker

### Build Local

\`\`\`bash
# Build da imagem
docker build -t impa-ai:latest .

# Ou com tag específica
docker build -t impa-ai:v1.0.0 .
\`\`\`

### Build e Push para Registry

\`\`\`bash
# Build
docker build -t seu-registry/impa-ai:latest .

# Push
docker push seu-registry/impa-ai:latest
\`\`\`

## 🏗️ Estrutura dos Serviços

### PostgreSQL
- **Porta**: 5432
- **Volume**: `postgres_data`
- **Banco**: `impa_ai`
- **Usuário**: `impa_user`

### IMPA AI App
- **Porta**: 3000
- **Volume**: `app_uploads`
- **Healthcheck**: `/api/health`

### Nginx (Opcional)
- **Portas**: 80, 443
- **Volume**: `nginx_logs`
- **Proxy**: Para `impa-ai:3000`

## 🔍 Monitoramento

### Verificar Status dos Serviços

\`\`\`bash
# Status geral
docker-compose ps

# Logs da aplicação
docker-compose logs -f impa-ai

# Logs do banco
docker-compose logs -f postgres

# Logs do nginx
docker-compose logs -f nginx
\`\`\`

### Health Checks

\`\`\`bash
# Verificar saúde da aplicação
curl http://localhost:3000/api/health

# Verificar banco
docker exec impa-postgres pg_isready -U impa_user -d impa_ai
\`\`\`

## 🔄 Backup e Restore

### Backup do Banco

\`\`\`bash
# Backup
docker exec impa-postgres pg_dump -U impa_user impa_ai > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compactado
docker exec impa-postgres pg_dump -U impa_user impa_ai | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
\`\`\`

### Restore do Banco

\`\`\`bash
# Restore
docker exec -i impa-postgres psql -U impa_user impa_ai < backup.sql

# Restore de arquivo compactado
gunzip -c backup.sql.gz | docker exec -i impa-postgres psql -U impa_user impa_ai
\`\`\`

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Aplicação não conecta no banco
\`\`\`bash
# Verificar se o banco está rodando
docker exec impa-postgres pg_isready

# Verificar logs do banco
docker-compose logs postgres
\`\`\`

#### 2. Erro de permissão nos volumes
\`\`\`bash
# Ajustar permissões
sudo chown -R 999:999 /var/lib/docker/volumes/postgres_data/_data
\`\`\`

#### 3. Porta já em uso
\`\`\`bash
# Verificar portas em uso
netstat -tulpn | grep :3000

# Alterar porta no docker-compose.yml
ports:
  - "3001:3000"  # Usar porta 3001 no host
\`\`\`

### Logs Detalhados

\`\`\`bash
# Logs com timestamp
docker-compose logs -f -t

# Logs de um serviço específico
docker-compose logs -f impa-ai

# Últimas 100 linhas
docker-compose logs --tail=100 impa-ai
\`\`\`

## 🔄 Atualizações

### Atualizar Aplicação

\`\`\`bash
# 1. Fazer backup
docker exec impa-postgres pg_dump -U impa_user impa_ai > backup_before_update.sql

# 2. Parar serviços
docker-compose down

# 3. Atualizar código
git pull origin main

# 4. Rebuild imagem
docker-compose build impa-ai

# 5. Subir serviços
docker-compose up -d
\`\`\`

### Atualizar via Portainer

1. Vá para **Images** → **Build a new image**
2. Faça upload do novo código
3. Build nova imagem
4. Vá para **Stacks** → Sua stack
5. **Editor** → Altere a tag da imagem
6. **Update the stack**

## 📊 Monitoramento Avançado

### Prometheus + Grafana (Opcional)

\`\`\`yaml
# Adicionar ao docker-compose.yml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
\`\`\`

## 🔐 Segurança

### Recomendações

1. **Alterar senhas padrão**
2. **Usar HTTPS em produção**
3. **Configurar firewall**
4. **Backup regular**
5. **Monitorar logs**

### SSL com Let's Encrypt

\`\`\`bash
# Instalar certbot
docker run -it --rm --name certbot \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  certbot/certbot certonly --standalone -d seu-dominio.com
\`\`\`

## 📞 Suporte

- **Logs**: Sempre inclua logs ao reportar problemas
- **Versões**: Informe versões do Docker e sistema operacional
- **Configuração**: Compartilhe docker-compose.yml (sem senhas)

**🎉 Sua instalação Docker do IMPA AI está pronta!**

### Primeiro Acesso
- **URL**: http://localhost:3000
- **Login**: admin@impa.ai
- **Senha**: admin123

**⚠️ Lembre-se de alterar a senha padrão!**
