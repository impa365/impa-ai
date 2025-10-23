/**
 * Hook para gerenciar o sistema de tutorial gamificado
 */

'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import useSWR from 'swr'
import { 
  QuestProgress, 
  Mission, 
  MissionStep, 
  ARIAState, 
  QuestSystemContext,
  AchievementEvent 
} from '@/types/quest'
import { 
  QUEST_MISSIONS, 
  getLevelFromXP, 
  getAvailableMissions,
  getBadgeById 
} from '@/lib/quest-missions'

const QuestContext = createContext<QuestSystemContext | null>(null)

/**
 * Fetcher para SWR
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Hook principal do sistema de quests
 */
export function useQuestSystem() {
  const context = useContext(QuestContext)
  if (!context) {
    throw new Error('useQuestSystem must be used within QuestProvider')
  }
  return context
}

/**
 * Provider do sistema de quests
 */
export function QuestProvider({ children }: { children: React.ReactNode }) {
  // Estado do progresso do usuário
  const { data: progress, mutate: refreshProgress, isLoading, error } = useSWR<QuestProgress>(
    '/api/quest-progress',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onSuccess: (data) => {
        console.log('✅ [QUEST PROVIDER] Dados carregados com sucesso:', data)
      },
      onError: (err) => {
        console.error('❌ [QUEST PROVIDER] Erro ao carregar dados:', err)
      }
    }
  )

  // DEBUG: Logs do estado
  console.log('🔄 [QUEST PROVIDER] isLoading:', isLoading)
  console.log('🔄 [QUEST PROVIDER] error:', error)
  console.log('🔄 [QUEST PROVIDER] progress:', progress)

  // Estado da ARIA
  const [ariaState, setAriaState] = useState<ARIAState>({
    isExpanded: false,
    currentDialogue: [],
    currentDialogueIndex: 0,
    suggestedActions: [],
    currentHint: null,
    hasNewHint: false,
    mood: 'happy'
  })

  // Missão e step ativos
  const [activeMission, setActiveMission] = useState<Mission | null>(null)
  const [activeStep, setActiveStep] = useState<MissionStep | null>(null)

  // Eventos de conquista (para mostrar modais)
  const [achievementEvents, setAchievementEvents] = useState<AchievementEvent[]>([])

  /**
   * Atualizar missão ativa baseado no progresso
   */
  useEffect(() => {
    console.log('🔄 [QUEST HOOK] Recalculando missão/step ativo')
    console.log('🔄 [QUEST HOOK] Progress:', progress)
    console.log('🔄 [QUEST HOOK] activeMissionId:', progress?.activeMissionId)
    
    if (!progress || !progress.activeMissionId) {
      console.log('⚠️ [QUEST HOOK] Sem missão ativa, limpando state')
      setActiveMission(null)
      setActiveStep(null)
      return
    }

    const mission = QUEST_MISSIONS.find(m => m.id === progress.activeMissionId)
    if (mission && progress.missionProgress) {
      setActiveMission(mission)
      
      const stepIndex = progress.missionProgress.currentStepIndex
      console.log('📍 [QUEST HOOK] currentStepIndex:', stepIndex)
      console.log('📍 [QUEST HOOK] Total steps:', mission.steps.length)
      
      if (stepIndex < mission.steps.length) {
        const step = mission.steps[stepIndex]
        console.log('✅ [QUEST HOOK] Setando activeStep:', step.id, step.title)
        setActiveStep(step)
        
        // Atualizar diálogo da ARIA com o step atual
        setAriaState(prev => ({
          ...prev,
          currentDialogue: step.ariaDialogue,
          currentDialogueIndex: 0,
          currentHint: null,
          hasNewHint: true
        }))
      } else {
        console.log('⚠️ [QUEST HOOK] stepIndex >= total steps, missão completa?')
      }
    } else {
      console.log('⚠️ [QUEST HOOK] Missão não encontrada ou sem missionProgress')
    }
  }, [progress])

  /**
   * Iniciar uma missão
   */
  const startMission = useCallback(async (missionId: string) => {
    try {
      const response = await fetch('/api/quest-progress/start-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start mission')
      }

      const updated = await response.json()
      await refreshProgress()

      // Expandir ARIA automaticamente
      setAriaState(prev => ({ ...prev, isExpanded: true, mood: 'excited' }))

      return updated
    } catch (error) {
      console.error('Error starting mission:', error)
      throw error
    }
  }, [refreshProgress])

  /**
   * Completar um step
   */
  const completeStep = useCallback(async (stepId: string) => {
    if (!activeMission || !progress) return

    console.log('📝 [QUEST HOOK] Completando step:', stepId)
    console.log('📝 [QUEST HOOK] Missão ativa:', activeMission.id)

    try {
      const response = await fetch('/api/quest-progress/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          missionId: activeMission.id,
          stepId 
        })
      })

      if (!response.ok) throw new Error('Failed to complete step')

      const updated = await response.json()
      console.log('✅ [QUEST HOOK] Step completado, atualizando progresso...')
      
      await refreshProgress()
      console.log('✅ [QUEST HOOK] Progresso atualizado!')

      // Mostrar ARIA celebrando
      setAriaState(prev => ({ ...prev, mood: 'celebrating' }))

      return updated
    } catch (error) {
      console.error('❌ [QUEST HOOK] Error completing step:', error)
      throw error
    }
  }, [activeMission, progress, refreshProgress])

  /**
   * Completar uma missão
   */
  const completeMission = useCallback(async () => {
    if (!activeMission || !progress) return

    try {
      const response = await fetch('/api/quest-progress/complete-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          missionId: activeMission.id 
        })
      })

      if (!response.ok) throw new Error('Failed to complete mission')

      const updated = await response.json()
      
      // Calcular recompensas
      const oldLevel = getLevelFromXP(progress.totalXP).level
      const newLevel = getLevelFromXP(updated.totalXP).level
      const leveledUp = newLevel > oldLevel

      console.log('🎁 [COMPLETE MISSION] Badge IDs da missão:', activeMission.rewards.badges)
      
      const badges = activeMission.rewards.badges
        .map(badgeId => {
          const badge = getBadgeById(badgeId)
          console.log(`🔍 [COMPLETE MISSION] Badge ${badgeId}:`, badge)
          return badge
        })
        .filter(Boolean)
      
      console.log('🏆 [COMPLETE MISSION] Badges finais:', badges)

      // Criar evento de conquista
      const event: AchievementEvent = {
        type: 'mission_complete',
        data: {
          xp: activeMission.rewards.xp,
          badges: badges as any,
          oldLevel: leveledUp ? oldLevel : undefined,
          newLevel: leveledUp ? newLevel : undefined,
          mission: activeMission,
          time: progress.missionProgress?.lastActivityAt 
            ? Date.now() - new Date(progress.missionProgress.startedAt).getTime()
            : undefined
        }
      }

      setAchievementEvents(prev => [...prev, event])
      await refreshProgress()

      // ARIA muito feliz
      setAriaState(prev => ({ ...prev, mood: 'celebrating', isExpanded: true }))

      return updated
    } catch (error) {
      console.error('Error completing mission:', error)
      throw error
    }
  }, [activeMission, progress, refreshProgress])

  /**
   * Abandonar missão atual
   */
  const abandonMission = useCallback(async () => {
    if (!activeMission) {
      console.log('⚠️ [QUEST] Não há missão ativa para abandonar')
      return
    }

    try {
      const response = await fetch('/api/quest-progress/abandon-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      // Se retornar 400, provavelmente já não tem missão ativa - não é erro crítico
      if (!response.ok && response.status !== 400) {
        throw new Error('Failed to abandon mission')
      }

      if (response.status === 400) {
        console.log('⚠️ [QUEST] Missão já foi abandonada ou não está ativa')
      }

      await refreshProgress()
      setAriaState(prev => ({ ...prev, mood: 'concerned' }))
    } catch (error) {
      console.error('Error abandoning mission:', error)
      throw error
    }
  }, [activeMission, refreshProgress])

  /**
   * Usar uma hint
   */
  const useHint = useCallback(() => {
    if (!activeStep) return

    const hints = activeStep.hints
    if (hints.length === 0) return

    // Pega uma hint aleatória
    const randomHint = hints[Math.floor(Math.random() * hints.length)]
    
    setAriaState(prev => ({
      ...prev,
      currentHint: randomHint,
      hasNewHint: true,
      isExpanded: true,
      mood: 'thinking'
    }))

    // Registrar uso de hint
    fetch('/api/quest-progress/use-hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(console.error)
  }, [activeStep])

  /**
   * Toggle ARIA
   */
  const toggleARIA = useCallback(() => {
    setAriaState(prev => ({ 
      ...prev, 
      isExpanded: !prev.isExpanded,
      hasNewHint: false
    }))
  }, [])

  /**
   * Expandir ARIA (sempre abre, não faz toggle)
   */
  const expandARIA = useCallback(() => {
    setAriaState(prev => ({ 
      ...prev, 
      isExpanded: true,
      hasNewHint: false
    }))
  }, [])

  /**
   * Atualizar preferências
   */
  const updatePreferences = useCallback(async (prefs: Partial<QuestProgress['preferences']>) => {
    try {
      const response = await fetch('/api/quest-progress/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      await refreshProgress()
    } catch (error) {
      console.error('Error updating preferences:', error)
      throw error
    }
  }, [refreshProgress])

  /**
   * Missões disponíveis (exclui completas E ativa)
   */
  const availableMissions = progress 
    ? getAvailableMissions(progress.completedMissions || []).filter(
        mission => mission.id !== progress.activeMissionId
      )
    : []

  const contextValue: QuestSystemContext = {
    progress,
    isLoading,
    activeMission,
    activeStep,
    ariaState,
    availableMissions,
    startMission,
    completeStep,
    completeMission,
    abandonMission,
    useHint,
    toggleARIA,
    expandARIA,
    updatePreferences,
    refreshProgress
  }

  return (
    <QuestContext.Provider value={contextValue}>
      {children}
    </QuestContext.Provider>
  )
}

/**
 * Hook para eventos de conquista (usado pelos modais)
 */
export function useAchievementEvents() {
  const [events, setEvents] = useState<AchievementEvent[]>([])

  const addEvent = useCallback((event: AchievementEvent) => {
    setEvents(prev => [...prev, event])
  }, [])

  const clearEvent = useCallback((index: number) => {
    setEvents(prev => prev.filter((_, i) => i !== index))
  }, [])

  return { events, addEvent, clearEvent }
}

/**
 * Hook para validar steps automaticamente
 */
export function useStepValidation(step: MissionStep | null) {
  const { completeStep } = useQuestSystem()
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!step || !step.validation) return

    const validate = async () => {
      setIsValidating(true)

      try {
        if (step.validation.type === 'api' && step.validation.endpoint) {
          // Validar via API
          const response = await fetch(step.validation.endpoint)
          if (response.ok) {
            await completeStep(step.id)
          }
        } else if (step.validation.type === 'element' && step.target.element) {
          // Validar elemento DOM
          const element = document.querySelector(step.target.element) as HTMLInputElement
          if (element && step.validation.condition) {
            // Avaliar condição (simplificado)
            const isValid = eval(step.validation.condition.replace('value', `"${element.value}"`))
            if (isValid) {
              await completeStep(step.id)
            }
          }
        }
      } catch (error) {
        console.error('Validation error:', error)
      } finally {
        setIsValidating(false)
      }
    }

    // Validar periodicamente se houver validação
    const interval = setInterval(validate, 2000)
    return () => clearInterval(interval)
  }, [step, completeStep])

  return { isValidating }
}

