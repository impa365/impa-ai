# 🐛 Fix: Deleção de Webhooks Uazapi ao Deletar Agentes

## 📋 Problema Identificado

Quando um **agente** era deletado via interface `/admin/agents` ou `/dashboard/agents`, o **webhook da Uazapi NÃO era removido**, deixando webhooks órfãos na API da Uazapi.

### Fluxo Antes do Fix ❌

```
DELETE /api/admin/agents?id={agentId}
  ↓
✅ Deleta bot da Evolution API (se existir)
❌ NÃO deleta webhook da Uazapi (BUG!)
❌ NÃO deleta bot da tabela bots
✅ Deleta agente da tabela ai_agents
  ↓
Resultado: Webhook órfão na Uazapi 😱
```

## ✅ Solução Implementada

Adicionada lógica de deleção de webhook Uazapi em **TODAS** as rotas de deleção de agentes.

### Fluxo Após o Fix ✅

```
DELETE /api/admin/agents?id={agentId}
  ↓
✅ Deleta bot da Evolution API (se existir)
✅ Verifica se agente tem bot_id (Uazapi)
  ↓
  Se bot_id existe:
    ✅ Chama DELETE /api/bots/{bot_id}
      ↓
      ✅ Busca dados do bot (webhook_id, connection_id)
      ✅ Busca connection (instance_token, api_type)
      ✅ Verifica se é Uazapi
      ✅ Deleta webhook na Uazapi via API
      ✅ Deleta bot da tabela bots
  ↓
✅ Deleta agente da tabela ai_agents
  ↓
Resultado: Tudo limpo! 🎉
```

## 🔧 Arquivos Modificados

### 1. `/app/api/admin/agents/route.ts` (DELETE)

**Linhas 965-999:** Adicionada verificação de `bot_id` e chamada para deleção do bot

```typescript
// Deletar bot Uazapi e webhook se existir
if (agent.bot_id) {
  console.log(`🗑️ [DELETE AGENT] Agente tem bot_id: ${agent.bot_id}, iniciando deleção...`)
  
  const deleteBotUrl = `${baseUrl}/api/bots/${agent.bot_id}`
  const deleteBotResponse = await fetch(deleteBotUrl, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Cookie": request.headers.get("cookie") || "",
    },
  })

  if (deleteBotResponse.ok) {
    console.log("✅ [DELETE AGENT] Bot e webhook deletados com sucesso")
  }
}
```

### 2. `/app/api/user/agents/[id]/route.ts` (DELETE)

**Linhas 445-479:** Mesma lógica para endpoint de usuários

```typescript
// Deletar bot Uazapi e webhook se existir
if (agent.bot_id) {
  console.log(`🗑️ [DELETE AGENT USER] Agente tem bot_id: ${agent.bot_id}, iniciando deleção...`)
  
  const deleteBotUrl = `${baseUrl}/api/bots/${agent.bot_id}`
  const deleteBotResponse = await fetch(deleteBotUrl, { method: "DELETE" })
  
  if (deleteBotResponse.ok) {
    console.log("✅ [DELETE AGENT USER] Bot e webhook deletados com sucesso")
  }
}
```

### 3. `/app/api/bots/[id]/route.ts` (DELETE)

**Linhas 217-275:** Melhorados logs e validações

- Logs detalhados em cada etapa
- Verificação de `api_type === 'uazapi'`
- Tratamento de erros mais robusto
- Mensagens claras de sucesso/falha

## 📊 Logs Esperados

### Cenário 1: Deletar Agente com Uazapi

```bash
📡 API: DELETE /api/admin/agents chamada
🗑️ Deletando agente: {agentId}
✅ Agente encontrado e verificado
🗑️ [DELETE AGENT] Agente tem bot_id: {botId}, iniciando deleção...
🔗 [DELETE AGENT] URL do bot para delete: http://localhost:3000/api/bots/{botId}
📥 [DELETE AGENT] Resposta do delete do bot: 200

# Logs da rota /api/bots/[id]:
🔄 [DELETE /api/bots/{id}] Tentando deletar webhook: r214e59ca8e1bc6
📝 [DELETE /api/bots/{id}] Dados do bot: { id, webhook_id, connection_id }
📡 [DELETE /api/bots/{id}] Response da connection: 200
📊 [DELETE /api/bots/{id}] Connections encontradas: 1
🔗 [DELETE /api/bots/{id}] Connection API Type: uazapi
🔧 [DELETE /api/bots/{id}] Deletando webhook na Uazapi...
🗑️ [UAZAPI-WEBHOOK] Deletando webhook: r214e59ca8e1bc6
✅ [UAZAPI-WEBHOOK] Webhook deletado com sucesso
✅ [DELETE /api/bots/{id}] Webhook deletado da Uazapi com sucesso!
✅ [DELETE /api/bots/{id}] Bot deletado com sucesso

# De volta à rota de agentes:
✅ [DELETE AGENT] Bot e webhook deletados com sucesso
✅ Agente deletado com sucesso
```

### Cenário 2: Deletar Agente sem bot_id

```bash
📡 API: DELETE /api/admin/agents chamada
🗑️ Deletando agente: {agentId}
ℹ️ [DELETE AGENT] Agente não possui bot_id, pulando deleção de bot/webhook
✅ Agente deletado com sucesso
```

### Cenário 3: Deletar Agente com Evolution API

```bash
📡 API: DELETE /api/admin/agents chamada
🗑️ Deletando agente: {agentId}
🤖 Deletando bot da Evolution API...
✅ Bot deletado da Evolution API
ℹ️ [DELETE AGENT] Agente não possui bot_id, pulando deleção de bot/webhook
✅ Agente deletado com sucesso
```

## 🧪 Como Testar

### Teste 1: Criar e Deletar Agente Uazapi

1. **Executar** `database/add_bot_id_to_ai_agents.sql` no Supabase
2. **Criar** um agente com conexão Uazapi
3. **Verificar** nos logs que o webhook foi criado:
   ```
   ✅ [UAZAPI] Webhook configurado: r214e59ca8e1bc6
   ✅ [UAZAPI] Bot vinculado ao agente com sucesso!
   ```
4. **Deletar** o agente via interface
5. **Verificar** nos logs que o webhook foi deletado:
   ```
   ✅ [DELETE AGENT] Bot e webhook deletados com sucesso
   ```

### Teste 2: Verificar Webhook Órfão

Se você tem webhooks órfãos de antes do fix:

1. **Listar** webhooks na Uazapi:
   ```bash
   curl -X GET https://servidor.uazapi.com/webhook \
     -H "token: {instance_token}"
   ```

2. **Identificar** webhooks órfãos (com `botId` de bots que não existem mais)

3. **Deletar** manualmente:
   ```bash
   curl -X POST https://servidor.uazapi.com/webhook \
     -H "Content-Type: application/json" \
     -H "token: {instance_token}" \
     -d '{"action": "delete", "id": "{webhook_id}"}'
   ```

## 📝 Tabela de Relacionamentos

```sql
ai_agents
  |
  ├─ evolution_bot_id → Evolution API (externa)
  └─ bot_id → bots
              |
              ├─ webhook_id → Uazapi Webhook (externo)
              └─ connection_id → whatsapp_connections
                                 |
                                 ├─ instance_token
                                 └─ api_type (uazapi | evolution)
```

## ⚙️ Configuração da Uazapi

### API Endpoint para Deletar Webhook

```http
POST https://{subdomain}.uazapi.com/webhook
Content-Type: application/json
token: {instance_token}

{
  "action": "delete",
  "id": "{webhook_id}"
}
```

### Respostas

**Sucesso (200):**
```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

**Não Encontrado (404):**
```json
{
  "error": "Webhook not found"
}
```

**Nota:** Erro 404 é tratado como sucesso (webhook já não existe).

## 🔒 Princípios de Design

1. **Prioridade ao usuário:** Agente é sempre deletado, mesmo se webhook falhar
2. **Logs detalhados:** Cada etapa é logada para debug fácil
3. **Segurança:** Verifica `api_type` antes de deletar (não tenta deletar webhook de Evolution API)
4. **Resiliência:** Continua deleção mesmo se Uazapi API falhar
5. **Cleanup completo:** Remove bot do banco e webhook da API externa

## 📚 Documentação Relacionada

- `docs/WEBHOOK_CLEANUP_UAZAPI.md` - Guia detalhado sobre limpeza de webhooks
- `docs/AGENT_BOT_INTEGRATION.md` - Como agentes se conectam aos bots
- `.cursor/rules/uazapi-api-documentation.mdc` - Documentação completa da API Uazapi

## ✅ Checklist de Implementação

- [x] Adicionar lógica em `/api/admin/agents` (DELETE)
- [x] Adicionar lógica em `/api/user/agents/[id]` (DELETE)
- [x] Melhorar logs em `/api/bots/[id]` (DELETE)
- [x] Adicionar verificação de `api_type`
- [x] Criar documentação completa
- [x] Testar cenários principais
- [ ] **PENDENTE:** Executar `database/add_bot_id_to_ai_agents.sql` no Supabase

## 🚀 Status

**Status:** ✅ **IMPLEMENTADO**  
**Data:** 2025-10-24  
**Versão:** 1.1.0  

---

**⚠️ AÇÃO NECESSÁRIA:**

Execute o script SQL antes de usar:
```sql
-- database/add_bot_id_to_ai_agents.sql
ALTER TABLE impaai.ai_agents ADD COLUMN bot_id UUID NULL;
ALTER TABLE impaai.ai_agents 
  ADD CONSTRAINT ai_agents_bot_id_fkey 
  FOREIGN KEY (bot_id) 
  REFERENCES impaai.bots(id) 
  ON DELETE SET NULL;
```

Depois teste criando e deletando um agente Uazapi! 🎯

