# 🗑️ Limpeza de Webhooks na Uazapi

## 📋 Visão Geral

Este documento explica como o sistema gerencia a **limpeza de webhooks** na Uazapi quando bots são deletados.

## ⚠️ Diferença entre APIs

**IMPORTANTE**: Uazapi e Evolution API são **completamente diferentes**:

- **Uazapi**: Gerenciamento manual de webhooks via API POST com `action: "delete"`
- **Evolution API**: Gerenciamento automático, não requer limpeza manual

**Este documento trata apenas da Uazapi!**

## 🔄 Fluxo de Deleção

### 1. Usuário Deleta um Bot

```typescript
DELETE /api/bots/{id}
```

### 2. Sistema Verifica se tem Webhook

```typescript
if (bot.webhook_id) {
  // Bot tem webhook registrado
  // Prosseguir com deleção
}
```

### 3. Buscar Connection para pegar Token

```typescript
GET /whatsapp_connections?id=eq.{connection_id}
// Retorna: instance_token, api_type
```

### 4. Verificar se é Uazapi

```typescript
if (connection.api_type !== 'uazapi') {
  console.log('Connection não é Uazapi, pulando')
  return
}
```

### 5. Deletar Webhook na Uazapi

```typescript
await deleteUazapiWebhook({
  uazapiServerUrl: 'https://servidor.uazapi.com',
  instanceToken: 'token-da-instancia',
  webhookId: 'r214e59ca8e1bc6'
})
```

## 📡 API da Uazapi - Como Deletar Webhook

### Endpoint

```
POST https://{subdomain}.uazapi.com/webhook
```

### Headers

```json
{
  "Content-Type": "application/json",
  "token": "{instance_token}"
}
```

### Body

```json
{
  "action": "delete",
  "id": "{webhook_id}"
}
```

### Resposta Sucesso (200)

```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

### Resposta Erro (404)

```json
{
  "error": "Webhook not found"
}
```

**Nota:** Erro 404 é tratado como sucesso, pois o webhook já não existe.

## 🔍 Logs Detalhados

### Logs de Sucesso

```bash
🔄 [DELETE /api/bots/{id}] Tentando deletar webhook: r214e59ca8e1bc6
📝 [DELETE /api/bots/{id}] Dados do bot: { id, webhook_id, connection_id, user_id }
📡 [DELETE /api/bots/{id}] Response da connection: 200
📊 [DELETE /api/bots/{id}] Connections encontradas: 1
🔗 [DELETE /api/bots/{id}] Connection API Type: uazapi
🔧 [DELETE /api/bots/{id}] Deletando webhook na Uazapi...
🗑️ [UAZAPI-WEBHOOK] Deletando webhook: r214e59ca8e1bc6
✅ [UAZAPI-WEBHOOK] Webhook deletado com sucesso
✅ [DELETE /api/bots/{id}] Webhook deletado da Uazapi com sucesso!
✅ [DELETE /api/bots/{id}] Bot deletado com sucesso
```

### Logs de Webhook Não Encontrado (Tratado como Sucesso)

```bash
🔄 [DELETE /api/bots/{id}] Tentando deletar webhook: r214e59ca8e1bc6
...
❌ [UAZAPI-WEBHOOK] Erro ao deletar webhook: 404 Not Found
⚠️ [UAZAPI-WEBHOOK] Webhook não encontrado, considerando como deletado
✅ [UAZAPI-WEBHOOK] Webhook deletado com sucesso
```

### Logs de Connection Não-Uazapi

```bash
🔄 [DELETE /api/bots/{id}] Tentando deletar webhook: r214e59ca8e1bc6
📊 [DELETE /api/bots/{id}] Connections encontradas: 1
🔗 [DELETE /api/bots/{id}] Connection API Type: evolution
⚠️ [DELETE /api/bots/{id}] Connection não é Uazapi, pulando deleção de webhook
```

### Logs de Bot sem Webhook

```bash
ℹ️ [DELETE /api/bots/{id}] Bot não possui webhook_id, pulando deleção de webhook
✅ [DELETE /api/bots/{id}] Bot deletado com sucesso
```

## ❌ Tratamento de Erros

### Erro 1: Connection Não Encontrada

```bash
⚠️ [DELETE /api/bots/{id}] Connection não encontrada para connection_id: {uuid}
```

**Ação:** Bot é deletado mesmo assim (webhook fica órfão na Uazapi).

### Erro 2: Uazapi Config Não Encontrada

```bash
❌ [DELETE /api/bots/{id}] Uazapi config não encontrada!
```

**Ação:** Bot é deletado mesmo assim (webhook fica órfão na Uazapi).

### Erro 3: Falha ao Deletar Webhook

```bash
⚠️ [DELETE /api/bots/{id}] Falha ao deletar webhook, mas continuando: {erro}
```

**Ação:** Bot é deletado mesmo assim (webhook fica órfão na Uazapi).

## 🎯 Filosofia de Design

### Por que não falhar se o webhook não for deletado?

1. **Prioridade ao usuário:** O usuário quer deletar o bot, então o bot é deletado
2. **Webhook órfão não é crítico:** Um webhook sem bot apenas recebe eventos que são ignorados
3. **Evita lock-in:** Não força o usuário a manter um bot por problema na Uazapi

### Quando o webhook É deletado com sucesso?

✅ Bot tem `webhook_id`  
✅ Connection existe e está acessível  
✅ Connection é do tipo `uazapi`  
✅ Uazapi config está disponível  
✅ Uazapi API responde com sucesso (ou 404)

## 🧪 Como Testar

### Teste 1: Deletar Bot com Webhook (Cenário Ideal)

1. Criar um agente com conexão Uazapi
2. Verificar que o bot foi criado com `webhook_id`
3. Deletar o agente
4. Verificar nos logs: `✅ Webhook deletado da Uazapi com sucesso!`

### Teste 2: Deletar Bot sem Webhook

1. Criar um bot sem webhook_id (diretamente no banco)
2. Deletar o bot via API
3. Verificar nos logs: `ℹ️ Bot não possui webhook_id, pulando deleção de webhook`

### Teste 3: Deletar Bot com Connection Evolution API

1. Criar um agente com conexão Evolution API
2. Forçar um `webhook_id` no bot (simulação)
3. Deletar o agente
4. Verificar nos logs: `⚠️ Connection não é Uazapi, pulando deleção de webhook`

## 📝 Estrutura de Dados

### Tabela: `bots`

```sql
CREATE TABLE impaai.bots (
  id UUID PRIMARY KEY,
  webhook_id TEXT,  -- ID do webhook na Uazapi (ex: r214e59ca8e1bc6)
  connection_id UUID REFERENCES whatsapp_connections(id),
  user_id UUID REFERENCES user_profiles(id),
  -- outros campos...
);
```

### Tabela: `whatsapp_connections`

```sql
CREATE TABLE impaai.whatsapp_connections (
  id UUID PRIMARY KEY,
  instance_token TEXT,  -- Token para autenticar na Uazapi
  api_type VARCHAR(50),  -- 'uazapi' ou 'evolution'
  -- outros campos...
);
```

## 🔧 Arquivos Relacionados

- **Deleção de Bot:** `app/api/bots/[id]/route.ts` (DELETE method, linhas 217-275)
- **Helper de Webhook:** `lib/uazapi-webhook-helpers.ts` (função `deleteUazapiWebhook`)
- **Config Uazapi:** `lib/uazapi-server.ts` (função `getUazapiConfigServer`)
- **Documentação Uazapi:** `.cursor/rules/uazapi-api-documentation.mdc`

## 🚨 Troubleshooting

### Problema: Webhook não está sendo deletado

**Verificar:**
1. Bot tem `webhook_id` preenchido?
2. Connection existe e tem `instance_token`?
3. Connection é do tipo `uazapi`?
4. Configuração N8N Uazapi está correta no banco?
5. Servidor Uazapi está acessível?

**Comando para verificar:**
```sql
SELECT 
  b.id as bot_id,
  b.webhook_id,
  wc.id as connection_id,
  wc.api_type,
  wc.instance_token IS NOT NULL as has_token
FROM impaai.bots b
LEFT JOIN impaai.whatsapp_connections wc ON b.connection_id = wc.id
WHERE b.id = '{bot_id}';
```

### Problema: Webhook órfão na Uazapi

Se um webhook ficou órfão (bot foi deletado mas webhook não):

1. Acesse a interface da Uazapi
2. Vá em "Webhooks"
3. Identifique o webhook órfão pela URL (contém `botId` do bot deletado)
4. Delete manualmente

**Ou via API:**
```bash
curl -X POST https://servidor.uazapi.com/webhook \
  -H "Content-Type: application/json" \
  -H "token: {instance_token}" \
  -d '{"action": "delete", "id": "{webhook_id}"}'
```

## 📊 Métricas

**Cenários de sucesso:**
- ✅ Webhook deletado da Uazapi
- ✅ Webhook não encontrado (404) - já estava deletado
- ✅ Bot sem webhook_id - nada para deletar
- ✅ Connection não é Uazapi - não se aplica

**Cenários de aviso (bot é deletado mesmo assim):**
- ⚠️ Connection não encontrada
- ⚠️ Uazapi config não encontrada  
- ⚠️ Falha ao deletar webhook por erro da API

---

**Última atualização:** 2025-10-24  
**Status:** ✅ Implementado e funcionando

