# 🔧 Correção: Separação de Sessões Uazapi e Evolution API

## 🐛 **Problema Identificado**

As sessões da **Uazapi** estavam aparecendo na página de sessões da **Evolution API**, e vice-versa, causando confusão e mistura de dados de APIs completamente diferentes.

### **Causa Raiz:**

A rota `/api/bot-sessions` estava buscando **TODAS** as sessões de **TODOS** os bots sem filtrar por `bot_id` ou `connection_id`, mesmo recebendo esses parâmetros.

```typescript
// ❌ ANTES (ERRADO)
// app/api/bot-sessions/route.ts - Linha 64
let query = `${supabaseUrl}/rest/v1/bot_sessions?select=*&deleted_at=is.null`
// Buscava TODAS as sessões sem filtro!

// app/admin/agents/[id]/sessions/page.tsx - Linha 75
const response = await fetch(`/api/bot-sessions`)
// Não passava bot_id como parâmetro!
```

## ✅ **Solução Implementada**

### **1. Backend: Adicionar Filtros na API**

**Arquivo:** `app/api/bot-sessions/route.ts`

```typescript
// ✅ DEPOIS (CORRETO)
let query = `${supabaseUrl}/rest/v1/bot_sessions?select=*&deleted_at=is.null`

// Filtros CRÍTICOS para separar Uazapi de Evolution
if (botId) {
  query += `&bot_id=eq.${botId}`
  console.log("🔍 Filtrando por bot_id:", botId)
}
if (connectionId) {
  query += `&connection_id=eq.${connectionId}`
  console.log("🔍 Filtrando por connection_id:", connectionId)
}
```

**Mudanças:**
- ✅ Adicionado filtro `bot_id=eq.${botId}` quando `bot_id` é fornecido
- ✅ Adicionado filtro `connection_id=eq.${connectionId}` quando `connection_id` é fornecido
- ✅ Logs detalhados para debug

### **2. Frontend Admin: Passar bot_id na Chamada**

**Arquivo:** `app/admin/agents/[id]/sessions/page.tsx`

```typescript
// ✅ DEPOIS (CORRETO)
const fetchSessions = async () => {
  try {
    // Construir URL com filtro de bot_id para separar Uazapi de Evolution
    let url = `/api/bot-sessions`
    if (agent?.bot_id) {
      url += `?bot_id=${agent.bot_id}`
      console.log("🔍 Buscando sessões do bot:", agent.bot_id)
    } else if (agent?.whatsapp_connection_id) {
      url += `?connection_id=${agent.whatsapp_connection_id}`
      console.log("🔍 Buscando sessões da conexão:", agent.whatsapp_connection_id)
    }
    
    const response = await fetch(url)
    // ...
  }
}
```

**Mudanças:**
- ✅ Passa `bot_id` como query parameter se disponível
- ✅ Fallback para `connection_id` se `bot_id` não existir
- ✅ Logs detalhados para debug

### **3. Frontend Dashboard: Passar bot_id na Chamada**

**Arquivo:** `app/dashboard/agents/[id]/sessions/page.tsx`

```typescript
// ✅ DEPOIS (CORRETO)
const fetchSessions = async () => {
  try {
    // Construir URL com filtro de bot_id para separar Uazapi de Evolution
    let url = `/api/bot-sessions`
    if (agent?.bot_id) {
      url += `?bot_id=${agent.bot_id}`
      console.log("🔍 Buscando sessões do bot:", agent.bot_id)
    } else if (agent?.whatsapp_connection_id) {
      url += `?connection_id=${agent.whatsapp_connection_id}`
      console.log("🔍 Buscando sessões da conexão:", agent.whatsapp_connection_id)
    }
    
    const response = await fetch(url)
    // ...
  }
}
```

**Mudanças:**
- ✅ Mesma lógica do admin
- ✅ Garante que usuários normais também vejam apenas suas sessões

## 🎯 **Resultado**

### **Antes:**
```
Agente Uazapi (bot_id: abc-123)
  └─ Página de Sessões
      ├─ Sessão 1 (Uazapi) ✅
      ├─ Sessão 2 (Uazapi) ✅
      ├─ Sessão 3 (Evolution) ❌ NÃO DEVERIA APARECER
      └─ Sessão 4 (Evolution) ❌ NÃO DEVERIA APARECER

Agente Evolution (evolution_bot_id: xyz-789)
  └─ Página de Sessões
      ├─ Sessão 1 (Evolution) ✅
      ├─ Sessão 2 (Evolution) ✅
      ├─ Sessão 3 (Uazapi) ❌ NÃO DEVERIA APARECER
      └─ Sessão 4 (Uazapi) ❌ NÃO DEVERIA APARECER
```

### **Depois:**
```
Agente Uazapi (bot_id: abc-123)
  └─ Página de Sessões
      ├─ Sessão 1 (Uazapi) ✅
      └─ Sessão 2 (Uazapi) ✅

Agente Evolution (evolution_bot_id: xyz-789)
  └─ Página de Sessões
      ├─ Sessão 1 (Evolution) ✅
      └─ Sessão 2 (Evolution) ✅
```

## 📊 **Fluxo Corrigido**

```
1. Usuário acessa /admin/agents/[id]/sessions
   ↓
2. Frontend busca dados do agente (bot_id, connection_id)
   ↓
3. Frontend chama /api/bot-sessions?bot_id={bot_id}
   ↓
4. Backend filtra: bot_sessions WHERE bot_id = {bot_id} AND deleted_at IS NULL
   ↓
5. Retorna APENAS sessões do bot específico
   ↓
6. ✅ Sessões Uazapi e Evolution separadas corretamente!
```

## 🔍 **Logs de Debug**

Agora você verá logs detalhados:

```bash
# Frontend
🔍 Buscando sessões do bot: abc-123-def-456

# Backend
📋 Query params recebidos: { botId: 'abc-123-def-456', connectionId: null, remoteJid: null, status: null }
🔍 Filtrando por bot_id: abc-123-def-456
🔍 Buscando sessões ativas na tabela impaai.bot_sessions: https://...?bot_id=eq.abc-123-def-456&deleted_at=is.null
✅ 5 sessões encontradas
```

## 📝 **Arquivos Modificados**

- ✅ `app/api/bot-sessions/route.ts` - Backend: Filtros adicionados
- ✅ `app/admin/agents/[id]/sessions/page.tsx` - Admin: Passa bot_id
- ✅ `app/dashboard/agents/[id]/sessions/page.tsx` - User: Passa bot_id
- ✅ `docs/BOT_SESSIONS_API_SEPARATION_FIX.md` - Esta documentação

## 🧪 **Como Testar**

1. **Crie um agente Uazapi** e envie algumas mensagens
2. **Crie um agente Evolution** e envie algumas mensagens
3. **Acesse a página de sessões do agente Uazapi**
   - ✅ Deve mostrar apenas sessões Uazapi
4. **Acesse a página de sessões do agente Evolution**
   - ✅ Deve mostrar apenas sessões Evolution
5. **Verifique os logs** no console do navegador e terminal
   - ✅ Deve mostrar `🔍 Filtrando por bot_id: ...`

## ⚠️ **Importante: Backend Only**

Todas as consultas ao banco de dados são feitas **APENAS NO BACKEND** via `/api/bot-sessions`. O frontend **NUNCA** acessa o Supabase diretamente, seguindo as melhores práticas de segurança.

---

**🎉 Problema resolvido! Agora as sessões Uazapi e Evolution estão completamente separadas!**
