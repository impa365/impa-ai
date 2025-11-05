# 🔍 Guia de Debug do Quest System

## 📋 Análise Detalhada do Fluxo de Renderização

### **1️⃣ ESTRUTURA DO SISTEMA**

```
app/layout.tsx (Raiz)
  └─> QuestSystemManager (Provider)
       └─> QuestProvider (Hook SWR)
            └─> QuestSystemContent (Lógica)
                 └─> QuestFAB (Botão Flutuante)
```

---

## 🎯 **PONTOS DE VERIFICAÇÃO**

### **A. Layout Raiz** (`app/layout.tsx`)
✅ **Status**: Configurado corretamente
- `<QuestSystemManager />` está incluído no layout
- Renderiza em **TODAS** as páginas (exceto `/auth/*`)

---

### **B. Quest Provider** (`hooks/use-quest-system.tsx`)

**Função**: Buscar progresso do usuário via API

**Endpoint**: `GET /api/quest-progress`

**Possíveis Problemas**:
1. ❌ **Não autenticado** - Cookie JWT ausente
2. ❌ **API retorna erro** - Problema no Supabase
3. ❌ **Tabela não existe** - `user_quest_progress` não criada
4. ❌ **Permissões** - JWT não tem permissão para criar registro

**Logs Esperados no Console**:
```
🔄 [QUEST PROVIDER] isLoading: true
🔄 [QUEST PROVIDER] error: undefined
🔄 [QUEST PROVIDER] progress: undefined

// Depois do carregamento:
✅ [QUEST PROVIDER] Dados carregados com sucesso: {...}
🔄 [QUEST PROVIDER] isLoading: false
🔄 [QUEST PROVIDER] progress: { userId: "...", totalXP: 0, ... }
```

---

### **C. Quest System Content** (`components/quest-system/quest-system-manager.tsx`)

**Condições que IMPEDEM renderização**:

1. **Página de Autenticação** (`/auth/login`, `/auth/register`)
   ```
   ⚠️ [QUEST CONTENT] Não renderizando - Página de autenticação
   ```

2. **Usuário Desabilitou ARIA** (`preferences.showARIA = false`)
   ```
   ⚠️ [QUEST CONTENT] Não renderizando - Usuário desabilitou ARIA
   ```

**Logs Esperados**:
```
📦 [QUEST CONTENT] Progress recebido: {...}
📦 [QUEST CONTENT] Preferências: { showARIA: true, ... }
🔍 [QUEST CONTENT] Está em página de auth? false
🔍 [QUEST CONTENT] URL atual: /admin
🔍 [QUEST CONTENT] showARIA preferência: true
✅ [QUEST CONTENT] Renderizando Quest System!
```

---

### **D. Quest FAB** (`components/quest-system/quest-fab.tsx`)

**Condição que IMPEDE renderização**:
- `progress` é `null` ou `undefined`

**Logs Esperados**:
```
🎮 [QUEST FAB] Progress: { userId: "...", totalXP: 0, ... }
🎮 [QUEST FAB] Progress existe? true
```

**Se NÃO aparecer**:
```
🎮 [QUEST FAB] Progress: undefined
🎮 [QUEST FAB] Progress existe? false
⚠️ [QUEST FAB] Não renderizando - Progress é null/undefined
```

---

## 🚀 **COMO DEBUGAR - PASSO A PASSO**

### **Passo 1: Abrir Console do Navegador**
1. Pressione `F12` (Chrome/Edge/Firefox)
2. Vá para a aba **Console**
3. Recarregue a página: `Ctrl + F5`

---

### **Passo 2: Verificar Sequência de Logs**

**✅ SEQUÊNCIA IDEAL (Tudo funcionando)**:
```
1. 🔄 [QUEST PROVIDER] isLoading: true
2. 🎮 [QUEST] Buscando progresso do usuário: abc-123-...
3. 🆕 [QUEST] Criando progresso inicial (se primeira vez)
4. ✅ [QUEST] Progresso criado com sucesso
5. ✅ [QUEST PROVIDER] Dados carregados com sucesso
6. 📦 [QUEST CONTENT] Progress recebido: {...}
7. 🔍 [QUEST CONTENT] URL atual: /admin
8. ✅ [QUEST CONTENT] Renderizando Quest System!
9. 🎮 [QUEST FAB] Progress existe? true
10. Botão aparece no canto inferior direito! 🎉
```

---

### **Passo 3: Identificar Problema pela Sequência**

#### **❌ PROBLEMA 1: Não há logs do QUEST PROVIDER**
**Causa**: QuestSystemManager não está sendo renderizado

**Solução**:
1. Verificar se `app/layout.tsx` inclui `<QuestSystemManager />`
2. Verificar se não há erro de importação
3. Reiniciar servidor Next.js

---

#### **❌ PROBLEMA 2: Erro "Não autenticado"**
**Log**: `❌ [QUEST PROVIDER] Erro ao carregar dados: 401`

**Causa**: JWT ausente ou inválido

**Solução**:
1. Verificar se você está **logado** no painel
2. Verificar cookies no navegador (F12 > Application > Cookies)
3. Procurar cookie `auth-token`
4. Se não houver, fazer **logout e login novamente**

---

#### **❌ PROBLEMA 3: Erro 500 da API**
**Log**: `❌ [QUEST PROVIDER] Erro ao carregar dados: 500`

**Causa**: Erro no backend (Supabase)

**Solução**:
1. Verificar logs do servidor Next.js no terminal
2. Procurar por `❌ [QUEST] Erro ao buscar progresso:`
3. Verificar se tabela `user_quest_progress` existe no banco

**Verificar tabela**:
```sql
SELECT * FROM impaai.user_quest_progress LIMIT 1;
```

---

#### **❌ PROBLEMA 4: Progress é undefined (sem erro)**
**Log**: 
```
🔄 [QUEST PROVIDER] isLoading: false
🔄 [QUEST PROVIDER] error: undefined
🔄 [QUEST PROVIDER] progress: undefined
```

**Causa**: API retornou sucesso, mas sem dados

**Solução**:
1. Abrir Network tab (F12 > Network)
2. Recarregar página
3. Procurar requisição `quest-progress`
4. Ver a resposta (Response)
5. Se vazio, verificar backend

---

#### **❌ PROBLEMA 5: Renderizando mas botão não aparece**
**Log**:
```
✅ [QUEST CONTENT] Renderizando Quest System!
🎮 [QUEST FAB] Progress: {...}
⚠️ [QUEST FAB] Não renderizando - Progress é null/undefined
```

**Causa**: Inconsistência entre Provider e FAB

**Solução**:
1. Limpar cache do navegador: `Ctrl + Shift + Del`
2. Recarregar: `Ctrl + F5`
3. Se persistir, verificar se `progress` tem todas as propriedades necessárias

---

#### **❌ PROBLEMA 6: Página é /auth/***
**Log**: `⚠️ [QUEST CONTENT] Não renderizando - Página de autenticação`

**Causa**: Comportamento ESPERADO - não deve aparecer em páginas de login

**Solução**: Navegar para `/admin` ou qualquer página autenticada

---

## 📊 **CHECKLIST COMPLETO**

Use este checklist para verificar cada parte:

```
□ Servidor Next.js rodando sem erros
□ Usuário está LOGADO (não em /auth/login)
□ Console aberto (F12)
□ Página recarregada (Ctrl + F5)
□ Logs do QUEST PROVIDER aparecem
□ Logs do QUEST CONTENT aparecem
□ Logs do QUEST FAB aparecem
□ Tabela user_quest_progress existe no banco
□ Cookie auth-token presente
□ API /api/quest-progress retorna 200
□ Progress tem propriedade preferences.showARIA = true
□ URL não é /auth/*
□ Botão roxo visível no canto inferior direito
```

---

## 🔧 **COMANDOS ÚTEIS**

### **Verificar Tabela no Banco**
```sql
-- Ver se existe
SELECT * FROM impaai.user_quest_progress LIMIT 5;

-- Ver estrutura
\d impaai.user_quest_progress;

-- Criar manualmente um registro de teste
INSERT INTO impaai.user_quest_progress (user_id, total_xp, current_level)
VALUES ('SEU_USER_ID_AQUI', 0, 1);
```

### **Testar API Manualmente**
```bash
# No terminal
curl -X GET http://localhost:3000/api/quest-progress \
  -H "Cookie: auth-token=SEU_TOKEN_AQUI"
```

---

## 📞 **PRÓXIMOS PASSOS**

1. **Recarregue a página** com `Ctrl + F5`
2. **Abra o Console** (F12)
3. **Procure pelos logs** começando com 🔄, 📦, 🎮
4. **Identifique onde para** a sequência
5. **Use o checklist acima** para diagnosticar
6. **Me mande os logs** se precisar de ajuda

---

## ✅ **SUCESSO!**

Se você ver:
```
✅ [QUEST CONTENT] Renderizando Quest System!
🎮 [QUEST FAB] Progress existe? true
```

E o **botão roxo aparecer no canto inferior direito**, significa que está **TUDO FUNCIONANDO!** 🎉

Clique no botão para expandir e começar sua jornada IMPA Quest! 🚀

