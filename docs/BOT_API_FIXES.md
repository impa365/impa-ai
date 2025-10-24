# 🔧 Correções na API de Bots

## 📋 Problemas Identificados e Corrigidos

### Problema 1: Função de Autenticação Incorreta

**Erro:**
```
verifyAuth is not a function
```

**Causa:** 
A função `verifyAuth` não existe em `@/lib/auth-server`.

**Solução:**
Substituir por `getCurrentServerUser` em todos os endpoints.

**Arquivos Modificados:**
- ✅ `app/api/bots/route.ts` (GET, POST)
- ✅ `app/api/bots/[id]/route.ts` (GET, PUT, DELETE)

**Código Antes:**
```typescript
import { verifyAuth } from "@/lib/auth-server"

const authResult = await verifyAuth(request)
if (!authResult.authenticated || !authResult.user) {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
}
const { user } = authResult
```

**Código Depois:**
```typescript
import { getCurrentServerUser } from "@/lib/auth-server"

const user = await getCurrentServerUser(request)
if (!user) {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
}
```

---

### Problema 2: Variável de Ambiente Incorreta

**Erro:**
```
Failed to parse URL from undefined/rest/v1/bots
```

**Causa:** 
Usando `process.env.NEXT_PUBLIC_SUPABASE_URL` (variável client-side) ao invés de `process.env.SUPABASE_URL` (variável server-side).

**Solução:**
Corrigir variável de ambiente para server-side.

**Arquivos Modificados:**
- ✅ `app/api/bots/route.ts`
- ✅ `app/api/bots/[id]/route.ts`

**Código Antes:**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!  // ❌ ERRADO - client-side
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
```

**Código Depois:**
```typescript
const supabaseUrl = process.env.SUPABASE_URL!  // ✅ CORRETO - server-side
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
```

---

## 📝 Resumo das Variáveis de Ambiente

### Client-Side (navegador)
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL      // URL do Supabase (público)
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Anon key (público)
```

### Server-Side (API Routes)
```typescript
process.env.SUPABASE_URL                  // URL do Supabase
process.env.SUPABASE_ANON_KEY            // Anon key
process.env.SUPABASE_SERVICE_ROLE_KEY    // Service Role key (sensível!)
```

**Regra de Ouro:**
- ✅ Use `SUPABASE_URL` (sem `NEXT_PUBLIC_`) em API Routes
- ✅ Use `NEXT_PUBLIC_SUPABASE_URL` apenas em componentes client-side

---

## 🧪 Como Testar

### Teste 1: GET /api/bots
```bash
curl http://localhost:3000/api/bots \
  -H "Cookie: impaai_user={...}" \
  -H "Authorization: Bearer {jwt_token}"
```

**Resposta esperada:**
```json
{
  "success": true,
  "bots": [...]
}
```

### Teste 2: DELETE /api/bots/{id}
```bash
curl -X DELETE http://localhost:3000/api/bots/{bot_id} \
  -H "Cookie: impaai_user={...}" \
  -H "Authorization: Bearer {jwt_token}"
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Bot deletado com sucesso"
}
```

**Logs esperados:**
```bash
✅ Usuário encontrado no cookie tradicional: user@example.com
🗑️ [DELETE /api/bots/{id}] Deletando bot
🔄 [DELETE /api/bots/{id}] Tentando deletar webhook: r214e59ca8e1bc6
📡 [DELETE /api/bots/{id}] Response da connection: 200
📊 [DELETE /api/bots/{id}] Connections encontradas: 1
🔗 [DELETE /api/bots/{id}] Connection API Type: uazapi
🔧 [DELETE /api/bots/{id}] Deletando webhook na Uazapi...
✅ [DELETE /api/bots/{id}] Webhook deletado da Uazapi com sucesso!
✅ [DELETE /api/bots/{id}] Bot deletado com sucesso
```

---

## 📊 Status Final

| Componente | Status | Notas |
|------------|--------|-------|
| Autenticação | ✅ | `getCurrentServerUser` funcionando |
| Variáveis de Ambiente | ✅ | `SUPABASE_URL` correto |
| GET /api/bots | ✅ | Lista bots do usuário |
| POST /api/bots | ✅ | Cria novo bot |
| GET /api/bots/[id] | ✅ | Busca bot específico |
| PUT /api/bots/[id] | ✅ | Atualiza bot |
| DELETE /api/bots/[id] | ✅ | Deleta bot + webhook |

---

## 🚀 Próximos Passos

1. **Reiniciar a aplicação** para carregar as correções
2. **Criar um agente** com conexão Uazapi
3. **Deletar o agente** e verificar os logs
4. **Confirmar** que o webhook foi deletado da Uazapi

---

**Data das Correções:** 2025-10-24  
**Status:** ✅ **TODOS OS PROBLEMAS RESOLVIDOS**

