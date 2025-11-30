# 🧪 Guia Visual de Teste - Sistema de Permissões

## 🎯 Objetivo
Testar o sistema de controle de permissões de acesso a Agentes e Conexões WhatsApp.

---

## ✅ Teste 1: Criar Usuário com Permissões Limitadas

### Passo 1: Acessar Painel Admin
```
1. Fazer login como admin
2. Ir para /admin/users
3. Clicar em "Novo Usuário"
```

### Passo 2: Preencher Dados Básicos
```
Nome: Usuário Teste
Email: teste@exemplo.com
Senha: teste123
Função: Usuário
Status: Ativo
```

### Passo 3: Configurar Permissões
```
┌─────────────────────────────────────────────┐
│ Permissões de Acesso                        │
├─────────────────────────────────────────────┤
│ ☐ Pode acessar Agentes IA                   │ ← DESMARCAR
│    ☑ Ocultar Agentes do menu                │ ← MARCAR
│                                              │
│ ☑ Pode acessar Conexões WhatsApp            │ ← DEIXAR MARCADO
│                                              │
└─────────────────────────────────────────────┘
```

### Passo 4: Salvar e Verificar
```
✅ Clicar em "Criar Usuário"
✅ Verificar mensagem de sucesso
✅ Usuário deve aparecer na lista
```

**Resultado Esperado:**
- ✅ Usuário criado com sucesso
- ✅ `can_access_agents = false`
- ✅ `hide_agents_menu = true`
- ✅ `can_access_connections = true`

---

## ✅ Teste 2: Login com Usuário Limitado

### Passo 1: Logout do Admin
```
1. Clicar em "Sair" no painel admin
2. Aguardar redirect para tela de login
```

### Passo 2: Login com Usuário Teste
```
Email: teste@exemplo.com
Senha: teste123
```

### Passo 3: Verificar Menu Lateral
```
Menu Esperado:
┌──────────────────┐
│ 🏠 Dashboard     │
│ 📱 WhatsApp      │  ← Deve estar visível
│ ⚙️ Configurações │
└──────────────────┘

NÃO DEVE TER:
│ 🤖 Agentes IA    │  ← Deve estar oculto
```

**Resultado Esperado:**
- ✅ Menu sem item "Agentes IA"
- ✅ Item "WhatsApp" presente
- ✅ Dashboard e Configurações presentes

---

## ✅ Teste 3: Acesso Direto por URL

### Tentar Acessar Agentes Diretamente
```
1. Na barra de endereço, digitar: /dashboard/agents
2. Pressionar Enter
```

### Verificar Mensagem de Bloqueio
```
Deve aparecer:
┌─────────────────────────────────────────────┐
│ ❌ Acesso Negado                            │
│                                              │
│ Você não tem permissão para acessar a       │
│ funcionalidade de Agentes IA. Entre em      │
│ contato com um administrador para solicitar │
│ acesso.                                      │
└─────────────────────────────────────────────┘
```

**Resultado Esperado:**
- ✅ Página de agentes NÃO carrega
- ✅ Mensagem de bloqueio é exibida
- ✅ Nenhum dado de agentes é mostrado

---

## ✅ Teste 4: Acesso ao WhatsApp (Permitido)

### Clicar no Menu WhatsApp
```
1. No menu lateral, clicar em "WhatsApp"
2. Página /dashboard/whatsapp deve carregar
```

**Resultado Esperado:**
- ✅ Página carrega normalmente
- ✅ Lista de conexões é exibida
- ✅ Botão "Nova Conexão" disponível
- ✅ Nenhuma mensagem de bloqueio

---

## ✅ Teste 5: Editar Permissões (Admin)

### Passo 1: Logout e Login como Admin
```
1. Logout do usuário teste
2. Login como admin novamente
```

### Passo 2: Editar Usuário Teste
```
1. Ir para /admin/users
2. Encontrar "Usuário Teste"
3. Clicar em editar (ícone de lápis)
```

### Passo 3: Conceder Acesso a Agentes
```
┌─────────────────────────────────────────────┐
│ Permissões de Acesso                        │
├─────────────────────────────────────────────┤
│ ☑ Pode acessar Agentes IA                   │ ← MARCAR
│                                              │ ← hide_agents_menu sumiu!
│ ☑ Pode acessar Conexões WhatsApp            │
│                                              │
└─────────────────────────────────────────────┘
```

### Passo 4: Salvar e Verificar
```
✅ Clicar em "Salvar Alterações"
✅ Verificar mensagem de sucesso
```

**Resultado Esperado:**
- ✅ Permissão atualizada
- ✅ `can_access_agents = true`
- ✅ `hide_agents_menu` automaticamente = `false`

---

## ✅ Teste 6: Verificar Acesso Restaurado

### Passo 1: Logout e Login como Usuário Teste
```
Email: teste@exemplo.com
Senha: teste123
```

### Passo 2: Verificar Menu Lateral
```
Menu Esperado (COMPLETO):
┌──────────────────┐
│ 🏠 Dashboard     │
│ 🤖 Agentes IA    │  ← Agora está visível!
│ 📱 WhatsApp      │
│ ⚙️ Configurações │
└──────────────────┘
```

### Passo 3: Acessar Agentes
```
1. Clicar em "Agentes IA" no menu
2. Página deve carregar normalmente
```

**Resultado Esperado:**
- ✅ Item "Agentes IA" presente no menu
- ✅ Página de agentes carrega sem bloqueio
- ✅ Lista de agentes é exibida
- ✅ Botão "Novo Agente" disponível

---

## ✅ Teste 7: Bloquear Tudo

### Admin Bloqueia Ambos os Acessos
```
┌─────────────────────────────────────────────┐
│ Permissões de Acesso                        │
├─────────────────────────────────────────────┤
│ ☐ Pode acessar Agentes IA                   │ ← DESMARCAR
│    ☑ Ocultar Agentes do menu                │ ← MARCAR
│                                              │
│ ☐ Pode acessar Conexões WhatsApp            │ ← DESMARCAR
│    ☑ Ocultar Conexões do menu               │ ← MARCAR
└─────────────────────────────────────────────┘
```

### Usuário Teste Vê Menu Mínimo
```
Menu (APENAS ESSENCIAIS):
┌──────────────────┐
│ 🏠 Dashboard     │
│ ⚙️ Configurações │
└──────────────────┘
```

**Resultado Esperado:**
- ✅ Sem "Agentes IA" no menu
- ✅ Sem "WhatsApp" no menu
- ✅ Dashboard e Configurações presentes
- ✅ Acesso direto por URL bloqueado para ambos

---

## 📊 Matriz de Testes

| Permissão           | hide_menu | Menu Visível? | Acesso URL? | Mensagem Bloqueio? |
|---------------------|-----------|---------------|-------------|--------------------|
| `can_access = true` | `false`   | ✅ Sim        | ✅ Sim      | ❌ Não             |
| `can_access = true` | `true`    | ✅ Sim        | ✅ Sim      | ❌ Não             |
| `can_access = false`| `false`   | ✅ Sim        | ❌ Não      | ✅ Sim             |
| `can_access = false`| `true`    | ❌ Não        | ❌ Não      | ✅ Sim             |

---

## 🐛 Problemas Conhecidos

### ❌ Menu não atualiza após login?
**Solução:** Fazer refresh da página (F5)

### ❌ Checkbox "ocultar" não aparece?
**Verificar:** `can_access` deve estar desmarcado primeiro

### ❌ Permissão não salva?
**Verificar:** 
1. Console do navegador (F12)
2. Response da API `/api/admin/users`
3. Banco de dados (query direto)

---

## 🎯 Checklist de Testes

- [ ] ✅ Criar usuário com permissões limitadas
- [ ] ✅ Menu oculta itens bloqueados
- [ ] ✅ Acesso direto por URL é bloqueado
- [ ] ✅ Mensagem de bloqueio é exibida
- [ ] ✅ Acesso permitido funciona normalmente
- [ ] ✅ Editar permissões funciona
- [ ] ✅ Checkbox condicional funciona
- [ ] ✅ Auto-reset de hide_menu funciona
- [ ] ✅ Bloquear tudo deixa menu mínimo

---

## 📸 Screenshots Esperados

### 1. Modal de Edição (Acesso Negado)
```
[✓] Pode acessar Agentes IA
    [ ] Ocultar Agentes do menu  ← Opção não aparece

[X] Pode acessar Agentes IA      ← Desmarcado
    [✓] Ocultar Agentes do menu  ← Agora aparece!
```

### 2. Menu Lateral (Acesso Completo)
```
🏠 Dashboard
🤖 Agentes IA        ← Visível
📱 WhatsApp          ← Visível
⚙️ Configurações
```

### 3. Menu Lateral (Sem Agentes)
```
🏠 Dashboard
📱 WhatsApp          ← Visível
⚙️ Configurações
                     ← Agentes não está aqui!
```

### 4. Página Bloqueada
```
┌─────────────────────┐
│ ❌ Acesso Negado    │
│ Você não tem...     │
└─────────────────────┘
```

---

**Autor:** GitHub Copilot  
**Data:** 2024  
**Versão:** 1.0.0
