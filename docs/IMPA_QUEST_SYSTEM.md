# 🎮 IMPA Quest - Sistema de Tutorial Gamificado

## 📋 Visão Geral

O **IMPA Quest** é um sistema completo de tutorial gamificado com tema espacial que transforma o aprendizado da plataforma em uma aventura interativa e divertida. O usuário assume o papel de um **Comandante** da **Frota IMPA** e completa missões para dominar a plataforma.

---

## 🌟 Características Principais

### 🎭 **Personalidade: ARIA**
- **Assistente Robótica de Inteligência Avançada**
- Guia o usuário com diálogos dinâmicos e animados
- Exibe hints, dicas e ações sugeridas
- Reage ao progresso com diferentes "moods"

### 🏆 **Sistema de Níveis e XP**
- 6 níveis de progressão (Cadete → Lenda IMPA)
- XP ganhados ao completar missões
- Barra de progresso animada em tempo real
- Level up com celebração visual

### 🎯 **Missões Categorizadas**
- **Cadete (Beginner)**: Introdução ao painel
- **Oficial (Intermediate)**: Criação de conexões e agentes
- **Comandante (Advanced)**: Gerenciamento avançado
- **Lenda (Master)**: Desafios de maestria e speedruns

### 🏅 **Badges/Conquistas**
- 12 badges com diferentes raridades (Common → Legendary)
- Badges secretos (hidden) desbloqueados por ações especiais
- Celebração visual ao desbloquear

### ✨ **Destacamento Inteligente de Elementos**
- Overlay escuro com "spotlight" no elemento alvo
- Bordas animadas brilhantes
- Setas indicativas
- Tooltips explicativos

---

## 🏗️ Arquitetura

### **Banco de Dados**

```sql
-- Tabela principal
CREATE TABLE impaai.user_quest_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES impaai.user_profiles(id),
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  completed_missions JSONB DEFAULT '[]',
  unlocked_badges JSONB DEFAULT '[]',
  active_mission_id TEXT NULL,
  mission_progress JSONB,
  stats JSONB,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar nível automaticamente baseado no XP
CREATE TRIGGER trigger_update_quest_level
  BEFORE INSERT OR UPDATE OF total_xp
  ON impaai.user_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION impaai.update_quest_level();
```

### **API Routes**

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/quest-progress` | GET | Buscar progresso do usuário (auto-cria se não existe) |
| `/api/quest-progress/start-mission` | POST | Iniciar uma nova missão |
| `/api/quest-progress/complete-step` | POST | Completar um step da missão ativa |
| `/api/quest-progress/complete-mission` | POST | Completar missão e conceder recompensas |
| `/api/quest-progress/abandon-mission` | POST | Abandonar missão ativa |
| `/api/quest-progress/use-hint` | POST | Registrar uso de hint (estatísticas) |
| `/api/quest-progress/preferences` | PATCH | Atualizar preferências do usuário |

### **Componentes React**

#### **QuestSystemManager** (Orquestrador)
- Provider do contexto
- Gerencia estado global
- Coordena todos os componentes

#### **QuestHUD** (Heads-Up Display)
- Mini perfil do comandante
- Barra de XP animada
- Missão ativa
- Avatar da ARIA minimizado

#### **ARIADialogue**
- Assistente virtual expandida
- Diálogos com typing effect
- Ações sugeridas
- Botão para hints

#### **ElementHighlight**
- Overlay com recorte
- Spotlight animado
- Setas indicativas
- Tooltips flutuantes

#### **QuestPanel** (Sheet Lateral)
- Lista de missões disponíveis/ativas/completadas
- Galeria de badges
- Estatísticas do jogador

#### **MissionCompleteModal**
- Celebração com confetti
- Animações de XP, badges e level up
- Resumo de recompensas

---

## 📚 Missões Disponíveis

### 🎖️ **Nível Cadete (Beginner)**

#### 1. "Primeiros Passos na Nave"
- **XP**: 100 | **Badge**: Primeiro Comando
- Tour pelo dashboard
- Conhecer a ARIA
- Visualizar estatísticas

#### 2. "Configurando os Motores de Propulsão"
- **XP**: 200 | **Badge**: Engenheiro Júnior
- Acessar configurações
- Configurar Evolution API / Uazapi
- Configurar N8N webhooks

### ⚡ **Nível Oficial (Intermediate)**

#### 3. "Estabelecendo Comunicação Interestelar"
- **XP**: 300 | **Badge**: Comunicador Galáctico
- Criar primeira conexão WhatsApp
- Gerar QR Code
- Conectar instância

#### 4. "Criando Seu Primeiro Androide de Missão"
- **XP**: 500 | **Badge**: Criador de IA
- Criar primeiro agente de IA
- Configurar modelo e prompt
- Vincular à conexão
- Ativar agente

#### 5. "Portal de Acesso Compartilhado"
- **XP**: 250 | **Badge**: Guardião dos Portais
- Criar link compartilhado
- Configurar segurança (senha, expiração)

### 🌀 **Nível Comandante (Advanced)**

#### 6. "Gerenciamento de Sessões Espaciais"
- **XP**: 400 | **Badge**: Mestre das Sessões
- Entender os 4 estados (Ativa, Pausada, Inativa, Apagada)
- Pausar e reativar sessões
- Usar filtros

#### 7. "Agente Multi-Dimensional (Uazapi Avançado)"
- **XP**: 600 | **Badge**: Arquiteto Quântico
- Configurar gatilhos (palavra-chave, todos, nenhum)
- Configurar debounce
- Definir bot padrão
- Configurar ignoreJids

### 👑 **Nível Lenda (Master)**

#### 8. "Desafio: Velocidade da Luz"
- **XP**: 800 | **Badge**: Flash Quântico
- Criar agente completo em < 2 minutos
- Cronômetro em tempo real

---

## 🎮 Sistema de Níveis

| Nível | Título | XP Mínimo | XP Máximo | Ícone |
|-------|--------|-----------|-----------|-------|
| 1 | Cadete | 0 | 500 | 🎖️ |
| 2 | Explorador | 500 | 1,200 | 🔭 |
| 3 | Oficial | 1,200 | 2,500 | ⚡ |
| 4 | Comandante | 2,500 | 5,000 | 🚀 |
| 5 | Almirante | 5,000 | 10,000 | 🛸 |
| 6 | Lenda IMPA | 10,000 | ∞ | 👑 |

---

## 🏅 Badges Disponíveis

### Common (Comuns)
- 🎖️ **Primeiro Comando** - Complete o tour inicial
- 🔧 **Engenheiro Júnior** - Configure integrações

### Rare (Raros)
- 📡 **Comunicador Galáctico** - Crie primeira conexão
- 🤖 **Criador de IA** - Crie primeiro agente
- 🚪 **Guardião dos Portais** - Crie link compartilhado

### Epic (Épicos)
- ⚡ **Mestre das Sessões** - Gerencie sessões
- 🌀 **Arquiteto Quântico** - Crie agente Uazapi avançado
- 🛸 **Almirante da Frota** - Gerencie múltiplas conexões

### Legendary (Lendários)
- 👑 **Lenda IMPA** - Complete todas as missões (secreto)
- ⚡ **Flash Quântico** - Speedrun em < 2min
- 💎 **Perfeccionista** - Missão perfeita (sem erros/hints)
- 🏆 **Colecionador Supremo** - Desbloqueie todos os badges (secreto)

---

## 🎨 Efeitos Visuais

### **Animações**
- **Typing Effect**: Texto digitando em tempo real
- **Confetti**: Chuva de confetes ao completar missão
- **Pulse**: Pulso de destaque em elementos
- **Scale Spring**: Animações de escala com mola
- **Gradient Flow**: Gradientes animados na barra de XP

### **Moods da ARIA**
| Mood | Cor | Comportamento |
|------|-----|---------------|
| Happy | Cyan → Blue | Estado padrão |
| Excited | Yellow → Orange | Ao iniciar missão |
| Thinking | Purple → Pink | Ao mostrar hint |
| Concerned | Gray | Ao abandonar missão |
| Celebrating | Green → Emerald | Ao completar missão |

---

## 🔧 Integração nas Páginas

### **Data Quest IDs Adicionados**

Para que o sistema de destaque funcione, adicione os seguintes `data-quest-id` nos elementos:

```tsx
// Dashboard
<div data-quest-id="dashboard-stats">...</div>

// WhatsApp Connections
<Button data-quest-id="new-connection-button">Nova Conexão</Button>

// Agents
<Button data-quest-id="new-agent-button">Criar Agente</Button>

// Agent Modal
<Select data-quest-id="connection-select">...</Select>
<Textarea data-quest-id="system-prompt">...</Textarea>
<Select data-quest-id="bot-trigger-select">...</Select>
<Input data-quest-id="bot-keyword-input">...</Input>
<Input data-quest-id="bot-debounce-input">...</Input>
<Switch data-quest-id="bot-default-switch">...</Switch>
<Textarea data-quest-id="bot-ignore-jids">...</Textarea>
<Button data-quest-id="save-agent-button">Salvar</Button>

// Session Management
<Button data-quest-id="view-sessions-button">Sessões</Button>
<Button data-quest-id="pause-session-button">Pausar</Button>
<Button data-quest-id="resume-session-button">Retomar</Button>
<Select data-quest-id="session-filter">...</Select>

// Shared Links
<div data-quest-id="agent-actions-menu">...</div>
<button data-quest-id="shared-links-option">Links Compartilhados</button>
<Button data-quest-id="new-link-button">Novo Link</Button>
<form data-quest-id="link-config-form">...</form>
<Button data-quest-id="save-link-button">Salvar</Button>

// Settings
<div data-quest-id="evolution-api-config">...</div>
<div data-quest-id="n8n-config">...</div>
```

---

## 🚀 Como Usar

### **Para o Usuário**

1. **Faça login** no sistema
2. O **QuestHUD** aparecerá automaticamente no canto superior direito
3. Clique no **ícone de bússola** para abrir o painel de missões
4. Escolha uma missão disponível e clique em **"Iniciar Missão"**
5. Siga as instruções da **ARIA** e interaja com os elementos destacados
6. Complete os steps para ganhar **XP** e **badges**!

### **Para Desenvolvedores**

#### **Adicionar Nova Missão**

1. Edite `lib/quest-missions.ts`
2. Adicione a missão ao array `QUEST_MISSIONS`:

```typescript
{
  id: "nova-missao",
  title: "Título da Missão",
  description: "Descrição curta",
  category: "intermediate",
  icon: "🚀",
  estimatedTime: 5,
  difficulty: 2,
  steps: [
    {
      id: "step-1",
      title: "Primeiro Passo",
      description: "Faça X",
      target: {
        element: "[data-quest-id='elemento']",
        action: "click"
      },
      hints: ["Dica 1", "Dica 2"],
      ariaDialogue: [
        "Olá! Vamos fazer isso...",
        "Clique aqui para continuar!"
      ]
    }
  ],
  rewards: {
    xp: 300,
    badges: ["novo-badge"]
  },
  prerequisites: ["missao-anterior"]
}
```

3. Se necessário, adicione o badge em `QUEST_BADGES`

#### **Desabilitar Sistema para Usuários Específicos**

```typescript
// No componente QuestSystemManager
if (progress && !progress.preferences?.showARIA) return null
```

Ou via API:
```typescript
await fetch('/api/quest-progress/preferences', {
  method: 'PATCH',
  body: JSON.stringify({ showARIA: false })
})
```

---

## 📊 Estatísticas Rastreadas

O sistema rastreia automaticamente:
- ✅ Total de XP ganho
- ✅ Nível atual
- ✅ Missões completadas
- ✅ Badges desbloqueados
- ✅ Missões perfeitas (sem erros/hints)
- ✅ Tempo total gasto
- ✅ Hints usados
- ✅ Melhor tempo em speedruns

---

## 🎯 Próximas Funcionalidades (Sugestões)

- [ ] Leaderboard global de XP
- [ ] Missões diárias/semanais
- [ ] Conquistas secretas especiais
- [ ] Modo competitivo (speedrun ranking)
- [ ] Customização de avatar
- [ ] Eventos sazonais
- [ ] Missões cooperativas (multi-usuário)
- [ ] Loja de recompensas (trocar XP por benefícios)

---

## 🐛 Troubleshooting

### **ARIA não aparece**
- Verifique se o usuário tem `preferences.showARIA = true`
- Verifique se não está em página de autenticação
- Confirme que o `QuestSystemManager` está no layout

### **Elemento não destaca**
- Confirme que o `data-quest-id` está correto no HTML
- Verifique se o elemento existe no DOM quando o step é ativado
- Use DevTools para inspecionar o elemento

### **Missão não completa**
- Verifique os logs do console para erros na API
- Confirme que todos os steps têm validação correta
- Teste manualmente a rota `/api/quest-progress/complete-mission`

---

## 📝 Changelog

### v1.0.0 - Implementação Inicial
- ✅ Sistema completo de quests
- ✅ 9 missões iniciais
- ✅ 12 badges
- ✅ 6 níveis de progressão
- ✅ ARIA - Assistente virtual
- ✅ Element highlighting
- ✅ Celebração visual
- ✅ Integração com banco de dados
- ✅ APIs completas

---

## 👥 Créditos

**Sistema desenvolvido por**: Cursor AI Assistant  
**Inspiração**: Tutoriais de jogos AAA + Onboarding interativo  
**Framework**: Next.js 15 + React 19  
**Banco de Dados**: PostgreSQL (Supabase)  
**Animações**: Framer Motion  
**UI**: shadcn/ui + Tailwind CSS  

---

## 📄 Licença

Este sistema é parte da plataforma IMPA AI e segue a mesma licença do projeto principal.

---

**🚀 Boa sorte na sua jornada, Comandante! A Frota IMPA conta com você! ✨**

