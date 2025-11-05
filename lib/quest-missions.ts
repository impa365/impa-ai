/**
 * Definições de Missões, Níveis e Badges do IMPA Quest
 */

import { Mission, QuestLevel, Badge } from '@/types/quest'

/**
 * Níveis e Títulos
 */
export const QUEST_LEVELS: QuestLevel[] = [
  { level: 1, title: "Cadete", minXP: 0, maxXP: 500, color: "slate", icon: "🎖️" },
  { level: 2, title: "Explorador", minXP: 500, maxXP: 1200, color: "blue", icon: "🔭" },
  { level: 3, title: "Oficial", minXP: 1200, maxXP: 2500, color: "purple", icon: "⚡" },
  { level: 4, title: "Comandante", minXP: 2500, maxXP: 5000, color: "violet", icon: "🚀" },
  { level: 5, title: "Almirante", minXP: 5000, maxXP: 10000, color: "fuchsia", icon: "🛸" },
  { level: 6, title: "Lenda IMPA", minXP: 10000, maxXP: Infinity, color: "yellow", icon: "👑" },
]

/**
 * Badges/Conquistas
 */
export const QUEST_BADGES: Badge[] = [
  // Beginner Badges
  {
    id: "first-steps",
    name: "Primeiro Comando",
    description: "Complete o tour inicial pelo painel",
    icon: "🎖️",
    category: "beginner",
    rarity: "common"
  },
  {
    id: "engineer-junior",
    name: "Engenheiro Júnior",
    description: "Configure suas primeiras integrações (APIs e N8N)",
    icon: "🔧",
    category: "beginner",
    rarity: "common"
  },
  
  // Intermediate Badges
  {
    id: "galactic-communicator",
    name: "Comunicador Galáctico",
    description: "Crie sua primeira conexão WhatsApp",
    icon: "📡",
    category: "intermediate",
    rarity: "rare"
  },
  {
    id: "ai-creator",
    name: "Criador de IA",
    description: "Crie e configure seu primeiro agente de IA",
    icon: "🤖",
    category: "intermediate",
    rarity: "rare"
  },
  {
    id: "portal-guardian",
    name: "Guardião dos Portais",
    description: "Crie um link compartilhado para seu agente",
    icon: "🚪",
    category: "intermediate",
    rarity: "rare"
  },
  
  // Advanced Badges
  {
    id: "session-master",
    name: "Mestre das Sessões",
    description: "Gerencie sessões de bot com maestria",
    icon: "⚡",
    category: "advanced",
    rarity: "epic"
  },
  {
    id: "quantum-architect",
    name: "Arquiteto Quântico",
    description: "Crie um agente Uazapi com configurações avançadas",
    icon: "🌀",
    category: "advanced",
    rarity: "epic"
  },
  {
    id: "fleet-admiral",
    name: "Almirante da Frota",
    description: "Gerencie múltiplas conexões simultaneamente",
    icon: "🛸",
    category: "advanced",
    rarity: "epic"
  },
  
  // Master Badges
  {
    id: "impa-legend",
    name: "Lenda IMPA",
    description: "Complete todas as missões e domine a plataforma",
    icon: "👑",
    category: "master",
    rarity: "legendary",
    hidden: true
  },
  {
    id: "quantum-flash",
    name: "Flash Quântico",
    description: "Crie um agente completo em menos de 2 minutos",
    icon: "⚡",
    category: "master",
    rarity: "legendary"
  },
  {
    id: "perfectionist",
    name: "Perfeccionista",
    description: "Complete uma missão sem usar hints e sem erros",
    icon: "💎",
    category: "master",
    rarity: "legendary"
  },
  {
    id: "collector",
    name: "Colecionador Supremo",
    description: "Desbloqueie todos os badges",
    icon: "🏆",
    category: "master",
    rarity: "legendary",
    hidden: true
  }
]

/**
 * Missões Disponíveis
 */
export const QUEST_MISSIONS: Mission[] = [
  // ========================================
  // MISSÕES DE CADETE (Beginner)
  // ========================================
  {
    id: "first-steps",
    title: "Primeiros Passos na Nave",
    description: "Bem-vindo, Comandante! Faça um tour pelo seu painel de controle e conheça a Frota IMPA.",
    category: "beginner",
    icon: "🎖️",
    estimatedTime: 3,
    difficulty: 1,
    steps: [
      {
        id: "welcome",
        title: "Conheça a ARIA",
        description: "A ARIA será sua assistente nesta jornada!",
        target: {
          action: "wait"
        },
        hints: [
          "Clique no avatar da ARIA no canto superior direito para expandir",
          "A ARIA aparecerá automaticamente quando você iniciar missões"
        ],
        ariaDialogue: [
          "Olá, Comandante! 👋",
          "Eu sou a ARIA - Assistente Robótica de Inteligência Avançada!",
          "Estou aqui para guiá-lo pela Academia de Exploradores IMPA.",
          "Juntos, vamos transformá-lo em um mestre da plataforma! 🚀",
          "Pronto para começar sua jornada?"
        ]
      },
      {
        id: "navigate-dashboard",
        title: "Explorar o Dashboard",
        description: "Navegue até o painel principal",
        target: {
          page: "/dashboard",
          action: "navigate"
        },
        hints: [
          "Clique no logo IMPA no canto superior esquerdo",
          "Ou use o menu lateral para acessar 'Dashboard'"
        ],
        ariaDialogue: [
          "Perfeito! Agora vamos ao seu painel de controle. 🎯",
          "É aqui que você verá estatísticas, agentes ativos e muito mais.",
          "Clique em 'Dashboard' no menu lateral para acessar."
        ]
      },
      {
        id: "view-stats",
        title: "Visualizar Estatísticas",
        description: "Observe o painel de estatísticas",
        target: {
          element: "[data-quest-id='dashboard-stats']",
          action: "wait"
        },
        hints: [
          "As estatísticas mostram quantos agentes e conexões você tem",
          "Conforme você criar mais recursos, estes números aumentarão"
        ],
        ariaDialogue: [
          "Excelente! Este é seu painel de estatísticas. 📊",
          "Aqui você vê rapidamente: agentes, conexões e links criados.",
          "Por enquanto está vazio, mas logo estará cheio de vida! 🌟"
        ]
      }
    ],
    rewards: {
      xp: 100,
      badges: ["first-steps"]
    }
  },
  
  {
    id: "configure-integrations",
    title: "Configurando os Motores de Propulsão",
    description: "Configure suas APIs (Evolution/Uazapi) e N8N para dar vida aos seus agentes.",
    category: "beginner",
    icon: "🔧",
    estimatedTime: 5,
    difficulty: 2,
    steps: [
      {
        id: "navigate-settings",
        title: "Acessar Configurações",
        description: "Navegue até a área de configurações",
        target: {
          page: "/admin/settings",
          action: "navigate"
        },
        hints: [
          "No menu lateral, procure por 'Configurações'",
          "Está na seção administrativa do painel"
        ],
        ariaDialogue: [
          "Hora de configurar os motores da nave! 🔧",
          "Vamos até as Configurações do sistema.",
          "É aqui que você conecta as APIs externas que fazem a mágica acontecer."
        ]
      },
      {
        id: "view-evolution-config",
        title: "Configurar Evolution API",
        description: "Localize a seção de Evolution API",
        target: {
          element: "[data-quest-id='evolution-api-config']",
          action: "wait"
        },
        hints: [
          "A Evolution API é usada para conexões WhatsApp",
          "Você precisará da URL do servidor e uma API Key"
        ],
        ariaDialogue: [
          "Aqui está a configuração da Evolution API! 📡",
          "Esta API permite criar conexões WhatsApp profissionais.",
          "Você pode configurar agora ou pular se preferir usar Uazapi."
        ],
        optional: true
      },
      {
        id: "view-n8n-config",
        title: "Configurar N8N Webhooks",
        description: "Localize a seção de N8N",
        target: {
          element: "[data-quest-id='n8n-config']",
          action: "wait"
        },
        hints: [
          "N8N é a ferramenta de automação de workflows",
          "Você precisa configurar webhooks para cada tipo de ação"
        ],
        ariaDialogue: [
          "E aqui temos o N8N! 🔄",
          "É o cérebro dos seus agentes - onde a lógica de IA acontece.",
          "Você precisará configurar webhooks para 'Novo Agente', 'Sessão', etc.",
          "Sem pressa! Você pode voltar aqui quando precisar. 😊"
        ]
      }
    ],
    rewards: {
      xp: 200,
      badges: ["engineer-junior"],
      unlocks: ["create-first-connection"]
    }
  },
  
  // ========================================
  // MISSÕES DE OFICIAL (Intermediate)
  // ========================================
  {
    id: "create-first-connection",
    title: "Estabelecendo Comunicação Interestelar",
    description: "Crie sua primeira conexão WhatsApp e estabeleça um canal de comunicação.",
    category: "intermediate",
    icon: "📡",
    estimatedTime: 7,
    difficulty: 2,
    prerequisites: ["configure-integrations"],
    steps: [
      {
        id: "navigate-whatsapp",
        title: "Acessar Terminal de Comunicações",
        description: "Navegue até a seção WhatsApp",
        target: {
          page: "/admin/whatsapp",
          action: "navigate"
        },
        hints: [
          "No menu lateral, procure por 'WhatsApp'",
          "É identificado por um ícone de mensagem"
        ],
        ariaDialogue: [
          "Hora de estabelecer comunicação com o cosmos! 🌌",
          "Vamos à seção de WhatsApp para criar sua primeira conexão.",
          "É aqui que tudo começa! 📱"
        ]
      },
      {
        id: "click-new-connection",
        title: "Iniciar Nova Conexão",
        description: "Clique no botão de nova conexão",
        target: {
          element: "[data-quest-id='new-connection-button']",
          action: "click"
        },
        hints: [
          "Procure pelo botão 'Nova Conexão WhatsApp'",
          "Geralmente está no topo da página com destaque"
        ],
        ariaDialogue: [
          "Vejo o botão ali! ✨",
          "Clique em 'Nova Conexão WhatsApp' para começar.",
          "É o botão azul brilhante - impossível não notar! 😄"
        ]
      },
      {
        id: "fill-connection-name",
        title: "Nomear a Conexão",
        description: "Dê um nome identificável para esta conexão",
        target: {
          element: "[name='connection_name']",
          action: "fill"
        },
        validation: {
          type: "element",
          condition: "value.length >= 3"
        },
        hints: [
          "Use um nome que faça sentido, como 'Suporte' ou 'Vendas'",
          "Isso ajuda quando você tiver várias conexões"
        ],
        ariaDialogue: [
          "Agora vamos batizar sua nave... ops, conexão! 🚀",
          "Escolha um nome claro e descritivo.",
          "Exemplos: 'Atendimento Principal', 'Equipe de Vendas', 'Suporte 24h'."
        ]
      },
      {
        id: "select-api-type",
        title: "Escolher Tipo de API",
        description: "Selecione Evolution ou Uazapi",
        target: {
          element: "[data-quest-id='api-type-select']",
          action: "click"
        },
        hints: [
          "Evolution API: Mais comum, requer QR Code",
          "Uazapi: Alternativa com recursos similares"
        ],
        ariaDialogue: [
          "Momento de escolher o tipo de propulsão! ⚡",
          "Evolution API é a mais usada e testada.",
          "Uazapi é uma alternativa igualmente poderosa.",
          "Escolha a que você já configurou! 😊"
        ]
      },
      {
        id: "complete-connection",
        title: "Finalizar Criação",
        description: "Salve a conexão e gere o QR Code",
        target: {
          element: "[data-quest-id='save-connection-button']",
          action: "click"
        },
        validation: {
          type: "api",
          endpoint: "/api/whatsapp-connections"
        },
        hints: [
          "Revise todos os campos antes de salvar",
          "Você poderá editar depois se precisar"
        ],
        ariaDialogue: [
          "Quase lá, Comandante! 🎉",
          "Clique em 'Salvar' para criar sua conexão.",
          "Em seguida, você verá um QR Code para escanear com WhatsApp!"
        ]
      }
    ],
    rewards: {
      xp: 300,
      badges: ["galactic-communicator"],
      unlocks: ["create-first-agent"]
    }
  },
  
  {
    id: "create-first-agent",
    title: "Criando Seu Primeiro Androide de Missão",
    description: "Configure seu primeiro agente de IA que atenderá automaticamente no WhatsApp!",
    category: "intermediate",
    icon: "🤖",
    estimatedTime: 10,
    difficulty: 3,
    prerequisites: ["create-first-connection"],
    steps: [
      {
        id: "navigate-agents",
        title: "Acessar Hangar de Androides",
        description: "Navegue até a seção de Agentes",
        target: {
          page: "/admin/agents",
          action: "navigate"
        },
        hints: [
          "No menu lateral, procure por 'Agentes de IA'",
          "É onde você gerencia todos os seus bots"
        ],
        ariaDialogue: [
          "Bem-vindo ao Hangar de Androides! 🤖",
          "Aqui você cria e gerencia seus agentes de IA.",
          "Cada agente é como um assistente virtual dedicado! ✨"
        ]
      },
      {
        id: "click-new-agent",
        title: "Iniciar Criação",
        description: "Clique em 'Novo Agente'",
        target: {
          element: "[data-quest-id='new-agent-button']",
          action: "click"
        },
        hints: [
          "Procure pelo botão 'Novo Agente' ou 'Criar Agente'",
          "Deve estar no topo da lista de agentes"
        ],
        ariaDialogue: [
          "Hora de dar vida ao seu primeiro androide! 🌟",
          "Clique no botão 'Novo Agente' para começar.",
          "Prepare-se para uma experiência incrível!"
        ]
      },
      {
        id: "fill-agent-name",
        title: "Nomear o Agente",
        description: "Dê um nome ao seu agente",
        target: {
          element: "[name='name']",
          action: "fill"
        },
        validation: {
          type: "element",
          condition: "value.length >= 3"
        },
        hints: [
          "Use um nome relacionado à função, ex: 'Assistente de Vendas'",
          "Ou um nome pessoal como 'Ana', 'João', etc."
        ],
        ariaDialogue: [
          "Todo androide precisa de um nome! 🎭",
          "Escolha algo que represente a função dele.",
          "Exemplos: 'Assistente Virtual', 'Suporte Bot', 'Atendente Clara'."
        ]
      },
      {
        id: "select-connection",
        title: "Vincular à Conexão",
        description: "Selecione a conexão WhatsApp criada anteriormente",
        target: {
          element: "[data-quest-id='connection-select']",
          action: "click"
        },
        hints: [
          "Escolha a conexão que você criou na missão anterior",
          "Cada agente precisa estar vinculado a uma conexão"
        ],
        ariaDialogue: [
          "Agora vamos conectar seu agente a um canal de comunicação! 📡",
          "Selecione a conexão WhatsApp que você criou antes.",
          "É como dar um telefone ao seu assistente! 📱"
        ]
      },
      {
        id: "configure-prompt",
        title: "Definir Personalidade",
        description: "Configure o prompt do sistema (personalidade do agente)",
        target: {
          element: "[data-quest-id='system-prompt']",
          action: "fill"
        },
        hints: [
          "O prompt define como o agente se comporta e responde",
          "Seja claro sobre o papel e tom de voz dele",
          "Exemplo: 'Você é um assistente prestativo e amigável...'"
        ],
        ariaDialogue: [
          "Esta é a parte mais importante: a personalidade! 🧠",
          "O prompt do sistema diz ao agente COMO ele deve agir.",
          "Seja específico: formal ou casual? Técnico ou simples?",
          "Experimente e ajuste depois - a prática leva à perfeição! 💡"
        ]
      },
      {
        id: "save-agent",
        title: "Ativar Androide",
        description: "Salve e ative seu primeiro agente",
        target: {
          element: "[data-quest-id='save-agent-button']",
          action: "click"
        },
        validation: {
          type: "api",
          endpoint: "/api/admin/agents"
        },
        hints: [
          "Revise todas as configurações antes de salvar",
          "Você pode voltar e editar a qualquer momento"
        ],
        ariaDialogue: [
          "Está pronto, Comandante! 🎉",
          "Clique em 'Salvar' para dar vida ao seu agente!",
          "Em poucos segundos, ele estará ativo e pronto para atender! 🚀",
          "Parabéns pela criação! Você está dominando isso! 💪"
        ]
      }
    ],
    rewards: {
      xp: 500,
      badges: ["ai-creator"],
      unlocks: ["create-shared-link", "manage-sessions"]
    }
  },
  
  {
    id: "create-shared-link",
    title: "Portal de Acesso Compartilhado",
    description: "Crie um link público para que qualquer pessoa possa conversar com seu agente!",
    category: "intermediate",
    icon: "🚪",
    estimatedTime: 5,
    difficulty: 2,
    prerequisites: ["create-first-agent"],
    steps: [
      {
        id: "navigate-agents-list",
        title: "Acessar Lista de Agentes",
        description: "Volte para a lista de agentes",
        target: {
          page: "/admin/agents",
          action: "navigate"
        },
        hints: [
          "Use o menu lateral para voltar aos agentes",
          "Ou clique em 'Voltar' se estiver na tela de edição"
        ],
        ariaDialogue: [
          "Vamos criar um portal de acesso público! 🌐",
          "Primeiro, precisamos voltar à lista de agentes.",
          "Lá você verá opções adicionais para cada agente."
        ]
      },
      {
        id: "open-agent-menu",
        title: "Abrir Menu do Agente",
        description: "Clique no menu de ações do agente criado",
        target: {
          element: "[data-quest-id='agent-actions-menu']",
          action: "click"
        },
        hints: [
          "Procure pelo ícone de três pontos (⋮) na linha do agente",
          "Ou um botão de 'Ações' ao lado do nome"
        ],
        ariaDialogue: [
          "Viu aquele menu de ações ao lado do agente? 📋",
          "Clique nele para ver as opções disponíveis.",
          "É ali que a mágica dos links compartilhados acontece! ✨"
        ]
      },
      {
        id: "click-shared-links",
        title: "Acessar Links Compartilhados",
        description: "Clique em 'Links Compartilhados'",
        target: {
          element: "[data-quest-id='shared-links-option']",
          action: "click"
        },
        hints: [
          "Procure pela opção 'Links' ou 'Compartilhar'",
          "Pode ter um ícone de corrente ou link 🔗"
        ],
        ariaDialogue: [
          "Perfeito! Agora clique em 'Links Compartilhados'. 🔗",
          "Aqui você pode criar portais de acesso públicos ou privados.",
          "É super útil para colocar no seu site ou compartilhar! 🌟"
        ]
      },
      {
        id: "create-new-link",
        title: "Criar Novo Link",
        description: "Clique em 'Novo Link'",
        target: {
          element: "[data-quest-id='new-link-button']",
          action: "click"
        },
        hints: [
          "Deve haver um botão 'Novo Link' ou '+ Criar Link'",
          "Geralmente está no topo da lista de links"
        ],
        ariaDialogue: [
          "Hora de abrir um novo portal! 🚪",
          "Clique em 'Novo Link' para começar.",
          "Você poderá configurar segurança, expiração e muito mais!"
        ]
      },
      {
        id: "configure-link",
        title: "Configurar Segurança",
        description: "Configure as opções do link (senha, expiração, etc.)",
        target: {
          element: "[data-quest-id='link-config-form']",
          action: "wait"
        },
        hints: [
          "Você pode adicionar senha para links privados",
          "Ou definir data de expiração para links temporários",
          "Links sem restrições ficam públicos permanentemente"
        ],
        ariaDialogue: [
          "Aqui você define as regras do portal! 🛡️",
          "Quer que seja público? Deixe sem senha.",
          "Quer restringir? Adicione senha ou data de expiração.",
          "Configure conforme sua necessidade! 😊"
        ]
      },
      {
        id: "save-link",
        title: "Ativar Portal",
        description: "Salve e copie o link gerado",
        target: {
          element: "[data-quest-id='save-link-button']",
          action: "click"
        },
        validation: {
          type: "api",
          endpoint: "/api/integrations/links"
        },
        hints: [
          "Após salvar, copie o link gerado",
          "Você pode compartilhá-lo em redes sociais, sites, etc."
        ],
        ariaDialogue: [
          "Quase lá! 🎉",
          "Clique em 'Salvar' para ativar o portal.",
          "Seu link será gerado e você poderá copiá-lo!",
          "Parabéns! Agora qualquer pessoa pode conversar com seu agente! 🌟"
        ]
      }
    ],
    rewards: {
      xp: 250,
      badges: ["portal-guardian"]
    }
  },
  
  // ========================================
  // MISSÕES AVANÇADAS
  // ========================================
  {
    id: "manage-sessions",
    title: "Gerenciamento de Sessões Espaciais",
    description: "Aprenda a controlar sessões individuais: pausar, reativar e entender os 4 estados.",
    category: "advanced",
    icon: "⚡",
    estimatedTime: 8,
    difficulty: 3,
    prerequisites: ["create-first-agent"],
    steps: [
      {
        id: "navigate-to-sessions",
        title: "Acessar Sessões do Agente",
        description: "Navegue até a página de sessões de um agente",
        target: {
          element: "[data-quest-id='view-sessions-button']",
          action: "click"
        },
        hints: [
          "Na lista de agentes, procure pelo botão 'Sessões'",
          "Pode estar no menu de ações do agente"
        ],
        ariaDialogue: [
          "Vamos explorar o controle de missões! 🎯",
          "Sessões são conversas individuais que o agente está gerenciando.",
          "Clique em 'Sessões' para ver todas ativas!"
        ]
      },
      {
        id: "understand-states",
        title: "Entender os 4 Estados",
        description: "Aprenda sobre Ativa, Pausada, Inativa e Apagada",
        target: {
          action: "wait"
        },
        hints: [
          "Ativa (🟢): Bot respondendo normalmente",
          "Pausada (⏸️): Bot silenciado temporariamente",
          "Inativa (⭕): Marcada para exclusão, oculta",
          "Apagada (🗑️): Removida permanentemente após 30 dias"
        ],
        ariaDialogue: [
          "Existem 4 estados de sessão, Comandante! 📊",
          "🟢 ATIVA: O bot está conversando normalmente.",
          "⏸️ PAUSADA: Você pausou temporariamente (ex: para atender pessoalmente).",
          "⭕ INATIVA: Marcada para exclusão, não aparece mais na lista.",
          "🗑️ APAGADA: Deletada permanentemente após 30 dias.",
          "Você tem controle total! 💪"
        ]
      },
      {
        id: "pause-session",
        title: "Pausar uma Sessão",
        description: "Teste pausar uma sessão ativa",
        target: {
          element: "[data-quest-id='pause-session-button']",
          action: "click"
        },
        hints: [
          "Procure pelo ícone de pausa (⏸️) na linha da sessão",
          "Útil quando você quer assumir o atendimento manualmente"
        ],
        ariaDialogue: [
          "Vamos testar o controle manual! ⏸️",
          "Clique no botão de pausa em uma sessão ativa.",
          "Isso faz o bot parar de responder naquele chat específico.",
          "Você pode retomar quando quiser! 🔄"
        ],
        optional: true
      },
      {
        id: "resume-session",
        title: "Retomar uma Sessão",
        description: "Reative uma sessão pausada",
        target: {
          element: "[data-quest-id='resume-session-button']",
          action: "click"
        },
        hints: [
          "Procure pelo ícone de play (▶️) na sessão pausada",
          "Isso reativa o bot para aquele chat"
        ],
        ariaDialogue: [
          "Ótimo! Agora vamos reativar. ▶️",
          "Clique no botão de play para retomar.",
          "O bot volta a responder automaticamente! 🤖✨"
        ],
        optional: true
      },
      {
        id: "filter-sessions",
        title: "Filtrar Sessões",
        description: "Use os filtros para visualizar apenas sessões ativas ou pausadas",
        target: {
          element: "[data-quest-id='session-filter']",
          action: "click"
        },
        hints: [
          "Filtros ajudam a encontrar sessões específicas rapidamente",
          "Especialmente útil quando você tem muitas conversas"
        ],
        ariaDialogue: [
          "Com muitas sessões, os filtros são seus aliados! 🔍",
          "Teste filtrar apenas 'Ativas' ou 'Pausadas'.",
          "Isso facilita muito o gerenciamento! 📋"
        ]
      }
    ],
    rewards: {
      xp: 400,
      badges: ["session-master"]
    }
  },
  
  {
    id: "advanced-uazapi-agent",
    title: "Agente Multi-Dimensional (Uazapi Avançado)",
    description: "Crie um agente Uazapi com configurações avançadas: gatilhos, debounce, bot padrão.",
    category: "advanced",
    icon: "🌀",
    estimatedTime: 12,
    difficulty: 4,
    prerequisites: ["create-first-agent"],
    steps: [
      {
        id: "start-uazapi-agent",
        title: "Iniciar Agente Uazapi",
        description: "Crie um novo agente selecionando uma conexão Uazapi",
        target: {
          page: "/admin/agents",
          action: "navigate"
        },
        hints: [
          "Você precisa ter uma conexão Uazapi configurada",
          "Se não tiver, crie uma primeiro em WhatsApp"
        ],
        ariaDialogue: [
          "Hora de dominar as configurações avançadas! 🌀",
          "Vamos criar um agente Uazapi com recursos especiais.",
          "Você poderá configurar gatilhos inteligentes! ⚡"
        ]
      },
      {
        id: "configure-trigger",
        title: "Configurar Gatilho",
        description: "Defina quando o bot deve responder (Palavra-chave, Todos, Nenhum)",
        target: {
          element: "[data-quest-id='bot-trigger-select']",
          action: "click"
        },
        hints: [
          "Palavra-chave: Responde apenas se a mensagem contém algo específico",
          "Todos: Responde a qualquer mensagem",
          "Nenhum: Apenas para bots padrão (fallback)"
        ],
        ariaDialogue: [
          "Gatilhos dão controle preciso sobre quando o bot age! 🎯",
          "Escolha 'Palavra-chave' para responder apenas quando detectar algo.",
          "Ou 'Todos' para responder sempre.",
          "'Nenhum' é usado para bots padrão (veremos isso em breve!)"
        ]
      },
      {
        id: "configure-keyword",
        title: "Definir Palavra-chave",
        description: "Configure a palavra ou frase que ativa o bot",
        target: {
          element: "[data-quest-id='bot-keyword-input']",
          action: "fill"
        },
        hints: [
          "Você pode usar operadores: Contém, Igual, Começa Com, Regex",
          "Exemplo: 'vendas', 'suporte', 'preço'"
        ],
        ariaDialogue: [
          "Agora defina a palavra mágica! ✨",
          "Quando alguém enviar essa palavra, o bot entra em ação!",
          "Seja específico para evitar ativações acidentais. 🎯"
        ],
        skipCondition: "botTrigger !== 'Palavra-chave'"
      },
      {
        id: "configure-debounce",
        title: "Configurar Debounce",
        description: "Defina o tempo de espera antes de responder",
        target: {
          element: "[data-quest-id='bot-debounce-input']",
          action: "fill"
        },
        hints: [
          "Debounce evita respostas muito rápidas",
          "Útil quando o usuário está digitando várias mensagens",
          "Valores comuns: 3000ms (3 segundos) a 10000ms (10 segundos)"
        ],
        ariaDialogue: [
          "Debounce é um recurso inteligente! ⏱️",
          "Ele espera alguns segundos antes de responder.",
          "Assim, se o usuário enviar várias mensagens seguidas...",
          "O bot processa tudo junto e responde de uma vez! 🧠"
        ]
      },
      {
        id: "set-default-bot",
        title: "Configurar Bot Padrão",
        description: "Ative a opção 'Bot Padrão da Conexão'",
        target: {
          element: "[data-quest-id='bot-default-switch']",
          action: "click"
        },
        hints: [
          "Bot Padrão é o fallback quando nenhum outro bot responde",
          "Só pode haver um bot padrão por conexão",
          "Quando ativo, o gatilho vira 'Nenhum' automaticamente"
        ],
        ariaDialogue: [
          "Bot Padrão é o guardião final! 🛡️",
          "Se nenhum bot responder por palavra-chave...",
          "O bot padrão assume e garante que o cliente seja atendido!",
          "É a rede de segurança da sua conexão! 🌟"
        ],
        optional: true
      },
      {
        id: "configure-ignore-jids",
        title: "Configurar Ignorar JIDs",
        description: "Adicione números ou grupos que o bot deve ignorar",
        target: {
          element: "[data-quest-id='bot-ignore-jids']",
          action: "fill"
        },
        hints: [
          "JIDs são identificadores únicos de contatos/grupos",
          "Use @g.us para ignorar grupos",
          "Separe múltiplos valores por vírgula"
        ],
        ariaDialogue: [
          "Às vezes você quer que o bot ignore certos lugares. 🚫",
          "Por exemplo: grupos internos, número do dono, etc.",
          "Adicione os JIDs que devem ser ignorados!",
          "Dica: '@g.us' ignora TODOS os grupos! 📱"
        ],
        optional: true
      },
      {
        id: "save-advanced-agent",
        title: "Ativar Agente Avançado",
        description: "Salve todas as configurações avançadas",
        target: {
          element: "[data-quest-id='save-agent-button']",
          action: "click"
        },
        validation: {
          type: "api",
          endpoint: "/api/admin/agents"
        },
        hints: [
          "Revise todas as configurações avançadas",
          "Você criou um agente muito mais poderoso agora!"
        ],
        ariaDialogue: [
          "Incrível, Comandante! 🎉",
          "Você configurou um agente com recursos avançados!",
          "Gatilhos, debounce, bot padrão... você dominou tudo!",
          "Este é o poder da plataforma IMPA! 💪✨"
        ]
      }
    ],
    rewards: {
      xp: 600,
      badges: ["quantum-architect"]
    }
  },
  
  // ========================================
  // MISSÃO MASTER
  // ========================================
  {
    id: "speedrun-challenge",
    title: "Desafio: Velocidade da Luz",
    description: "Crie um agente completo em menos de 2 minutos! Prove sua maestria!",
    category: "master",
    icon: "⚡",
    estimatedTime: 2,
    difficulty: 5,
    prerequisites: ["create-first-agent"],
    steps: [
      {
        id: "speedrun-start",
        title: "Aceitar o Desafio",
        description: "O cronômetro começa quando você clicar em 'Novo Agente'",
        target: {
          action: "wait"
        },
        hints: [
          "Prepare tudo antes: saiba qual conexão usar, o nome do agente, etc.",
          "Use atalhos de teclado quando possível",
          "Foque na velocidade, mas sem erros!"
        ],
        ariaDialogue: [
          "DESAFIO ACEITO! ⚡",
          "Você tem 120 segundos para criar um agente completo!",
          "Prepare-se... quando clicar em 'Novo Agente', o tempo começa!",
          "Boa sorte, Lenda! 🏆"
        ]
      },
      {
        id: "speedrun-complete",
        title: "Completar em Tempo Recorde",
        description: "Finalize a criação do agente em menos de 2 minutos",
        target: {
          action: "custom"
        },
        validation: {
          type: "custom",
          condition: "elapsed_time < 120000" // 120 segundos
        },
        hints: [
          "Sem dicas no speedrun! Você já sabe tudo! 💪"
        ],
        ariaDialogue: [
          "VAI VAI VAI! ⚡⚡⚡",
          "Você está voando!",
          "FALTA POUCO!",
          "INCRÍVEL! VOCÊ CONSEGUIU! 🎊🏆"
        ]
      }
    ],
    rewards: {
      xp: 800,
      badges: ["quantum-flash"]
    }
  }
]

/**
 * Obter nível baseado no XP
 */
export function getLevelFromXP(xp: number): QuestLevel {
  return QUEST_LEVELS.find(level => xp >= level.minXP && xp < level.maxXP) || QUEST_LEVELS[0]
}

/**
 * Obter XP necessário para próximo nível
 */
export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = getLevelFromXP(currentXP)
  return currentLevel.maxXP === Infinity ? 0 : currentLevel.maxXP - currentXP
}

/**
 * Verificar se missão está desbloqueada
 */
export function isMissionUnlocked(missionId: string, completedMissions: string[] = []): boolean {
  const mission = QUEST_MISSIONS.find(m => m.id === missionId)
  if (!mission) return false
  
  if (!mission.prerequisites || mission.prerequisites.length === 0) return true
  
  // Garantir que completedMissions seja sempre um array
  const completed = completedMissions || []
  return mission.prerequisites.every(prereq => completed.includes(prereq))
}

/**
 * Obter missões disponíveis para o usuário
 */
export function getAvailableMissions(completedMissions: string[] = []): Mission[] {
  // Garantir que completedMissions seja sempre um array
  const completed = completedMissions || []
  
  return QUEST_MISSIONS.filter(mission => {
    const isCompleted = completed.includes(mission.id)
    const isUnlocked = isMissionUnlocked(mission.id, completed)
    return !isCompleted && isUnlocked
  })
}

/**
 * Obter badge por ID
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return QUEST_BADGES.find(badge => badge.id === badgeId)
}

