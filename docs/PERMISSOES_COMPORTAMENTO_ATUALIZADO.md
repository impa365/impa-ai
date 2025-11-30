# 🔒 Sistema de Permissões - Comportamento Atualizado

## 📋 Comportamento Atual

O sistema agora funciona com **duas configurações independentes** para cada funcionalidade (Agentes IA e Conexões WhatsApp):

### 1️⃣ Pode Acessar (can_access)
Controla se o usuário **tem permissão** para acessar a funcionalidade.

### 2️⃣ Ocultar do Menu (hide_menu)
Controla se o item **aparece no menu lateral**.

---

## 🎯 Combinações Possíveis

### ✅ Cenário 1: Acesso Permitido
```
can_access_connections = true
hide_connections_menu = false (ou true, não importa)
```

**Resultado:**
- ✅ Item **aparece** no menu lateral
- ✅ Usuário **pode acessar** normalmente
- ✅ Vê todas as conexões/agentes
- ✅ Pode criar, editar, deletar

---

### 🔒 Cenário 2: Acesso Negado + Menu Visível
```
can_access_connections = false
hide_connections_menu = false
```

**Resultado:**
- ✅ Item **aparece** no menu lateral
- ❌ Ao clicar, vê **tela de bloqueio** com:
  - 🔒 Ícone de cadeado grande (vermelho)
  - 📝 Mensagem: "Acesso Restrito"
  - 💬 Instrução para contatar administrador
  - 🔙 Botão "Voltar ao Dashboard"
- ❌ Acesso direto por URL mostra a **mesma tela de bloqueio**
- ❌ Não vê nenhum dado sensível

**Objetivo:** Usuário **sabe que a funcionalidade existe** mas precisa de permissão.

---

### 👻 Cenário 3: Acesso Negado + Menu Oculto
```
can_access_connections = false
hide_connections_menu = true
```

**Resultado:**
- ❌ Item **NÃO aparece** no menu lateral
- ❌ Acesso direto por URL **redireciona** para `/dashboard`
- 👻 Usuário nem sabe que a funcionalidade existe

**Objetivo:** Funcionalidade **completamente invisível** para o usuário.

---

## 🎨 Visual da Tela de Bloqueio

Quando `can_access = false` e `hide_menu = false`:

```
┌─────────────────────────────────────────────┐
│                                              │
│              ┌─────────────┐                │
│              │     🔒      │  (vermelho)    │
│              └─────────────┘                │
│                                              │
│          Acesso Restrito                    │
│                                              │
│  Você não tem permissão para acessar a      │
│  funcionalidade de Conexões WhatsApp.       │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ Como obter acesso:                  │   │
│  │ Entre em contato com um             │   │
│  │ administrador do sistema para       │   │
│  │ solicitar permissão de acesso.      │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │     Voltar ao Dashboard             │   │
│  └─────────────────────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🔄 Fluxos de Uso

### Admin Quer que Usuário Veja Mas Não Acesse
**Use Case:** Mostrar que existe a funcionalidade, mas usuário precisa pedir acesso.

```
Configuração:
✅ Pode acessar Agentes IA: DESMARCADO
❌ Ocultar Agentes do menu: DESMARCADO
```

**Experiência do Usuário:**
1. Vê "Agentes IA" no menu
2. Clica e vê tela com cadeado
3. Entende que precisa pedir acesso ao admin
4. Pode voltar ao dashboard

---

### Admin Quer Esconder Completamente
**Use Case:** Usuário não deve nem saber que a funcionalidade existe.

```
Configuração:
✅ Pode acessar Agentes IA: DESMARCADO
✅ Ocultar Agentes do menu: MARCADO
```

**Experiência do Usuário:**
1. Menu não mostra "Agentes IA"
2. Se tentar URL direta → redireciona ao dashboard
3. Não vê nada relacionado a agentes

---

### Admin Quer Liberar Acesso Total
**Use Case:** Usuário pode usar normalmente.

```
Configuração:
✅ Pode acessar Agentes IA: MARCADO
❌ Ocultar Agentes do menu: (auto-desmarcado)
```

**Experiência do Usuário:**
1. Vê "Agentes IA" no menu
2. Acessa normalmente
3. Pode criar, editar, deletar
4. Vê todos os dados

---

## 🛡️ Proteções Implementadas

### 1. Backend Redirect (hide_menu = true)
```typescript
// Se não tem acesso E menu está oculto
if (!canAccess && hideMenu) {
  router.push('/dashboard');
  return;
}
```

### 2. Tela de Bloqueio Visual (hide_menu = false)
```typescript
// Se não tem acesso MAS menu está visível
if (!hasAccess) {
  return <LockedScreen />;
}
```

### 3. Não Carrega Dados se Sem Acesso
```typescript
// Só carrega se tem permissão
if (canAccess) {
  await loadAgentsAndLimits();
}
```

---

## 📊 Matriz de Comportamento

| can_access | hide_menu | Menu Lateral | Clicar Menu | URL Direta | Carrega Dados |
|-----------|-----------|--------------|-------------|------------|---------------|
| `true`    | `false`   | ✅ Aparece   | ✅ Funciona | ✅ Funciona| ✅ Sim       |
| `true`    | `true`    | ✅ Aparece   | ✅ Funciona | ✅ Funciona| ✅ Sim       |
| `false`   | `false`   | ✅ Aparece   | 🔒 Bloqueio | 🔒 Bloqueio| ❌ Não       |
| `false`   | `true`    | ❌ Oculto    | N/A         | ↩️ Redirect | ❌ Não       |

**Legenda:**
- ✅ Funciona normalmente
- 🔒 Mostra tela de bloqueio com cadeado
- ↩️ Redireciona para `/dashboard`
- ❌ Não executa

---

## 🧪 Como Testar

### Teste 1: Menu Visível + Acesso Negado
```
1. Admin → Editar Usuário João
2. Desmarcar "Pode acessar Conexões WhatsApp"
3. Deixar DESMARCADO "Ocultar Conexões do menu"
4. Salvar

5. Login como João
6. Ver menu lateral → "WhatsApp" ESTÁ LÁ
7. Clicar em "WhatsApp"
8. Ver tela com cadeado vermelho grande
9. Ler mensagem de bloqueio
10. Clicar "Voltar ao Dashboard"

11. Tentar acessar /dashboard/whatsapp pela URL
12. Ver mesma tela de bloqueio
```

### Teste 2: Menu Oculto + Acesso Negado
```
1. Admin → Editar Usuário João
2. Desmarcar "Pode acessar Conexões WhatsApp"
3. Marcar "Ocultar Conexões do menu"
4. Salvar

5. Login como João
6. Ver menu lateral → "WhatsApp" NÃO ESTÁ
7. Tentar acessar /dashboard/whatsapp pela URL
8. Ser redirecionado para /dashboard
9. Nunca ver tela de bloqueio
```

### Teste 3: Acesso Liberado
```
1. Admin → Editar Usuário João
2. Marcar "Pode acessar Conexões WhatsApp"
3. Salvar (hide_menu auto-desmarca)

4. Login como João
5. Ver menu lateral → "WhatsApp" ESTÁ LÁ
6. Clicar em "WhatsApp"
7. Ver página normal com conexões
8. Poder criar nova conexão
```

---

## 🎯 Quando Usar Cada Modo

### 🔒 Menu Visível + Bloqueado (Recomendado)
**Situações:**
- Período de trial/teste
- Plano gratuito com upgrade disponível
- Recursos premium visíveis
- Incentivar usuário a pedir acesso

**Vantagem:** Usuário sabe que existe e pode solicitar

### 👻 Menu Oculto + Bloqueado
**Situações:**
- Funcionalidade em desenvolvimento
- Recursos administrativos
- Usuários não devem saber da existência
- Segurança por obscuridade

**Vantagem:** Interface mais limpa, foco no que é permitido

### ✅ Acesso Liberado
**Situações:**
- Usuário pagante/premium
- Usuário confiável
- Acesso total ao sistema

**Vantagem:** Experiência completa

---

## 📝 Notas Importantes

1. **hide_menu só funciona quando can_access = false**
   - Se `can_access = true`, o `hide_menu` é ignorado
   - O checkbox de "ocultar" só aparece quando acesso está negado

2. **Redirect só acontece com hide_menu = true**
   - Se `hide_menu = false`, sempre mostra tela de bloqueio
   - Nunca redireciona se o menu está visível

3. **Tela de bloqueio é consistente**
   - Mesma tela tanto clicando no menu quanto acessando por URL
   - Design visual claro com cadeado

4. **Segurança em camadas**
   - Backend não carrega dados sem permissão
   - Frontend não renderiza componentes sensíveis
   - Database valida permissões

---

**Commit:** `e4e64bc`  
**Data:** 20/11/2025  
**Status:** ✅ Em Produção
