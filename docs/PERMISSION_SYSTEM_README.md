# Sistema de Controle de Permissões de Usuário

## 📋 Visão Geral

Sistema completo de controle de permissões que permite ao administrador gerenciar o acesso de usuários às funcionalidades de **Agentes IA** e **Conexões WhatsApp**.

## ✨ Funcionalidades

### Permissões Disponíveis

1. **Acesso a Agentes IA** (`can_access_agents`)
   - Controla se o usuário pode acessar páginas de agentes
   - Default: `true`

2. **Acesso a Conexões WhatsApp** (`can_access_connections`)
   - Controla se o usuário pode acessar páginas de conexões
   - Default: `true`

3. **Ocultar Agentes do Menu** (`hide_agents_menu`)
   - Esconde o item "Agentes IA" do menu lateral
   - Só disponível quando `can_access_agents = false`
   - Default: `false`

4. **Ocultar Conexões do Menu** (`hide_connections_menu`)
   - Esconde o item "WhatsApp" do menu lateral
   - Só disponível quando `can_access_connections = false`
   - Default: `false`

## 🔒 Camadas de Segurança

### 1. **Banco de Dados**
```sql
-- Colunas na tabela user_profiles (schema: impaai)
can_access_agents         BOOLEAN DEFAULT true
can_access_connections    BOOLEAN DEFAULT true
hide_agents_menu          BOOLEAN DEFAULT false
hide_connections_menu     BOOLEAN DEFAULT false
```

### 2. **Backend - APIs**

#### `/api/admin/users` (GET, POST, PUT)
- ✅ Retorna campos de permissão
- ✅ Salva campos de permissão ao criar/editar usuários
- ✅ Valores padrão aplicados se não fornecidos

#### `/api/admin/users/[id]` (GET)
- ✅ Retorna campos de permissão do usuário específico

#### `/api/user/profile` (GET)
- ✅ Retorna permissões do usuário logado
- Usado pelo dashboard para carregar permissões

### 3. **Frontend - Páginas**

#### `/dashboard/agents`
- ✅ Verifica `can_access_agents` via `publicApi.getCurrentUser()`
- ✅ Exibe mensagem de bloqueio se sem permissão
- ✅ Não carrega dados se sem acesso

#### `/dashboard/whatsapp`
- ✅ Verifica `can_access_connections` via `publicApi.getCurrentUser()`
- ✅ Exibe mensagem de bloqueio se sem permissão
- ✅ Não carrega dados se sem acesso

#### `/dashboard` (Layout)
- ✅ Carrega permissões do usuário no mount
- ✅ Filtra itens do menu baseado em `hide_agents_menu` e `hide_connections_menu`
- ✅ Atualiza menu dinamicamente

### 4. **Frontend - Componentes**

#### `components/user-modal.tsx`
- ✅ Campos de permissão no formulário
- ✅ Checkboxes condicionais (hide só aparece quando access = false)
- ✅ Valores padrão carregados corretamente
- ✅ Validação automática (resetar hide quando conceder acesso)

## 📱 Interface do Administrador

### Modal de Edição de Usuário

```
┌─────────────────────────────────────┐
│ Permissões de Acesso                │
├─────────────────────────────────────┤
│ ☑ Pode acessar Agentes IA           │
│                                      │
│ ☑ Pode acessar Conexões WhatsApp    │
└─────────────────────────────────────┘
```

**Com permissão negada:**
```
┌─────────────────────────────────────┐
│ Permissões de Acesso                │
├─────────────────────────────────────┤
│ ☐ Pode acessar Agentes IA           │
│    ☑ Ocultar Agentes do menu        │
│                                      │
│ ☐ Pode acessar Conexões WhatsApp    │
│    ☑ Ocultar Conexões do menu       │
└─────────────────────────────────────┘
```

## 🎯 Fluxo de Funcionamento

### 1. Admin Define Permissões
```
Admin → User Modal → Checkboxes → Salvar → API → Database
```

### 2. Usuário Tenta Acessar
```
User → /dashboard/agents
  ↓
Verifica can_access_agents
  ↓
  ├─ true  → Carrega página normalmente
  └─ false → Exibe mensagem de bloqueio
```

### 3. Menu Lateral
```
Dashboard Layout carrega
  ↓
Busca permissões do usuário
  ↓
Filtra itens do menu
  ↓
  ├─ hide_agents_menu = true → Remove "Agentes IA"
  └─ hide_connections_menu = true → Remove "WhatsApp"
```

## 🔧 Arquivos Modificados

### Componentes
- ✅ `components/user-modal.tsx` - Adicionados checkboxes de permissões

### APIs
- ✅ `app/api/admin/users/route.ts` - GET, POST, PUT com permissões
- ✅ `app/api/admin/users/[id]/route.ts` - GET com permissões
- ✅ `app/api/user/profile/route.ts` - GET com permissões

### Páginas (Já existiam as verificações)
- ✅ `app/dashboard/agents/page.tsx` - Verifica `can_access_agents`
- ✅ `app/dashboard/whatsapp/page.tsx` - Verifica `can_access_connections`
- ✅ `app/dashboard/layout.tsx` - Oculta menus baseado em permissões

## 📊 Estados das Permissões

| can_access | hide_menu | Resultado                           |
|-----------|-----------|-------------------------------------|
| `true`    | `false`   | Menu visível, acesso permitido      |
| `true`    | `true`    | Menu visível, acesso permitido*     |
| `false`   | `false`   | Menu visível, acesso bloqueado      |
| `false`   | `true`    | Menu oculto, acesso bloqueado       |

*Nota: Se `can_access = true`, o valor de `hide_menu` é ignorado pelo sistema*

## 🛡️ Segurança

### ✅ Proteções Implementadas

1. **Backend Validation**
   - Permissões verificadas no servidor
   - Não depende apenas do frontend

2. **Database Defaults**
   - Valores padrão seguros (`can_access = true`)
   - Nunca null (usa `??` operator)

3. **UI Logic**
   - Checkboxes condicionais evitam estados inválidos
   - Auto-reset de `hide_menu` quando `can_access` é concedido

4. **Mensagens Claras**
   - Usuário sabe que não tem permissão
   - Instruído a contatar administrador

## 🧪 Como Testar

### 1. Criar Usuário com Permissões Limitadas
```
Admin → Usuários → Novo Usuário
  → Desmarcar "Pode acessar Agentes IA"
  → Marcar "Ocultar Agentes do menu"
  → Salvar
```

### 2. Login com Usuário Limitado
```
1. Fazer logout
2. Login com novo usuário
3. Verificar menu lateral (não deve ter "Agentes IA")
4. Tentar acessar /dashboard/agents diretamente
5. Deve ver mensagem de bloqueio
```

### 3. Restaurar Permissões
```
Admin → Usuários → Editar Usuário
  → Marcar "Pode acessar Agentes IA"
  → Salvar (hide_agents_menu será auto-desmarcado)
```

## 📝 Mensagens de Erro

### Página de Agentes Bloqueada
```
❌ Acesso Negado
Você não tem permissão para acessar a funcionalidade de Agentes IA.
Entre em contato com um administrador para solicitar acesso.
```

### Página de Conexões Bloqueada
```
❌ Acesso Negado
Você não tem permissão para acessar a funcionalidade de Conexões WhatsApp.
Entre em contato com um administrador para solicitar acesso.
```

## 🚀 Deploy

Sistema já está em produção após commit:
```bash
git commit -m "feat: adiciona controle de permissões de usuário no painel admin"
git push
```

**Commit:** `8fbf938`
**Branch:** `correcao-bugs`

## ✅ Checklist de Implementação

- [x] Colunas de banco de dados (já existiam)
- [x] API GET retorna permissões
- [x] API POST/PUT salva permissões
- [x] Modal de usuário com checkboxes
- [x] Lógica condicional (hide só quando access = false)
- [x] Páginas verificam permissões
- [x] Menu lateral oculta itens
- [x] Mensagens de bloqueio
- [x] Valores padrão seguros
- [x] Testes manuais
- [x] Documentação
- [x] Deploy

## 🎓 Exemplos de Uso

### Admin Quer Bloquear Agentes para Usuário de Teste
```typescript
// No modal de edição:
can_access_agents: false
hide_agents_menu: true    // Ocultar do menu também
can_access_connections: true
hide_connections_menu: false
```

### Admin Quer Usuário com Acesso Apenas ao WhatsApp
```typescript
// No modal de edição:
can_access_agents: false
hide_agents_menu: true
can_access_connections: true
hide_connections_menu: false
```

### Admin Quer Usuário Completo (Default)
```typescript
// No modal de edição:
can_access_agents: true
hide_agents_menu: false   // Auto-desmarcado se access = true
can_access_connections: true
hide_connections_menu: false
```

## 🔄 Próximos Passos (Opcional)

- [ ] Adicionar permissões granulares (criar, editar, deletar)
- [ ] Log de mudanças de permissões
- [ ] Permissões por grupo/role
- [ ] API para verificação em massa de permissões

---

**Autor:** GitHub Copilot  
**Data:** 2024  
**Versão:** 1.0.0
