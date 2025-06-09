# 🐳 Instalação com Docker - IMPA AI

Este guia mostra como instalar o IMPA AI usando Docker e Portainer com **passo a passo completo**.

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+ 
- Portainer instalado e funcionando
- Conta no Supabase (gratuita)
- 4GB RAM mínimo
- 20GB espaço em disco

## 🚀 Instalação Completa - Passo a Passo

### **PASSO 1: Configurar Supabase** 🔐

#### 1.1 Criar Projeto no Supabase
1. Acesse: https://app.supabase.com
2. Clique em **"New Project"**
3. Escolha sua organização
4. Configure:
   - **Name**: `impa-ai` (ou nome de sua escolha)
   - **Database Password**: Anote essa senha! 
   - **Region**: Escolha mais próxima de você
5. Clique em **"Create new project"**
6. **Aguarde 2-3 minutos** para o projeto ser criado

#### 1.2 Obter Credenciais do Supabase
1. No seu projeto, vá para **Settings → API**
2. **COPIE E ANOTE** estas informações:
   \`\`\`
   Project URL: https://seuprojectid.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (opcional)
   \`\`\`
3. Vá para **Settings → API → JWT Settings**
4. **COPIE** o JWT Secret (opcional):
   \`\`\`
   JWT Secret: super-secret-jwt-token-with-at-least-32-characters-long
   \`\`\`

#### 1.3 Executar SQL no Supabase
1. No Supabase, vá para **SQL Editor**
2. Clique em **"New Query"**
3. **COPIE E COLE** o conteúdo do arquivo `database/template.sql`
4. Clique em **"Run"** para executar
5. **COPIE E COLE** o conteúdo do arquivo `database/agents-schema.sql`
6. Clique em **"Run"** novamente
7. **COPIE E COLE** o conteúdo do arquivo `database/agents-advanced-config.sql`
8. Clique em **"Run"** mais uma vez

✅ **Supabase configurado com sucesso!**

### **PASSO 2: Preparar Portainer** 🐳

#### 2.1 Criar Volumes
1. No Portainer, vá para **Volumes**
2. Clique em **"Add volume"**
3. Crie estes volumes:
   - **Nome**: `postgres_data` → **Create**
   - **Nome**: `impa_uploads` → **Create**

#### 2.2 Criar Rede
1. Vá para **Networks**
2. Clique em **"Add network"**
3. Configure:
   - **Name**: `ImpaServer`
   - **Driver**: `bridge`
4. Clique em **"Create the network"**

✅ **Portainer preparado!**

### **PASSO 3: Gerar NEXTAUTH_SECRET** 🔑

Escolha um método para gerar o secret:

#### Método 1: OpenSSL (Linux/Mac)
\`\`\`bash
openssl rand -base64 32
\`\`\`

#### Método 2: Node.js
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

#### Método 3: Online
- Acesse: https://generate-secret.vercel.app/32
- **COPIE** o resultado

**ANOTE** o resultado, exemplo:
\`\`\`
K7+x9QmP8vF2nR5tY8uI3oA6sD9gH1jL4mN7pQ0wE2r=
\`\`\`

### **PASSO 4: Criar Stack no Portainer** 📦

#### 4.1 Criar Nova Stack
1. No Portainer, vá para **Stacks**
2. Clique em **"Add stack"**
3. Configure:
   - **Name**: `impa-ai`
   - **Build method**: `Web editor`

#### 4.2 Colar Configuração
1. **COPIE** todo o conteúdo do arquivo `portainer-stack.yml`
2. **COLE** no editor do Portainer

#### 4.3 Configurar Variáveis de Ambiente

Role para baixo até **"Environment variables"** e configure:

##### 🔴 **OBRIGATÓRIAS:**
\`\`\`yaml
# Banco de Dados
POSTGRES_USER: impa_user
POSTGRES_PASSWORD: SuaSenhaSegura123!
POSTGRES_DATABASE: impa_ai
POSTGRES_SCHEMA: public

# Aplicação  
DOCKER_IMAGE: impa-ai:latest
APP_PORT: 3000

# Supabase (do PASSO 1)
SUPABASE_URL: https://seuprojectid.supabase.co
SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Autenticação
NEXTAUTH_URL: http://localhost:3000
NEXTAUTH_SECRET: K7+x9QmP8vF2nR5tY8uI3oA6sD9gH1jL4mN7pQ0wE2r=
\`\`\`

##### 🟡 **OPCIONAIS (deixe vazio por enquanto):**
\`\`\`yaml
# Supabase Avançado (adicionar depois se precisar)
SUPABASE_SERVICE_ROLE_KEY: 
SUPABASE_JWT_SECRET: 
\`\`\`

#### 4.4 Deploy da Stack
1. **Revise** todas as variáveis
2. Clique em **"Deploy the stack"**
3. **Aguarde** o download das imagens (pode demorar alguns minutos)

### **PASSO 5: Build da Imagem Docker** 🏗️

#### 5.1 Preparar Código
\`\`\`bash
# Clone o repositório
git clone https://github.com/seu-repo/impa-ai.git
cd impa-ai
\`\`\`

#### 5.2 Build Local
\`\`\`bash
# Build da imagem
docker build -t impa-ai:latest .

# Verificar se foi criada
docker images | grep impa-ai
\`\`\`

#### 5.3 Alternativa: Build no Portainer
1. Vá para **Images**
2. Clique em **"Build a new image"**
3. Configure:
   - **Image name**: `impa-ai:latest`
   - **Build method**: `Upload`
4. Faça upload do código compactado
5. Clique em **"Build the image"**

### **PASSO 6: Verificar Instalação** ✅

#### 6.1 Verificar Serviços
1. No Portainer, vá para **Stacks → impa-ai**
2. Verifique se ambos serviços estão **"running"**:
   - ✅ `postgres` 
   - ✅ `impa-ai`

#### 6.2 Verificar Logs
\`\`\`bash
# Logs da aplicação
docker logs impa-ai_impa-ai_1

# Logs do banco
docker logs impa-ai_postgres_1
\`\`\`

#### 6.3 Teste de Conectividade
\`\`\`bash
# Verificar se a aplicação responde
curl http://localhost:3000/api/health

# Deve retornar: {"status": "ok"}
\`\`\`

### **PASSO 7: Primeiro Acesso** 🎉

#### 7.1 Acessar Sistema
1. Abra o navegador
2. Acesse: `http://localhost:3000`
3. **Login padrão**:
   - **Email**: `admin@impa.ai`
   - **Senha**: `admin123`

#### 7.2 Alterar Senha (IMPORTANTE!)
1. Após login, vá para **Configurações**
2. Clique em **"Alterar Senha"**
3. **ALTERE** a senha padrão imediatamente!

#### 7.3 Verificar Funcionalidades
- ✅ Dashboard carrega
- ✅ Menu lateral funciona
- ✅ Páginas de usuários, agentes, WhatsApp abrem
- ✅ Configurações acessíveis

## 🔧 **Configurações Avançadas (Opcional)**

### Adicionar Variáveis Opcionais

Se precisar de funcionalidades avançadas:

1. No Portainer, vá para **Stacks → impa-ai**
2. Clique em **"Editor"**
3. Role até **Environment variables**
4. Adicione:
   \`\`\`yaml
   SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long
   \`\`\`
5. Clique em **"Update the stack"**

### Usar Schema Customizado

Para organizar melhor o banco:

1. No Supabase, crie um novo schema:
   \`\`\`sql
   CREATE SCHEMA impa_production;
   \`\`\`
2. No Portainer, altere:
   \`\`\`yaml
   POSTGRES_SCHEMA: impa_production
   \`\`\`
3. Execute novamente os SQLs no novo schema

## 🚨 **Troubleshooting**

### Problema: Aplicação não inicia
\`\`\`bash
# Verificar logs
docker logs impa-ai_impa-ai_1

# Problemas comuns:
# - NEXTAUTH_SECRET inválido
# - SUPABASE_URL incorreta  
# - Banco não conecta
\`\`\`

### Problema: Erro de conexão com banco
\`\`\`bash
# Verificar se postgres está rodando
docker logs impa-ai_postgres_1

# Testar conexão
docker exec -it impa-ai_postgres_1 psql -U impa_user -d impa_ai
\`\`\`

### Problema: Porta já em uso
\`\`\`bash
# Verificar porta
netstat -tulpn | grep :3000

# Alterar porta no Portainer:
APP_PORT: 3001  # Usar porta diferente
\`\`\`

### Problema: Imagem não encontrada
\`\`\`bash
# Verificar se imagem existe
docker images | grep impa-ai

# Se não existir, fazer build novamente
docker build -t impa-ai:latest .
\`\`\`

## 📊 **Monitoramento**

### Verificar Status
\`\`\`bash
# Status dos containers
docker ps | grep impa

# Uso de recursos
docker stats impa-ai_impa-ai_1 impa-ai_postgres_1

# Logs em tempo real
docker logs -f impa-ai_impa-ai_1
\`\`\`

### Health Checks
\`\`\`bash
# Aplicação
curl http://localhost:3000/api/health

# Banco de dados
docker exec impa-ai_postgres_1 pg_isready -U impa_user -d impa_ai
\`\`\`

## 🔄 **Backup e Manutenção**

### Backup do Banco
\`\`\`bash
# Backup completo
docker exec impa-ai_postgres_1 pg_dump -U impa_user impa_ai > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compactado
docker exec impa-ai_postgres_1 pg_dump -U impa_user impa_ai | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
\`\`\`

### Restore do Banco
\`\`\`bash
# Restore
docker exec -i impa-ai_postgres_1 psql -U impa_user impa_ai < backup.sql
\`\`\`

### Atualizar Sistema
\`\`\`bash
# 1. Backup
docker exec impa-ai_postgres_1 pg_dump -U impa_user impa_ai > backup_before_update.sql

# 2. Parar stack
# No Portainer: Stacks → impa-ai → Stop

# 3. Atualizar código e rebuild
git pull origin main
docker build -t impa-ai:latest .

# 4. Restart stack  
# No Portainer: Stacks → impa-ai → Start
\`\`\`

## 📞 **Suporte**

### Informações para Suporte
Ao reportar problemas, inclua:

\`\`\`bash
# Versão do Docker
docker --version

# Logs da aplicação
docker logs impa-ai_impa-ai_1 --tail=50

# Logs do banco
docker logs impa-ai_postgres_1 --tail=50

# Status dos containers
docker ps | grep impa

# Configuração da stack (sem senhas)
\`\`\`

## 🎉 **Conclusão**

Seguindo este passo a passo, você terá:

- ✅ **Supabase** configurado com todas as tabelas
- ✅ **Portainer** com volumes e redes criados  
- ✅ **Stack** rodando com PostgreSQL + IMPA AI
- ✅ **Sistema** acessível em http://localhost:3000
- ✅ **Backup** e monitoramento configurados

**🚀 Sua instalação Docker do IMPA AI está completa e funcionando!**

### Próximos Passos:
1. **Altere a senha padrão** imediatamente
2. **Configure integrações** (Evolution API, n8n)
3. **Crie seus primeiros agentes** de IA
4. **Configure WhatsApp** para seus usuários

**Bem-vindo ao IMPA AI!** 🎊
