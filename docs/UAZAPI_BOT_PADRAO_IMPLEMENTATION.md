# Implementação do Campo "Padrão" para Bots Uazapi

## Resumo

Implementação do campo `padrao` (boolean) para identificar o bot padrão/principal de uma conexão Uazapi. Este campo é utilizado no fluxo n8n para determinar qual bot processar quando não há palavra-chave correspondente.

## Lógica de Funcionamento no n8n

A lógica implementada no n8n funciona da seguinte forma:

1. **Sessão não criada**: Verifica se algum bot tem palavra-chave que dê match com o que o cliente enviou
2. **Sem palavra-chave válida mas bot é padrão**: Envia para o bot padrão
3. **Bot não é padrão mas o gatilho é "Todos"**: Sobrepõe as palavras-chaves
4. **Não tem "Todos" mas tem palavra-chave**: Verifica a palavra-chave

## Mudanças Implementadas

### 1. Banco de Dados

**Arquivo**: `database/add_padrao_field_to_bots.sql`

- Adicionado campo `padrao` (BOOLEAN NOT NULL DEFAULT false) à tabela `impaai.bots`
- Criado índice `idx_bots_padrao` para melhor performance
- Adicionado comentário de documentação

```sql
ALTER TABLE impaai.bots
ADD COLUMN padrao BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_bots_padrao ON impaai.bots(padrao) WHERE padrao = true;
```

### 2. TypeScript Interfaces

**Arquivo**: `types/bot.ts`

- Atualizada interface `Bot` para incluir o campo `padrao: boolean`

### 3. Frontend (AgentModal)

**Arquivo**: `components/agent-modal.tsx`

**Mudanças**:
- Adicionado `bot_padrao: false` ao estado `botFormData`
- Criado novo campo de Switch na UI para "Bot Padrão da Conexão"
- Switch com destaque visual (fundo azul claro/escuro)
- Descrição explicativa sobre a função do campo
- Campo incluído no payload de criação/edição de agentes

**Localização na UI**:
- Aparece no card "Configurações do Bot (Uazapi)"
- Posicionado após os campos "Debounce" e "Split Message"
- Antes do campo "JIDs Ignorados"

### 4. API de Criação de Agentes

**Arquivos modificados**:
- `app/api/user/agents/route.ts`
- `app/api/admin/agents/route.ts`

**Mudanças**:
- Campo `padrao` adicionado ao `botPayload` com valor `Boolean(agentData.bot_padrao) || false`
- Garantido que o valor é sempre boolean, não string

### 5. API de Atualização de Agentes

**Arquivos modificados**:
- `app/api/user/agents/[id]/route.ts`
- `app/api/admin/agents/[id]/route.ts`

**Mudanças implementadas**:

#### a) Detecção do tipo de API
```typescript
const apiType = currentAgent.whatsapp_connections?.api_type || "evolution"
```

#### b) Atualização para bots Uazapi
```typescript
if (apiType === "uazapi" && currentAgent.bot_id) {
  // Atualiza bot na tabela impaai.bots
  // Inclui o campo padrao: Boolean(agentData.bot_padrao)
}
```

#### c) Atualização para bots Evolution
```typescript
if (apiType === "evolution" && agent.evolution_bot_id) {
  // Mantém lógica existente de atualização na Evolution API
}
```

### 6. Helper Functions

**Arquivo**: `lib/uazapi-bot-helpers.ts` (novo)

**Funções criadas**:

#### `updateUazapiBotInDatabase()`
- Atualiza um bot Uazapi no banco de dados
- Converte `ignoreJids` de array para string se necessário
- Retorna resultado com sucesso/erro

#### `updateUazapiBotWebhook()`
- Atualiza webhook Uazapi quando necessário
- Deleta webhook antigo e cria um novo
- Atualiza `webhook_id` no banco
- Útil quando a URL do webhook ou configurações mudam

## Campos de Bot Uazapi Atualizáveis

Os seguintes campos podem ser atualizados via API:

1. `nome` - Nome do bot
2. `gatilho` - Tipo de gatilho (Palavra-chave, Todos, Avançado, Nenhum)
3. `operador_gatilho` - Operador de comparação
4. `value_gatilho` - Palavra-chave para o gatilho
5. `debounce` - Tempo de espera (segundos)
6. `splitMessage` - Quebras de linha para dividir mensagens
7. `ignoreJids` - JIDs ignorados (convertido de array para string)
8. **`padrao`** - Indica se é o bot padrão da conexão (NOVO)

## Fluxo de Atualização

### Frontend → Backend

1. Usuário edita agente no `AgentModal`
2. Formulário inclui campos `bot_*` se a conexão for Uazapi
3. Payload enviado para `/api/user/agents/[id]` ou `/api/admin/agents/[id]`

### Backend (API Route)

1. Atualiza campos do agente na tabela `ai_agents`
2. Busca dados do agente com informações da conexão (incluindo `api_type`)
3. **Se for Uazapi**:
   - Busca o `bot_id` vinculado ao agente
   - Monta objeto `botUpdateData` com os campos enviados
   - Chama `updateUazapiBotInDatabase()` para atualizar o bot
   - Loga sucesso ou erro
4. **Se for Evolution**:
   - Mantém lógica existente de atualização na Evolution API

## Compatibilidade

- ✅ Compatível com bots Evolution existentes (não afeta)
- ✅ Compatível com criação de novos bots Uazapi
- ✅ Compatível com edição de bots Uazapi existentes
- ✅ Sem breaking changes em código existente

## Validações

- Campo é boolean (não string)
- Valor padrão é `false` no banco de dados
- Frontend garante que o valor seja `true` ou `false`
- Backend converte para boolean: `Boolean(agentData.bot_padrao)`

## Como Usar no n8n

No workflow n8n, você pode agora verificar o campo `padrao` do bot:

```javascript
// Exemplo de lógica no n8n
const bots = $('bots').all();

// Filtrar bots por match de palavra-chave
const matchedBots = bots.filter(bot => bot.json.match === true);

if (matchedBots.length > 0) {
  // Usar bot com palavra-chave correspondente
  return matchedBots;
} else {
  // Buscar bot padrão
  const defaultBot = bots.find(bot => bot.json.padrao === true);
  if (defaultBot) {
    return [defaultBot];
  }
}
```

## Migration

Para aplicar as mudanças no banco de dados, execute:

```bash
# Execute o script SQL
psql -U seu_usuario -d sua_database -f database/add_padrao_field_to_bots.sql
```

Ou execute manualmente no Supabase SQL Editor:
```sql
ALTER TABLE impaai.bots ADD COLUMN padrao BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_bots_padrao ON impaai.bots(padrao) WHERE padrao = true;
```

## Testes Recomendados

1. ✅ Criar novo agente Uazapi com `padrao = true`
2. ✅ Criar novo agente Uazapi com `padrao = false`
3. ✅ Editar agente Uazapi existente e alterar `padrao`
4. ✅ Verificar que bots Evolution não são afetados
5. ✅ Verificar comportamento no n8n com múltiplos bots
6. ✅ Verificar que apenas um bot deveria ser padrão por conexão (lógica de negócio)

## Próximos Passos (Opcional)

1. Adicionar validação para garantir que apenas um bot seja padrão por conexão
2. Adicionar UI para indicar qual bot é o padrão na lista de agentes
3. Adicionar warning se nenhum bot for padrão em uma conexão Uazapi
4. Adicionar warning se múltiplos bots forem marcados como padrão

## Suporte

Para dúvidas ou problemas relacionados a esta funcionalidade:
1. Verificar logs do servidor para erros de atualização
2. Verificar estrutura do banco de dados
3. Verificar payload enviado do frontend
4. Verificar se o campo `api_type` está correto na conexão

