# Sistema de Sessões de Bots Uazapi

## Visão Geral

O sistema de sessões permite controlar se um bot está ativo ou pausado para chats específicos. Funciona de forma similar ao EvolutionBot da Evolution API, mas armazenando as sessões na tabela `impaai.bot_sessions` do Supabase.

## Estrutura da Tabela

```sql
CREATE TABLE impaai.bot_sessions (
  "sessionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "remoteJid" TEXT NOT NULL,           -- Ex: 5511999999999@s.whatsapp.net
  status BOOLEAN DEFAULT true,          -- true = bot ativo, false = bot pausado
  ultimo_status TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bot_id UUID NOT NULL REFERENCES impaai.bots(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE NULL  -- NULL = visível, timestamp = inativa (soft delete)
);

-- Constraint único: apenas UMA sessão ativa por (remoteJid + bot_id)
CREATE UNIQUE INDEX idx_bot_sessions_unique_active 
ON impaai.bot_sessions("remoteJid", bot_id) 
WHERE deleted_at IS NULL;
```

## 4 Estados das Sessões

O sistema gerencia 4 estados distintos para as sessões:

### 1. **ATIVADA** (Padrão)
- `status = true`
- `deleted_at = NULL`
- ✅ Visível no painel
- ✅ Bot está ativo para o chat

### 2. **PAUSADA**
- `status = false`
- `deleted_at = NULL`
- ✅ Visível no painel
- ⏸️ Bot está pausado para o chat

### 3. **INATIVA** (Soft Delete)
- `deleted_at = timestamp`
- `status = false`
- ❌ **Oculta do painel** (não aparece nas listagens)
- 💾 Mantida no banco de dados para histórico
- ⏳ Será apagada fisicamente após 30 dias

### 4. **APAGADA** (Hard Delete)
- Registro deletado fisicamente do banco
- 🗑️ Ocorre automaticamente após 30 dias de inativação
- Executado pelo job de limpeza: `SELECT * FROM impaai.cleanup_old_deleted_sessions()`

## Lógica de Funcionamento

### Comportamento Padrão
- **Sem sessão cadastrada**: Bot está **ativo** para o chat
- **Sessão com `status = true`**: Bot está **ativo** para o chat
- **Sessão com `status = false`**: Bot está **pausado** para o chat

### Quando Criar Sessões

As sessões devem ser criadas automaticamente quando:
1. **Bot responde pela primeira vez** a um chat
2. **Usuário pausa manualmente** o bot para um chat
3. **Usuário reativa manualmente** o bot para um chat

## API Endpoints

### 1. Listar Sessões

```http
GET /api/bot-sessions
Query params:
  - bot_id: UUID (opcional)
  - connection_id: UUID (opcional)
  - remoteJid: string (opcional)
  - status: boolean (opcional)
```

**Resposta**:
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "uuid",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "status": true,
      "ultimo_status": "2025-10-20T17:35:49.695337+00",
      "criado_em": "2025-10-20T17:35:49.695337+00",
      "bot_id": "uuid",
      "connection_id": "uuid"
    }
  ],
  "count": 1
}
```

### 2. Criar/Atualizar Sessão

```http
POST /api/bot-sessions
Body:
{
  "bot_id": "uuid",
  "connection_id": "uuid",
  "remoteJid": "5511999999999@s.whatsapp.net",
  "status": true  // opcional, padrão: true
}
```

**Comportamento**:
- Se já existir sessão para este `remoteJid` + `bot_id`: **atualiza**
- Se não existir: **cria nova**

**Resposta**:
```json
{
  "success": true,
  "session": { ... },
  "message": "Sessão criada com sucesso"
}
```

### 3. Atualizar Sessão (Pausar/Reativar)

```http
PUT /api/bot-sessions/[sessionId]
Body:
{
  "status": false  // false = pausar, true = reativar
}
```

**Resposta**:
```json
{
  "success": true,
  "session": { ... },
  "message": "Bot pausado para este chat"
}
```

### 4. Inativar Sessão (Soft Delete)

```http
DELETE /api/bot-sessions/[sessionId]
```

⚠️ **IMPORTANTE**: Este endpoint faz **soft delete**:
- Define `deleted_at = timestamp`
- Define `status = false`
- Sessão **não aparece mais no painel**
- Sessão **permanece no banco** por 30 dias
- Após 30 dias, será apagada fisicamente por job de limpeza

**Resposta**:
```json
{
  "success": true,
  "message": "Sessão marcada como inativa (não aparecerá mais no painel)",
  "session": {
    "sessionId": "uuid",
    "deleted_at": "2025-10-20T15:30:00.000Z",
    "status": false
  }
}
```

## Helper Functions

### `createOrUpdateSession()`

Cria ou atualiza uma sessão automaticamente:

```typescript
import { createOrUpdateSession } from "@/lib/bot-session-helpers"

const result = await createOrUpdateSession({
  botId: "uuid-do-bot",
  connectionId: "uuid-da-conexao",
  remoteJid: "5511999999999@s.whatsapp.net",
  status: true,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_ANON_KEY!,
})

if (result.success) {
  console.log("Sessão criada:", result.session)
}
```

### `isBotActiveForChat()`

Verifica se o bot está ativo para um chat:

```typescript
import { isBotActiveForChat } from "@/lib/bot-session-helpers"

const isActive = await isBotActiveForChat({
  botId: "uuid-do-bot",
  remoteJid: "5511999999999@s.whatsapp.net",
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_ANON_KEY!,
})

if (!isActive) {
  console.log("Bot está pausado para este chat")
  return // Não processar mensagem
}
```

### `pauseBotForChat()` e `resumeBotForChat()`

Pausa ou reativa o bot para um chat:

```typescript
import { pauseBotForChat, resumeBotForChat } from "@/lib/bot-session-helpers"

// Pausar
await pauseBotForChat({
  botId: "uuid",
  connectionId: "uuid",
  remoteJid: "5511999999999@s.whatsapp.net",
  supabaseUrl,
  supabaseKey,
})

// Reativar
await resumeBotForChat({
  botId: "uuid",
  connectionId: "uuid",
  remoteJid: "5511999999999@s.whatsapp.net",
  supabaseUrl,
  supabaseKey,
})
```

## Integração com Webhook Uazapi

### No n8n - Verificar Status Antes de Processar

No início do workflow n8n, antes de enviar para a IA:

```javascript
// Node "Verificar Status do Bot"
const botId = $('dados').item.json.botId;
const remoteJid = $('dados').item.json.remoteJid;

// Buscar sessão no Supabase
const supabaseUrl = 'https://seu-projeto.supabase.co';
const supabaseKey = 'sua-anon-key';

const response = await fetch(
  `${supabaseUrl}/rest/v1/bot_sessions?select=status&remoteJid=eq.${remoteJid}&bot_id=eq.${botId}`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept-Profile': 'impaai',
      'Content-Profile': 'impaai',
    }
  }
);

const sessions = await response.json();

// Se não houver sessão, bot está ativo
if (!sessions || sessions.length === 0) {
  return [{ json: { botActive: true } }];
}

// Se houver sessão, verificar status
const botActive = Boolean(sessions[0].status);
return [{ json: { botActive } }];
```

### Criar Sessão ao Responder

Quando o bot responder pela primeira vez, criar sessão:

```javascript
// Node "Criar Sessão" (após enviar resposta)
const botId = $('dados').item.json.botId;
const connectionId = $('dados').item.json.connectionId;
const remoteJid = $('dados').item.json.remoteJid;

const baseUrl = 'https://seu-dominio.com';

await fetch(`${baseUrl}/api/bot-sessions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bot_id: botId,
    connection_id: connectionId,
    remoteJid: remoteJid,
    status: true
  })
});
```

## Interface no Painel (Futuro)

### Página de Sessões do Bot

Em `app/dashboard/agents/[id]/sessions/page.tsx`:

```typescript
// Listar sessões do bot
const response = await fetch(`/api/bot-sessions?bot_id=${agentId}`)
const { sessions } = await response.json()

// Pausar bot para um chat
await fetch(`/api/bot-sessions/${sessionId}`, {
  method: 'PUT',
  body: JSON.stringify({ status: false })
})

// Reativar bot para um chat
await fetch(`/api/bot-sessions/${sessionId}`, {
  method: 'PUT',
  body: JSON.stringify({ status: true })
})
```

## Comandos Especiais (Futuro)

Permitir que usuários pausem o bot via mensagem:

```javascript
// No n8n, verificar se mensagem é "#parar" ou "#sair"
const message = $('dados').item.json.message.toLowerCase();

if (message === '#parar' || message === '#sair') {
  // Pausar bot
  await fetch(`${baseUrl}/api/bot-sessions`, {
    method: 'POST',
    body: JSON.stringify({
      bot_id: botId,
      connection_id: connectionId,
      remoteJid: remoteJid,
      status: false
    })
  });
  
  // Enviar mensagem de confirmação
  return [{
    json: {
      message: "Bot pausado. Para reativar, envie '#ativar'",
      pauseBot: true
    }
  }];
}

if (message === '#ativar') {
  // Reativar bot
  await fetch(`${baseUrl}/api/bot-sessions`, {
    method: 'POST',
    body: JSON.stringify({
      bot_id: botId,
      connection_id: connectionId,
      remoteJid: remoteJid,
      status: true
    })
  });
  
  return [{
    json: {
      message: "Bot reativado!",
      resumeBot: true
    }
  }];
}
```

## Segurança

### Validações Implementadas

✅ Usuários só podem gerenciar sessões de seus próprios bots
✅ Admins podem gerenciar todas as sessões
✅ Validação de permissões em todos os endpoints
✅ Autenticação via cookie

### Recomendações

- Usar HTTPS em produção
- Não expor `sessionId` publicamente
- Validar `remoteJid` no formato correto
- Limitar taxa de requisições (rate limiting)

## Diferenças vs EvolutionBot

| Recurso | EvolutionBot (Evolution API) | Sistema de Sessões (Uazapi) |
|---------|------------------------------|------------------------------|
| Armazenamento | Interno no Evolution | Supabase (impaai.bot_sessions) |
| Controle | Via Evolution API | Via API própria |
| Webhooks | Nativo | Via n8n |
| Comandos | Nativo (#parar, #ativar) | Implementação manual |
| Interface | Via Evolution | A ser criada |

## Job de Limpeza Automática

### Função: `cleanup_old_deleted_sessions()`

Remove fisicamente do banco de dados sessões marcadas como inativas há mais de 30 dias.

**Executar manualmente**:
```sql
SELECT * FROM impaai.cleanup_old_deleted_sessions();
```

**Resposta**:
```sql
deleted_count
-------------
5
```

### Agendamento Recomendado

Configure um cron job para executar mensalmente:

**Opção 1: Via n8n**
1. Criar workflow com trigger "Schedule Trigger"
2. Frequência: Uma vez por mês (dia 1 às 03:00)
3. Node HTTP Request para executar a função

**Opção 2: Via Supabase Edge Functions**
```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase
    .rpc('cleanup_old_deleted_sessions')

  return new Response(JSON.stringify({ 
    deleted: data?.[0]?.deleted_count || 0 
  }))
})
```

**Opção 3: Via PostgreSQL pg_cron**
```sql
-- Instalar extensão (se disponível)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar para todo dia 1 às 03:00
SELECT cron.schedule(
  'cleanup-deleted-sessions',
  '0 3 1 * *',
  'SELECT impaai.cleanup_old_deleted_sessions();'
);
```

## Próximos Passos

1. ✅ Criar API endpoints
2. ✅ Criar helper functions
3. ✅ Implementar soft delete (4 estados)
4. ✅ Criar função de limpeza automática
5. ⏳ Integrar com webhook Uazapi no n8n
6. ⏳ Criar interface no painel
7. ⏳ Implementar comandos especiais
8. ⏳ Adicionar analytics de sessões

## Arquivos Criados

- `app/api/bot-sessions/route.ts` - GET, POST
- `app/api/bot-sessions/[sessionId]/route.ts` - PUT, DELETE
- `lib/bot-session-helpers.ts` - Helper functions
- `docs/BOT_SESSIONS_SYSTEM.md` - Esta documentação

