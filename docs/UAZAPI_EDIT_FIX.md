# Correção: Edição de Agentes Uazapi

## Problema Identificado

Quando o usuário editava um agente Uazapi, o formulário ainda mostrava os campos da Evolution API (Palavra-chave para Ativar, Palavra para Finalizar Conversa, Mensagem para Quando Não Entender, etc.) que não deveriam aparecer para agentes Uazapi.

### Causa Raiz

O estado `selectedConnectionApiType` só era atualizado quando o usuário **selecionava** uma conexão no dropdown (ao criar um novo agente). Quando **editava** um agente existente, esse estado permanecia `null`, fazendo com que os campos da Evolution API fossem renderizados por padrão.

## Solução Implementada

### 1. Criação de API Route Segura (BACKEND)

**Arquivo**: `app/api/whatsapp-connections/info/[id]/route.ts` (novo)

**Funcionalidade**:
- Endpoint GET que retorna informações básicas de uma conexão WhatsApp
- **Validação de Segurança**: Verifica se o usuário é dono da conexão ou admin
- Retorna apenas: `id`, `connection_name`, `api_type`, `user_id`
- Não expõe tokens ou informações sensíveis

**Segurança**:
```typescript
// Validação de usuário via cookie
const isAdmin = currentUser.role === "admin"
const isOwner = connection.user_id === currentUser.id

if (!isAdmin && !isOwner) {
  return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
}
```

### 2. Detecção Automática do API Type no Frontend

**Arquivo**: `components/agent-modal.tsx`

**Novo useEffect adicionado**:
```typescript
useEffect(() => {
  const fetchConnectionApiType = async () => {
    // Só buscar se estiver editando um agente com conexão
    if (!agent || !agent.whatsapp_connection_id) {
      setSelectedConnectionApiType(null)
      return
    }

    // Buscar api_type do BACKEND (seguro)
    const response = await fetch(
      `/api/whatsapp-connections/info/${agent.whatsapp_connection_id}`
    )
    
    const data = await response.json()
    const apiType = data.connection.api_type || "evolution"
    setSelectedConnectionApiType(apiType)
    
    // Se for Uazapi, buscar dados do bot também
    if (apiType === "uazapi" && agent.bot_id) {
      // ... buscar dados do bot
    }
  }

  fetchConnectionApiType()
}, [agent, open])
```

### 3. Carregamento Automático dos Dados do Bot Uazapi

Quando detecta que é um agente Uazapi e possui `bot_id`:

1. Faz fetch em `/api/bots/${agent.bot_id}`
2. Converte `ignoreJids` de string para array
3. Preenche o estado `botFormData` com:
   - `bot_gatilho`
   - `bot_operador`
   - `bot_value`
   - `bot_debounce`
   - `bot_splitMessage`
   - `bot_ignoreJids` (array)
   - `bot_padrao`

**Código**:
```typescript
// Converter ignoreJids de string para array
let ignoreJidsArray = ["@g.us"]
if (botData.bot.ignoreJids) {
  const jidsString = botData.bot.ignoreJids.replace(/,\s*$/, "")
  ignoreJidsArray = jidsString.split(",").map(jid => jid.trim()).filter(Boolean)
}

setBotFormData({
  bot_gatilho: botData.bot.gatilho || "Todos",
  bot_operador: botData.bot.operador_gatilho || "Contém",
  bot_value: botData.bot.value_gatilho || "",
  bot_debounce: botData.bot.debounce || 5,
  bot_splitMessage: botData.bot.splitMessage || 2,
  bot_ignoreJids: ignoreJidsArray,
  bot_padrao: Boolean(botData.bot.padrao) || false,
})
```

## Fluxo Completo

### Ao Criar Novo Agente
1. Usuário seleciona conexão no dropdown
2. `onChange` do Select atualiza `selectedConnectionApiType`
3. Formulário renderiza campos corretos (Evolution ou Uazapi)

### Ao Editar Agente Existente
1. Modal abre com dados do agente
2. **Novo useEffect** detecta que está editando (`agent` existe)
3. Faz fetch em `/api/whatsapp-connections/info/[id]` (BACKEND)
4. Backend valida permissões do usuário
5. Backend retorna `api_type` de forma segura
6. Frontend seta `selectedConnectionApiType`
7. Se for Uazapi, busca dados do bot via `/api/bots/[id]`
8. Preenche `botFormData` com dados do bot
9. Formulário renderiza campos corretos

## Validações de Segurança

### Backend (API Route)
✅ Verifica cookie de autenticação
✅ Valida se usuário é dono ou admin
✅ Não expõe tokens ou dados sensíveis
✅ Retorna apenas informações necessárias

### Frontend
✅ Busca sempre do backend (não do estado local)
✅ Não armazena dados sensíveis em localStorage
✅ Trata erros graciosamente (fallback para "evolution")

## Campos Renderizados por API Type

### Evolution API
- Tipo de Ativação
- Operador de Comparação  
- Palavra-chave para Ativar a IA
- Palavra para Finalizar Conversa
- Tempo de Expiração da Conversa
- Delay entre Mensagens
- Escutar Minhas Mensagens
- Parar Bot com Minhas Mensagens
- Manter Conversa Aberta
- Dividir Mensagens Longas
- Mensagem para Quando Não Entender
- JIDs Ignorados (com warnings)

### Uazapi API
- Tipo de Gatilho
- Operador de Comparação (condicional)
- Palavra-chave (condicional)
- Debounce (segundos)
- Split Message (quebras de linha)
- **Bot Padrão da Conexão** (Switch com destaque)
- JIDs Ignorados (com chips coloridos)

## Logs de Debug

O código inclui logs detalhados para facilitar o debug:

```
🔄 [AgentModal] Buscando api_type da conexão do BACKEND: <connection_id>
✅ [AgentModal] API Type detectado do BACKEND: uazapi
🤖 [AgentModal] Agente Uazapi detectado, buscando dados do bot...
✅ [AgentModal] Dados do bot Uazapi carregados: {...}
✅ [AgentModal] botFormData preenchido com dados do bot
```

## Testes Recomendados

1. ✅ Criar novo agente Evolution
2. ✅ Editar agente Evolution existente
3. ✅ Criar novo agente Uazapi
4. ✅ **Editar agente Uazapi existente** (caso corrigido)
5. ✅ Verificar campos visíveis em cada caso
6. ✅ Verificar que dados do bot Uazapi são carregados
7. ✅ Verificar que usuários sem permissão recebem 403

## Arquivos Modificados

1. **`components/agent-modal.tsx`**
   - Adicionado useEffect para buscar api_type do backend
   - Adicionado lógica para buscar e preencher dados do bot Uazapi

2. **`app/api/whatsapp-connections/info/[id]/route.ts`** (novo)
   - Endpoint GET seguro para buscar api_type da conexão
   - Validação de permissões (owner ou admin)

## Resultado Final

✅ Ao editar agente Evolution: mostra campos Evolution
✅ Ao editar agente Uazapi: mostra apenas campos Uazapi
✅ Dados do bot Uazapi são carregados automaticamente
✅ Validações de segurança no backend
✅ Não há exposição de dados sensíveis
✅ Experiência consistente entre criar e editar

