# 🐳 Configuração Docker para IMPA AI

## 📋 Pré-requisitos

- Docker Swarm configurado
- Portainer instalado
- Rede `ImpaServer` criada
- Traefik configurado (para SSL automático)

## 🚀 Instalação no Portainer

### 1. Criar Volumes Externos

No Portainer, vá em **Volumes** e crie:

\`\`\`bash
# Volume para dados do PostgreSQL
impa_postgres_data

# Volume para node_modules (desenvolvimento)
impa_node_modules
\`\`\`

### 2. Criar Rede Externa

No Portainer, vá em **Networks** e crie:

\`\`\`bash
# Nome da rede
ImpaServer
\`\`\`

### 3. Configurar Variáveis de Ambiente

No Portainer, ao criar a stack, configure as seguintes variáveis:

#### 🔐 Obrigatórias
- `POSTGRES_PASSWORD`: Senha do PostgreSQL
- `NEXTAUTH_SECRET`: Secret para autenticação
- `DOMAIN`: Seu domínio (ex: impa.seudominio.com)

#### 🔗 Integrações
- `EVOLUTION_API_URL`: URL da Evolution API
- `EVOLUTION_API_KEY`: Chave da Evolution API
- `N8N_URL`: URL do N8N
- `N8N_API_KEY`: Chave do N8N

#### 🤖 IA (Opcional)
- `OPENAI_API_KEY`: Chave da OpenAI
- `ELEVENLABS_API_KEY`: Chave do ElevenLabs
- `FISH_AUDIO_API_KEY`: Chave do Fish Audio

### 4. Deploy da Stack

1. No Portainer, vá em **Stacks**
2. Clique em **Add Stack**
3. Cole o conteúdo do `docker-compose.yml`
4. Configure as variáveis de ambiente
5. Clique em **Deploy the stack**

## 🏗️ Opções de Deploy

### Desenvolvimento (com código local)
Use `docker-compose.yml` - monta o código local e instala dependências na inicialização.

### Produção (com imagem)
1. Faça build da imagem:
   \`\`\`bash
   chmod +x scripts/build-docker.sh
   ./scripts/build-docker.sh
   \`\`\`
2. Use `docker-compose.production.yml`

## 🔧 Configurações Avançadas

### SSL Automático com Traefik

As labels do Traefik estão configuradas para:
- Gerar certificado SSL automaticamente
- Redirecionar HTTP para HTTPS
- Usar o domínio configurado

### Recursos e Limites

Configurados para:
- **CPU**: 0.5-2 cores
- **Memória**: 512MB-2GB
- **Réplicas**: 1 (pode ser aumentado)

### Volumes Persistentes

- `impa_postgres_data`: Dados do banco
- `impa_node_modules`: Cache de dependências

## 🔍 Monitoramento

### Logs da Aplicação
\`\`\`bash
docker service logs impa-ai_impa-ai -f
\`\`\`

### Logs do Banco
\`\`\`bash
docker service logs impa-ai_postgres -f
\`\`\`

### Status dos Serviços
\`\`\`bash
docker service ls
\`\`\`

## 🛠️ Troubleshooting

### Aplicação não inicia
1. Verifique as variáveis de ambiente
2. Verifique se o banco está acessível
3. Verifique os logs da aplicação

### Banco não conecta
1. Verifique a senha do PostgreSQL
2. Verifique se o volume foi criado
3. Verifique se a rede está configurada

### SSL não funciona
1. Verifique se o Traefik está rodando
2. Verifique se o domínio aponta para o servidor
3. Verifique as labels do Traefik

## 📊 Backup

### Backup do Banco
\`\`\`bash
# Entrar no container do PostgreSQL
docker exec -it $(docker ps -q -f name=postgres) bash

# Fazer backup
pg_dump -U impa_user impa_ai > backup.sql
\`\`\`

### Restaurar Backup
\`\`\`bash
# Restaurar backup
psql -U impa_user impa_ai < backup.sql
\`\`\`

## 🔄 Atualizações

### Atualizar Aplicação
1. Faça pull do código atualizado
2. Rebuild da imagem (se usando produção)
3. Atualize a stack no Portainer

### Atualizar Banco
1. Faça backup antes
2. Execute migrations se necessário
3. Teste a aplicação

## 📞 Suporte

Para problemas com Docker:
- Verifique logs dos containers
- Verifique configuração de rede
- Verifique variáveis de ambiente
- Consulte documentação do Portainer
