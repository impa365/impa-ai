# 🤖 Integração Agentes ↔ Bots

## 📋 Visão Geral

Este documento descreve como os **Agentes AI** se conectam aos **Bots** para automatizar conversas no WhatsApp.

## 🗄️ Estrutura de Banco de Dados

### Tabela: `ai_agents`

Armazena os agentes de IA configurados pelos usuários.

```sql
CREATE TABLE impaai.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES impaai.user_profiles(id),
  name VARCHAR(255) NOT NULL,
  whatsapp_connection_id UUID REFERENCES impaai.whatsapp_connections(id),
  bot_id UUID REFERENCES impaai.bots(id) ON DELETE SET NULL,  -- ⬅️ VINCULA AO BOT
  prompt TEXT,
  model VARCHAR(100),
  provider VARCHAR(50),
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Campos importantes:**
- `whatsapp_connection_id`: Conexão WhatsApp (Evolution API ou Uazapi)
- `bot_id`: **Bot customizado** que gerencia as mensagens (se Uazapi)

### Tabela: `bots`

Armazena configurações de bots customizados (para Uazapi).

```sql
CREATE TABLE impaai.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES impaai.user_profiles(id),
  whatsapp_connection_id UUID NOT NULL REFERENCES impaai.whatsapp_connections(id),
  instance_name VARCHAR(255) NOT NULL,
  instance_token TEXT NOT NULL,
  webhook_id VARCHAR(255),  -- ID do webhook na Uazapi
  session_url TEXT NOT NULL,  -- URL do webhook N8N
  server_url TEXT NOT NULL,  -- URL do servidor Uazapi
  ignore_jids TEXT DEFAULT '@g.us,',  -- JIDs para ignorar (grupos, etc)
  padrao BOOLEAN DEFAULT false,  -- Se é o bot padrão do agente
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔄 Fluxo de Criação (Uazapi)

Quando um agente é criado com conexão **Uazapi**, o sistema:

### 1. **Cria o Agente** (`ai_agents`)
```typescript
const agentData = {
  name: 'Meu Agente',
  user_id: 'uuid-do-usuario',
  whatsapp_connection_id: 'uuid-da-conexao',
  prompt: 'Você é um assistente...',
  // bot_id: null (ainda não vinculado)
}
```

### 2. **Cria o Bot** (`bots`)
```typescript
const botData = {
  user_id: 'uuid-do-usuario',
  whatsapp_connection_id: 'uuid-da-conexao',
  instance_name: 'auzapi_fernanda',
  instance_token: 'token-da-instancia',
  session_url: 'https://nflow.exemplo.com/webhook/n8n-sessions?botId={botId}',
  server_url: 'https://servidor.uazapi.com',
  ignore_jids: '@g.us,',  // Ignorar grupos
  padrao: false
}
```

### 3. **Cria Webhook na Uazapi**
```typescript
POST https://servidor.uazapi.com/webhook
{
  "action": "add",
  "url": "https://nflow.exemplo.com/webhook/n8n-sessions?botId={botId}",
  "events": ["messages"],
  "excludeMessages": ["wasSentByApi", "isGroupYes"],
  "enabled": true
}

// Resposta: { "id": "r214e59ca8e1bc6" }
```

### 4. **Atualiza o Bot com webhook_id**
```typescript
PATCH /bots?id=eq.{botId}
{
  "webhook_id": "r214e59ca8e1bc6"
}
```

### 5. **Vincula Bot ao Agente** ⬅️ **AQUI ESTAVA FALHANDO!**
```typescript
PATCH /ai_agents?id=eq.{agentId}
{
  "bot_id": "{botId}"
}
```

**Erro anterior:** Coluna `bot_id` não existia na tabela `ai_agents`

## ✅ Solução Aplicada

### Script SQL: `add_bot_id_to_ai_agents.sql`

```sql
-- Adicionar coluna bot_id
ALTER TABLE impaai.ai_agents 
ADD COLUMN bot_id UUID NULL;

-- Adicionar Foreign Key
ALTER TABLE impaai.ai_agents
ADD CONSTRAINT ai_agents_bot_id_fkey 
FOREIGN KEY (bot_id) 
REFERENCES impaai.bots(id) 
ON DELETE SET NULL;

-- Criar índice
CREATE INDEX idx_ai_agents_bot_id 
ON impaai.ai_agents(bot_id) 
WHERE bot_id IS NOT NULL;
```

## 🔄 Rollback em Caso de Erro

Se **qualquer etapa falhar**, o sistema faz rollback completo:

1. ❌ **Deleta o Agente** (`ai_agents`)
2. ❌ **Deleta o Webhook** na Uazapi
3. ❌ **Deleta o Bot** (`bots`)

Isso garante que não ficam registros órfãos no banco.

## 📝 Logs de Debug

```typescript
🔗 [UAZAPI] Vinculando bot ao agente...
📝 [UAZAPI] Atualizando agente {agentId} com bot_id: {botId}
✅ [UAZAPI] Bot vinculado ao agente com sucesso!
```

**Em caso de erro:**
```typescript
❌ [UAZAPI] Erro ao vincular bot - Status: 400
❌ [UAZAPI] Erro detalhado: {"code":"PGRST204","message":"Could not find the 'bot_id' column..."}
```

## 🧪 Como Testar

### 1. Execute os scripts SQL:
```bash
# 1. Adicionar coluna bot_id
database/add_bot_id_to_ai_agents.sql

# 2. Configurar permissões
database/grant_all_permissions_impaai.sql
```

### 2. Crie um agente via interface:
- Nome: "Agente Teste"
- Conexão: Selecione uma conexão Uazapi
- Prompt: "Você é um assistente..."

### 3. Verifique os logs no terminal

### 4. Consulte o banco:
```sql
-- Ver agente com bot vinculado
SELECT 
  a.id as agent_id,
  a.name,
  a.bot_id,
  b.id as bot_id_from_bots,
  b.webhook_id,
  b.instance_name
FROM impaai.ai_agents a
LEFT JOIN impaai.bots b ON a.bot_id = b.id
WHERE a.name = 'Agente Teste';
```

## 🚀 Arquivos Relacionados

- **API Routes:**
  - `app/api/admin/agents/route.ts` (CRUD de agentes - admin)
  - `app/api/user/agents/route.ts` (CRUD de agentes - usuário)
  - `app/api/bots/route.ts` (CRUD de bots)

- **Libraries:**
  - `lib/uazapi-server.ts` (Funções server-side Uazapi)
  - `lib/uazapi-bot-helpers.ts` (Helpers para bots)
  - `lib/uazapi-webhook-helpers.ts` (Gestão de webhooks)

- **Types:**
  - `types/bot.ts` (TypeScript interfaces)

- **Scripts SQL:**
  - `database/add_bot_id_to_ai_agents.sql` (Adicionar coluna bot_id)
  - `database/add_bots_tables.sql` (Criar tabela bots)
  - `database/grant_all_permissions_impaai.sql` (Permissões)

## 🔒 Regras de Negócio

1. **Um agente pode ter 0 ou 1 bot** (`bot_id` é nullable)
2. **Um bot pode estar vinculado a múltiplos agentes** (não há constraint UNIQUE)
3. **Se o bot for deletado, o agente fica com bot_id = NULL** (`ON DELETE SET NULL`)
4. **Apenas conexões Uazapi usam bots customizados** (Evolution API não precisa)

## 📊 Diagrama de Relacionamento

```
user_profiles
     |
     ├─── whatsapp_connections
     |          |
     |          ├─── ai_agents
     |          |        |
     |          |        └─── bots (bot_id)
     |          |
     |          └─── bots (whatsapp_connection_id)
     |
     └─── ai_agents (user_id)
```

## ⚠️ Troubleshooting

### Erro: "Could not find the 'bot_id' column"
**Solução:** Execute `database/add_bot_id_to_ai_agents.sql`

### Erro: "permission denied for table ai_agents"
**Solução:** Execute `database/grant_all_permissions_impaai.sql`

### Erro: "Falha ao criar webhook na Uazapi"
**Verificar:**
- URL do servidor Uazapi está correta?
- Token da instância está válido?
- Instância está conectada?

### Erro: "Falha ao vincular bot ao agente"
**Verificar:**
- Coluna `bot_id` existe na tabela `ai_agents`?
- Foreign key está criada?
- Permissões da `anonkey` estão corretas?

---

**Última atualização:** 2025-10-24

