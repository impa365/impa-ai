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

# 3. Criar rede
docker network create ImpaServer

# 4. Subir os serviços
docker-compose up -d
\`\`\`

### Método 2: Portainer Stack

## 🎛️ Configuração no Portainer

### 1. Preparar Volumes e Rede

No Portainer, vá para **Volumes** e crie:
- `postgres_data`
- `impa_uploads`

Vá para **Networks** e crie:
- `ImpaServer` (bridge)

### 2. Criar Stack

1. Vá para **Stacks** → **Add Stack**
2. Nome: `impa-ai`
3. Cole o conteúdo do arquivo `portainer-stack.yml`

### 3. Configurar Variáveis de Ambiente

No Portainer, configure estas variáveis:

## 🔧 **VARIÁVEIS OBRIGATÓRIAS**

#### 🐘 **Banco de Dados**
| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `POSTGRES_USER` | `impa_user` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | *(sem padrão)* | **OBRIGATÓRIA** - Senha do PostgreSQL |
| `POSTGRES_DATABASE` | `impa_ai` | Nome do banco de dados |
| `POSTGRES_SCHEMA` | `public` | Schema do banco (pode alterar se quiser) |

#### 🚀 **Aplicação**
| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `DOCKER_IMAGE` | `impa-ai:latest` | Imagem Docker da aplicação |
| `APP_PORT` | `3000` | Porta da aplicação no host |

#### 🔐 **Supabase (Obrigatórias)**
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `SUPABASE_URL` | `https://abcdefgh.supabase.co` | **OBRIGATÓRIA** - URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | **OBRIGATÓRIA** - Chave pública do Supabase |

#### 🔑 **Autenticação**
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `NEXTAUTH_URL` | `http://localhost:3000` | **OBRIGATÓRIA** - URL completa da aplicação |
| `NEXTAUTH_SECRET` | *(gerar automaticamente)* | **OBRIGATÓRIA** - Segredo para criptografia de sessões |

## ⚙️ **VARIÁVEIS OPCIONAIS**

#### 🔐 **Supabase Avançado (Opcional)**
| Variável | Quando Usar | Descrição |
|----------|-------------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Operações admin, uploads, bypass RLS | Chave de serviço (deixe vazio se não usar) |
| `SUPABASE_JWT_SECRET` | Validação manual de JWT | Segredo JWT (deixe vazio se não usar) |

### 📋 **Como obter as informações:**

#### **Supabase (Obrigatórias):**
1. Acesse: https://app.supabase.com
2. Vá para **Settings → API**
3. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`

#### **Supabase (Opcionais):**
4. Se precisar de funcionalidades avançadas:
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
5. Vá para **Settings → API → JWT Settings**
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

#### **NEXTAUTH_SECRET:**
\`\`\`bash
# Gerar automaticamente (recomendado):
openssl rand -base64 32

# Ou use qualquer string de 32+ caracteres:
# Exemplo: meu-nextauth-secret-super-seguro-12345678
\`\`\`

## 🎯 **Configuração Mínima (Recomendada)**

Para começar rapidamente, configure apenas:

\`\`\`yaml
# OBRIGATÓRIAS
POSTGRES_PASSWORD: "MinhaSenh@Segura123"
SUPABASE_URL: "https://seuproject.supabase.co"
SUPABASE_ANON_KEY: "sua-anon-key-aqui"
NEXTAUTH_URL: "http://localhost:3000"
NEXTAUTH_SECRET: "resultado-do-openssl-rand-base64-32"

# OPCIONAIS (usar padrões)
POSTGRES_USER: "impa_user"
POSTGRES_DATABASE: "impa_ai"
POSTGRES_SCHEMA: "public"
DOCKER_IMAGE: "impa-ai:latest"
APP_PORT: "3000"

# DEIXAR VAZIO (adicionar depois se precisar)
SUPABASE_SERVICE_ROLE_KEY: ""
SUPABASE_JWT_SECRET: ""
\`\`\`

## ❓ **Sobre o NEXTAUTH_SECRET:**

### **É REALMENTE NECESSÁRIO? SIM! ✅**

O `NEXTAUTH_SECRET` é **obrigatório** porque:
- 🔐 Criptografa cookies de sessão
- 🛡️ Protege tokens de autenticação  
- 🔑 Assina JWTs internos
- ⚠️ **Sem ele, a autenticação não funciona!**

### **Como gerar:**
\`\`\`bash
# Método 1: OpenSSL (recomendado)
openssl rand -base64 32

# Método 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Método 3: Online (use com cuidado)
# https://generate-secret.vercel.app/32
\`\`\`

### **Exemplo de resultado:**
\`\`\`
K7+x9QmP8vF2nR5tY8uI3oA6sD9gH1jL4mN7pQ0wE2r=
\`\`\`

## 🔄 **Quando usar as opcionais:**

### **SUPABASE_SERVICE_ROLE_KEY** - Use SE:
- ✅ Deletar usuários pelo painel admin
- ✅ Upload de arquivos (Storage)
- ✅ Operações que precisam bypass RLS
- ✅ Integrações avançadas

### **SUPABASE_JWT_SECRET** - Use SE:
- ✅ Validação manual de tokens
- ✅ Autenticação customizada
- ✅ Integração com APIs externas

### **POSTGRES_SCHEMA** - Altere SE:
- ✅ Quer organizar tabelas em schemas separados
- ✅ Ambiente multi-tenant
- ✅ Separação por módulos
- 📝 **Padrão "public" funciona para 99% dos casos**

## 🚀 **Deploy da Stack**

1. Configure as **variáveis obrigatórias**
2. Deixe as **opcionais vazias** (por enquanto)
3. Clique em **Deploy the stack**
4. Aguarde o download das imagens
5. Verifique se todos os serviços estão rodando

## ✅ **Primeiro Teste**

Após o deploy:
\`\`\`bash
# Verificar se está rodando
curl http://localhost:3000/api/health

# Acessar a aplicação
# URL: http://localhost:3000
# Login: admin@impa.ai  
# Senha: admin123
\`\`\`

## 🔧 **Adicionar Opcionais Depois**

Se precisar das funcionalidades avançadas:

1. Vá para **Stacks** → Sua stack
2. **Editor** → Adicione as variáveis opcionais
3. **Update the stack**
4. Reinicie os serviços

## 🎉 **Resumo**

- ✅ **Mínimo**: 5 variáveis obrigatórias
- ⚙️ **Flexível**: Schemas e configurações customizáveis  
- 🔧 **Expansível**: Adicione recursos conforme precisar
- 🛡️ **Seguro**: NEXTAUTH_SECRET protege suas sessões

**Comece simples, evolua conforme a necessidade!** 🚀
