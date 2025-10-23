/**
 * QuestSystemManager - Orquestrador completo do sistema de quests
 * Gerencia todos os componentes e o estado global
 */

'use client'

import { useState, useEffect } from 'react'
import { QuestProvider, useQuestSystem } from '@/hooks/use-quest-system'
import { QuestFAB } from './quest-fab'
import { ARIADialogue } from './aria-dialogue'
import { QuestPanel } from './quest-panel'
import { ElementHighlight } from './element-highlight'
import { MissionCompleteModal } from './mission-complete-modal'
import { QuestTutorialGuide } from './quest-tutorial-guide'
import { ElementHighlightConfig, AchievementEvent } from '@/types/quest'

/**
 * Componente interno que usa o contexto
 */
function QuestSystemContent() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isARIAOpen, setIsARIAOpen] = useState(false)
  const [highlightConfig, setHighlightConfig] = useState<ElementHighlightConfig | null>(null)
  const [achievementEvent, setAchievementEvent] = useState<AchievementEvent | null>(null)
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)

  const { 
    activeStep, 
    activeMission, 
    ariaState,
    completeStep,
    completeMission,
    progress
  } = useQuestSystem()

  // DEBUG: Log do progresso no Content
  console.log('📦 [QUEST CONTENT] Progress recebido:', progress)
  console.log('📦 [QUEST CONTENT] Preferências:', progress?.preferences)

  // Abrir ARIA automaticamente quando há novos diálogos
  useEffect(() => {
    if (ariaState.hasNewHint && !isARIAOpen) {
      setIsARIAOpen(true)
    }
  }, [ariaState.hasNewHint])

  // Gerenciar highlight do elemento ativo
  useEffect(() => {
    if (!activeStep || !activeStep.target.element) {
      setHighlightConfig(null)
      return
    }

    // Aguardar um pouco para garantir que o elemento existe no DOM
    const timer = setTimeout(() => {
      const element = document.querySelector(activeStep.target.element!) as HTMLElement
      if (element) {
        setHighlightConfig({
          element,
          title: activeStep.title,
          description: activeStep.description,
          allowInteraction: activeStep.target.action === 'click' || activeStep.target.action === 'fill',
          showArrow: true,
          pulse: true
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [activeStep])

  // Detectar quando step é completado
  useEffect(() => {
    if (!activeStep) return

    const handleInteraction = async () => {
      // Aguardar um pouco para capturar a interação
      await new Promise(resolve => setTimeout(resolve, 300))
      
      try {
        await completeStep(activeStep.id)
        
        // Limpar highlight
        setHighlightConfig(null)
        
        // Verificar se completou a missão
        if (activeMission && progress?.missionProgress) {
          const totalSteps = activeMission.steps.length
          const completedSteps = (progress.missionProgress.completedSteps?.length || 0) + 1
          
          if (completedSteps >= totalSteps) {
            // Missão completa!
            const result = await completeMission()
            
            // Mostrar modal de celebração
            if (result) {
              // Criar evento de conquista
              const event: AchievementEvent = {
                type: 'mission_complete',
                data: {
                  xp: activeMission.rewards.xp,
                  mission: activeMission,
                  // Os badges e level up virão do resultado da API
                }
              }
              setAchievementEvent(event)
              setIsCompletionModalOpen(true)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao completar step:', error)
      }
    }

    // Escutar eventos baseados no tipo de ação
    if (activeStep.target.action === 'click' && highlightConfig?.element) {
      highlightConfig.element.addEventListener('click', handleInteraction)
      return () => highlightConfig.element.removeEventListener('click', handleInteraction)
    } else if (activeStep.target.action === 'fill' && highlightConfig?.element) {
      highlightConfig.element.addEventListener('input', handleInteraction)
      return () => highlightConfig.element.removeEventListener('input', handleInteraction)
    }
  }, [activeStep, highlightConfig, activeMission, progress])

  // Não mostrar o sistema de quests em páginas de autenticação
  const isAuthPage = typeof window !== 'undefined' && window.location.pathname.includes('/auth/')
  console.log('🔍 [QUEST CONTENT] Está em página de auth?', isAuthPage)
  console.log('🔍 [QUEST CONTENT] URL atual:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')
  if (isAuthPage) {
    console.log('⚠️ [QUEST CONTENT] Não renderizando - Página de autenticação')
    return null
  }

  // Não mostrar se o usuário desabilitou
  // IMPORTANTE: undefined ou true = mostrar | false = não mostrar
  const showARIA = progress?.preferences?.showARIA
  console.log('🔍 [QUEST CONTENT] showARIA preferência:', showARIA)
  console.log('🔍 [QUEST CONTENT] Decisão: mostrar?', showARIA !== false)
  if (progress && showARIA === false) {
    console.log('⚠️ [QUEST CONTENT] Não renderizando - Usuário desabilitou ARIA explicitamente')
    return null
  }

  console.log('✅ [QUEST CONTENT] Renderizando Quest System!')

  return (
    <>
      {/* FAB Arrastável sempre visível */}
      <QuestFAB
        onOpenPanel={() => setIsPanelOpen(true)}
        onOpenARIA={() => setIsARIAOpen(true)}
      />

      {/* ARIA Dialogue */}
      <ARIADialogue
        isOpen={isARIAOpen}
        onClose={() => setIsARIAOpen(false)}
      />

      {/* Quest Panel (Sheet lateral) */}
      <QuestPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />

      {/* Tutorial Guide com Spotlight (NOVO - substitui Element Highlight) */}
      <QuestTutorialGuide />

      {/* Element Highlight (ANTIGO - será removido) */}
      {/* <ElementHighlight
        config={highlightConfig}
        onInteraction={() => {
          // Limpar highlight após interação
          setTimeout(() => setHighlightConfig(null), 500)
        }}
      /> */}

      {/* Mission Complete Modal */}
      <MissionCompleteModal
        event={achievementEvent}
        isOpen={isCompletionModalOpen}
        onClose={() => {
          setIsCompletionModalOpen(false)
          setAchievementEvent(null)
        }}
      />
    </>
  )
}

/**
 * Componente principal exportado (com Provider)
 */
export function QuestSystemManager() {
  return (
    <QuestProvider>
      <QuestSystemContent />
    </QuestProvider>
  )
}

