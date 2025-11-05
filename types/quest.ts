/**
 * Sistema de Tutorial Gamificado IMPA Quest
 * Tipos e interfaces para o sistema de missões
 */

export type MissionCategory = 'beginner' | 'intermediate' | 'advanced' | 'master'
export type MissionStepAction = 'click' | 'fill' | 'navigate' | 'wait' | 'custom'

/**
 * Nível do jogador
 */
export interface QuestLevel {
  level: number
  title: string
  minXP: number
  maxXP: number
  color: string
  icon: string
}

/**
 * Badge/Conquista
 */
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: MissionCategory
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  hidden?: boolean // Se true, não mostra até desbloquear
}

/**
 * Step de uma missão
 */
export interface MissionStep {
  id: string
  title: string
  description: string
  target: {
    page?: string // Ex: '/admin/settings'
    element?: string // Seletor CSS ou data-quest-id
    action?: MissionStepAction
    value?: string // Para ações de 'fill'
  }
  validation?: {
    type: 'api' | 'element' | 'custom'
    endpoint?: string // Para validação via API
    condition?: string // Condição a verificar
  }
  hints: string[]
  ariaDialogue: string[]
  optional?: boolean // Se true, pode pular este step
  skipCondition?: string // Condição para pular automaticamente
}

/**
 * Missão completa
 */
export interface Mission {
  id: string
  title: string
  description: string
  category: MissionCategory
  icon: string
  steps: MissionStep[]
  rewards: {
    xp: number
    badges: string[]
    unlocks?: string[] // IDs de próximas missões desbloqueadas
  }
  prerequisites?: string[] // IDs de missões necessárias antes
  estimatedTime?: number // Minutos estimados
  difficulty?: 1 | 2 | 3 | 4 | 5 // 1 = muito fácil, 5 = muito difícil
}

/**
 * Progresso de uma missão ativa
 */
export interface ActiveMissionProgress {
  missionId: string
  currentStepIndex: number
  completedSteps: string[]
  startedAt: Date
  lastActivityAt: Date
  attempts: number // Quantas vezes tentou completar steps
  hintsUsed: number
  errors: number
}

/**
 * Progresso completo do usuário
 */
export interface QuestProgress {
  id: string
  userId: string
  totalXP: number
  currentLevel: number
  completedMissions: string[]
  unlockedBadges: string[]
  activeMissionId: string | null
  missionProgress: ActiveMissionProgress | null
  stats: {
    totalMissionsCompleted: number
    fastestSpeedrun: number | null // Segundos
    perfectMissions: number // Missões sem erros
    totalHintsUsed?: number
    totalTimeSpent?: number // Segundos
  }
  preferences: {
    soundEnabled: boolean
    autoStartMissions: boolean
    showARIA: boolean
    celebrationEffects?: boolean
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * Ação sugerida pela ARIA
 */
export interface SuggestedAction {
  id: string
  label: string
  icon: string
  action: () => void | Promise<void>
  primary?: boolean
}

/**
 * Estado da ARIA (assistente)
 */
export interface ARIAState {
  isExpanded: boolean
  currentDialogue: string[]
  currentDialogueIndex: number
  suggestedActions: SuggestedAction[]
  currentHint: string | null
  hasNewHint: boolean
  mood: 'happy' | 'excited' | 'thinking' | 'concerned' | 'celebrating'
}

/**
 * Contexto do sistema de quests
 */
export interface QuestSystemContext {
  progress: QuestProgress | null
  isLoading: boolean
  activeMission: Mission | null
  activeStep: MissionStep | null
  ariaState: ARIAState
  availableMissions: Mission[]
  
  // Actions
  startMission: (missionId: string) => Promise<void>
  completeStep: (stepId: string) => Promise<void>
  completeMission: () => Promise<void>
  abandonMission: () => Promise<void>
  useHint: () => void
  toggleARIA: () => void
  expandARIA: () => void
  updatePreferences: (prefs: Partial<QuestProgress['preferences']>) => Promise<void>
  refreshProgress: () => Promise<void>
}

/**
 * Evento de conquista
 */
export interface AchievementEvent {
  type: 'mission_complete' | 'level_up' | 'badge_unlock' | 'speedrun'
  data: {
    xp?: number
    badges?: Badge[]
    oldLevel?: number
    newLevel?: number
    mission?: Mission
    time?: number
  }
}

/**
 * Configuração de highlight de elemento
 */
export interface ElementHighlightConfig {
  element: HTMLElement
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  allowInteraction?: boolean
  showArrow?: boolean
  pulse?: boolean
}

