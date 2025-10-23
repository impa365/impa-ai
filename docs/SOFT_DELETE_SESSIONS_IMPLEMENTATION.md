# Implementação: Soft Delete para Sessões de Bots Uazapi

## 📋 Resumo

Implementado sistema de **4 estados** para sessões de bots, com **soft delete** para evitar duplicação e permitir histórico completo.

---

## 🎯 4 Estados das Sessões

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

---

## 🗄️ Mudanças no Banco de Dados

### 1. Novo Campo
```sql
ALTER TABLE impaai.bot_sessions 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;
```

### 2. Constraint Único (Evita Duplicação)
```sql
CREATE UNIQUE INDEX idx_bot_sessions_unique_active 
ON impaai.bot_sessions("remoteJid", bot_id) 
WHERE deleted_at IS NULL;
```

**Benefício**: Garante que apenas 1 sessão ativa pode existir por `(remoteJid, bot_id)`. Sessões inativas não contam para o constraint.

### 3. Índices de Performance
```sql
-- Queries rápidas para sessões ativas
CREATE INDEX idx_bot_sessions_not_deleted 
ON impaai.bot_sessions(bot_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Queries rápidas para job de limpeza
CREATE INDEX idx_bot_sessions_cleanup 
ON impaai.bot_sessions(deleted_at) 
WHERE deleted_at IS NOT NULL;
```

### 4. Função de Limpeza Automática
```sql
CREATE OR REPLACE FUNCTION impaai.cleanup_old_deleted_sessions()
RETURNS TABLE(deleted_count INTEGER) 
LANGUAGE plpgsql
AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM impaai.bot_sessions
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  RAISE NOTICE 'Limpeza de sessões: % registros apagados', rows_deleted;
  
  RETURN QUERY SELECT rows_deleted;
END;
$$;
```

---

## 🔧 Mudanças no Backend (API)

### 1. GET `/api/bot-sessions`
**Antes:**
```typescript
let query = `${supabaseUrl}/rest/v1/bot_sessions?select=*`
```

**Depois:**
```typescript
// Filtrar apenas sessões ATIVAS (deleted_at IS NULL)
let query = `${supabaseUrl}/rest/v1/bot_sessions?select=*&deleted_at=is.null`
```

**Impacto**: Sessões inativas **não aparecem mais no painel**.

---

### 2. POST `/api/bot-sessions`
**Antes:**
```typescript
const existingSessionResponse = await fetch(
  `${supabaseUrl}/rest/v1/bot_sessions?select=*&remoteJid=eq.${remoteJid}`
)
```

**Depois:**
```typescript
// Verificar apenas sessões ATIVAS
const existingSessionResponse = await fetch(
  `${supabaseUrl}/rest/v1/bot_sessions?select=*&remoteJid=eq.${remoteJid}&deleted_at=is.null`
)
```

**Impacto**: Permite recriar sessões para o mesmo `remoteJid` após inativar a anterior (novo `sessionId`).

---

### 3. DELETE `/api/bot-sessions/[sessionId]`
**Antes (Hard Delete):**
```typescript
const deleteResponse = await fetch(
  `${supabaseUrl}/rest/v1/bot_sessions?sessionId=eq.${sessionId}`,
  {
    method: "DELETE",
    headers: headersWithSchema,
  }
)
```

**Depois (Soft Delete):**
```typescript
// SOFT DELETE: Marcar como inativa ao invés de deletar
const deleteResponse = await fetch(
  `${supabaseUrl}/rest/v1/bot_sessions?sessionId=eq.${sessionId}`,
  {
    method: "PATCH",
    headers: { ...headersWithSchema, Prefer: "return=representation" },
    body: JSON.stringify({
      deleted_at: new Date().toISOString(),
      status: false,
    }),
  }
)
```

**Impacto**: 
- Sessão não é apagada imediatamente
- Mantida no BD por 30 dias
- Não aparece mais no painel
- Usuário pode criar nova sessão para o mesmo chat

---

## 📦 Mudanças nos Helpers (`lib/bot-session-helpers.ts`)

### Todas as funções agora filtram `deleted_at IS NULL`:

1. **`isBotActiveForChat()`**
   ```typescript
   const sessionResponse = await fetch(
     `${supabaseUrl}/rest/v1/bot_sessions?select=status&remoteJid=eq.${remoteJid}&bot_id=eq.${botId}&deleted_at=is.null`
   )
   ```

2. **`createOrUpdateSession()`**
   ```typescript
   const existingSessionResponse = await fetch(
     `${supabaseUrl}/rest/v1/bot_sessions?select=*&remoteJid=eq.${remoteJid}&bot_id=eq.${botId}&deleted_at=is.null`
   )
   ```

3. **`getSessionsByBot()`**
   ```typescript
   let query = `${supabaseUrl}/rest/v1/bot_sessions?select=*&bot_id=eq.${botId}&deleted_at=is.null`
   ```

---

## 📝 Mudanças no TypeScript

### Atualização de Interfaces

**`lib/bot-session-helpers.ts`** e **`types/bot.ts`**:
```typescript
export interface BotSession {
  sessionId: string
  remoteJid: string
  status: boolean
  ultimo_status: string
  criado_em: string
  bot_id: string
  connection_id: string
  deleted_at: string | null  // ← NOVO CAMPO
}
```

---

## 🔄 Job de Limpeza Automática

### Executar Manualmente
```sql
SELECT * FROM impaai.cleanup_old_deleted_sessions();
```

### Agendar (Recomendado)

**Opção 1: Via n8n**
1. Criar workflow com "Schedule Trigger"
2. Frequência: Mensal (dia 1 às 03:00)
3. Node HTTP Request ou PostgreSQL para executar a função

**Opção 2: Via Supabase Edge Function**
```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data } = await supabase.rpc('cleanup_old_deleted_sessions')
  
  return new Response(JSON.stringify({ 
    deleted: data?.[0]?.deleted_count || 0 
  }))
})
```

**Opção 3: Via pg_cron (se disponível no Supabase)**
```sql
SELECT cron.schedule(
  'cleanup-deleted-sessions',
  '0 3 1 * *',  -- Todo dia 1 às 03:00
  'SELECT impaai.cleanup_old_deleted_sessions();'
);
```

---

## ✅ Benefícios da Implementação

### 🛡️ Integridade de Dados
- ✅ Constraint único garante **não duplicação**
- ✅ Partial index afeta apenas sessões ativas
- ✅ Permite recriar sessões após inativar

### 🚀 Performance
- ✅ Partial indexes são **extremamente rápidos**
- ✅ Queries sempre filtradas (`deleted_at IS NULL`)
- ✅ Limpeza periódica mantém tabela enxuta

### 📊 Auditoria
- ✅ Histórico completo de sessões (30 dias)
- ✅ Sabe quando foi criada, usada, inativada
- ✅ Pode rastrear comportamento dos usuários

### 🔒 Segurança
- ✅ Não perde dados acidentalmente
- ✅ Recuperação possível dentro de 30 dias
- ✅ Limpeza automática evita acúmulo infinito

---

## 📂 Arquivos Modificados

### Banco de Dados
- ✅ `database/add_soft_delete_to_bot_sessions.sql` - Script SQL completo

### Backend (API)
- ✅ `app/api/bot-sessions/route.ts` - GET, POST
- ✅ `app/api/bot-sessions/[sessionId]/route.ts` - PUT, DELETE

### Helpers
- ✅ `lib/bot-session-helpers.ts` - Funções auxiliares

### TypeScript
- ✅ `types/bot.ts` - Interface `BotSession`

### Documentação
- ✅ `docs/BOT_SESSIONS_SYSTEM.md` - Documentação completa
- ✅ `docs/SOFT_DELETE_SESSIONS_IMPLEMENTATION.md` - Este arquivo

---

## 🧪 Testar a Implementação

### 1. Verificar estrutura da tabela
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'impaai' AND table_name = 'bot_sessions'
ORDER BY ordinal_position;
```

### 2. Testar soft delete
```typescript
// Frontend: Clicar em "Deletar" uma sessão no painel
// Backend verifica:
DELETE /api/bot-sessions/[sessionId]

// Verificar no banco:
SELECT "sessionId", "remoteJid", status, deleted_at 
FROM impaai.bot_sessions 
WHERE "sessionId" = 'uuid-da-sessao';
-- Deve mostrar deleted_at preenchido e status = false
```

### 3. Verificar que não aparece no painel
```typescript
// Frontend: Atualizar lista de sessões
// Backend: GET /api/bot-sessions
// Resultado: Sessão inativa não deve aparecer
```

### 4. Testar recriação
```typescript
// Frontend: Criar nova sessão para o mesmo remoteJid + bot_id
// Backend: POST /api/bot-sessions
// Resultado: Sucesso (nova sessão criada com novo sessionId)
```

### 5. Testar job de limpeza
```sql
-- Criar sessão de teste com deleted_at antigo
INSERT INTO impaai.bot_sessions 
("remoteJid", bot_id, connection_id, status, deleted_at)
VALUES 
('5511999999999@s.whatsapp.net', 'bot-uuid', 'conn-uuid', false, NOW() - INTERVAL '31 days');

-- Executar limpeza
SELECT * FROM impaai.cleanup_old_deleted_sessions();
-- Deve retornar deleted_count = 1

-- Verificar que foi apagado
SELECT * FROM impaai.bot_sessions WHERE deleted_at < NOW() - INTERVAL '30 days';
-- Deve retornar vazio
```

---

## 🎉 Conclusão

Sistema de **4 estados** implementado com sucesso! 

As sessões agora:
- ✅ Não aparecem no painel quando "deletadas" (inativas)
- ✅ São mantidas no BD por 30 dias (histórico)
- ✅ Não causam duplicação (constraint único)
- ✅ São limpas automaticamente após 30 dias

**Próximo passo**: Configurar job de limpeza mensal via n8n ou Supabase Edge Functions.

