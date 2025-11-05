# Bot Padrão: Gatilho Automático em "Nenhum"

## Funcionalidade Implementada

Quando o usuário ativa o switch **"Bot Padrão da Conexão"** em um agente Uazapi, o sistema automaticamente:

✅ Define o **Tipo de Gatilho** para **"Nenhum"**
✅ Desabilita o campo "Tipo de Gatilho" (não pode ser alterado)
✅ Limpa a **Palavra-chave** (se houver)
✅ Esconde os campos de **Operador de Comparação** e **Palavra-chave**
✅ Mostra avisos visuais explicando o comportamento

## Lógica Implementada

### Por que essa lógica?

**Bot Padrão** = Bot que será acionado automaticamente quando:
- Nenhum outro bot tiver palavra-chave correspondente
- Não houver sessão ativa para o chat

Portanto, **bots padrão não precisam de gatilho** - eles são o "fallback" da conexão.

### Comportamento no Frontend

#### 1. Ao Ativar "Bot Padrão da Conexão":

```typescript
onCheckedChange={(checked) => {
  setBotFormData(prev => ({ 
    ...prev, 
    bot_padrao: checked,
    // Se ativar bot padrão, setar gatilho para "Nenhum"
    bot_gatilho: checked ? "Nenhum" : prev.bot_gatilho,
    // Limpar palavra-chave se setar como padrão
    bot_value: checked ? "" : prev.bot_value,
  }))
}}
```

**Resultado**:
- `bot_gatilho` → `"Nenhum"`
- `bot_value` → `""`
- Campo "Tipo de Gatilho" → **Desabilitado**
- Campos de palavra-chave → **Ocultos**

#### 2. Campo "Tipo de Gatilho" Desabilitado:

```typescript
<Select
  value={botFormData.bot_gatilho}
  disabled={botFormData.bot_padrao}
>
  <SelectTrigger 
    className={`... ${botFormData.bot_padrao ? 'opacity-50 cursor-not-allowed' : ''}`}
    disabled={botFormData.bot_padrao}
  >
```

**Aparência Visual**:
- Opacidade reduzida (50%)
- Cursor "not-allowed"
- Label com texto: "(Desabilitado - Bot Padrão)"

#### 3. Campos de Palavra-chave Ocultos:

```typescript
{botFormData.bot_gatilho === "Palavra-chave" && !botFormData.bot_padrao && (
  <>
    <div>
      <Label>Operador de Comparação *</Label>
      ...
    </div>
    <div>
      <Label>Palavra-chave *</Label>
      ...
    </div>
  </>
)}
```

**Resultado**:
- Se `bot_padrao = true`: campos **não aparecem**
- Se `bot_padrao = false` e `bot_gatilho = "Palavra-chave"`: campos **aparecem**

### Avisos Visuais

#### 1. No Switch "Bot Padrão da Conexão":

```
⚠️ Bots padrão não precisam de gatilho - serão acionados automaticamente.
```

Aparece quando `bot_padrao = true`

#### 2. No Campo "Tipo de Gatilho":

**Quando desabilitado**:
```
🔒 Bot padrão não usa gatilho - é acionado automaticamente
```

**Quando habilitado**:
```
Como o bot será ativado (padrão: Todos)
```

## Fluxo de Uso

### Cenário 1: Criar Novo Bot Padrão

1. Usuário cria novo agente Uazapi
2. Ativa switch "Bot Padrão da Conexão"
3. ✅ Sistema automaticamente:
   - Seta "Tipo de Gatilho" para "Nenhum"
   - Desabilita o campo
   - Mostra avisos
4. Usuário preenche outros campos (Debounce, Split Message, etc.)
5. Salva o agente

### Cenário 2: Editar Bot Existente para Ser Padrão

1. Usuário edita agente Uazapi existente
2. Ativa switch "Bot Padrão da Conexão"
3. ✅ Sistema automaticamente:
   - Muda "Tipo de Gatilho" de "Todos" para "Nenhum"
   - Limpa palavra-chave (se houver)
   - Desabilita o campo
   - Mostra avisos
4. Usuário salva as alterações

### Cenário 3: Remover Status de Bot Padrão

1. Usuário edita agente que é bot padrão
2. Desativa switch "Bot Padrão da Conexão"
3. ✅ Sistema automaticamente:
   - Habilita campo "Tipo de Gatilho"
   - Mantém o valor anterior (ou "Nenhum" se era padrão)
   - Remove avisos
4. Usuário pode escolher novo tipo de gatilho
5. Salva as alterações

## Comportamento no Backend

O backend recebe e salva:
```json
{
  "bot_gatilho": "Nenhum",
  "bot_operador": "Contém",
  "bot_value": "",
  "bot_padrao": true
}
```

**Importante**: O backend **não valida** se o gatilho é "Nenhum" quando `bot_padrao = true`. Isso é uma validação de UX no frontend. Se quiser adicionar validação no backend para garantir consistência, seria assim:

```typescript
// Em app/api/user/agents/route.ts ou app/api/admin/agents/route.ts
if (agentData.bot_padrao && agentData.bot_gatilho !== "Nenhum") {
  return NextResponse.json(
    { error: "Bot padrão deve ter gatilho 'Nenhum'" },
    { status: 400 }
  )
}
```

## Lógica no n8n

No workflow n8n, a verificação seria:

```javascript
const bots = $('bots').all();
const message = $('dados').item.json.message;

// 1. Filtrar bots com match de palavra-chave
const matchedBots = bots.filter(bot => {
  if (bot.json.padrao) return false; // Ignorar bots padrão na verificação de palavras
  // ... lógica de verificação de palavra-chave
  return bot.json.match === true;
});

// 2. Se nenhum bot deu match, buscar bot padrão
if (matchedBots.length === 0) {
  const defaultBot = bots.find(bot => bot.json.padrao === true);
  if (defaultBot) {
    return [defaultBot]; // Usar bot padrão
  }
}

// 3. Usar bots com match
return matchedBots;
```

## Arquivos Modificados

- **`components/agent-modal.tsx`**
  - Switch "Bot Padrão da Conexão" atualiza automaticamente `bot_gatilho` para "Nenhum"
  - Campo "Tipo de Gatilho" desabilitado quando `bot_padrao = true`
  - Campos de palavra-chave ocultos quando `bot_padrao = true`
  - Avisos visuais adicionados

## Testes Recomendados

1. ✅ Criar novo agente Uazapi com bot padrão ativado
   - Verificar se gatilho fica "Nenhum"
   - Verificar se campo está desabilitado

2. ✅ Editar agente Uazapi e ativar bot padrão
   - Verificar se gatilho muda para "Nenhum"
   - Verificar se palavra-chave é limpa

3. ✅ Editar agente bot padrão e desativar
   - Verificar se campo é habilitado
   - Verificar se pode escolher outro gatilho

4. ✅ Salvar e recarregar agente bot padrão
   - Verificar se estado persiste corretamente

## Observações

- Esta é uma validação de **UX** no frontend
- O backend **aceita** qualquer combinação de `bot_padrao` e `bot_gatilho`
- Para garantir consistência em 100%, adicionar validação no backend também
- Bots padrão são acionados automaticamente no n8n quando nenhum outro bot corresponde

