/**
 * QuestPanel - Painel completo de missões
 * Sheet lateral com todas as missões, badges e estatísticas
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  Rocket,
  Trophy,
  Star,
  Award,
  Lock,
  CheckCircle2,
  Play,
  Clock,
  Zap,
  Target,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  GripVertical
} from 'lucide-react'
import { useQuestSystem } from '@/hooks/use-quest-system'
import { Mission, Badge as QuestBadge } from '@/types/quest'
import { QUEST_MISSIONS, QUEST_BADGES, QUEST_LEVELS, getLevelFromXP } from '@/lib/quest-missions'
import { cn } from '@/lib/utils'

interface QuestPanelProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Card de Missão
 */
function MissionCard({ 
  mission, 
  isCompleted, 
  isActive, 
  isLocked,
  onStart 
}: { 
  mission: Mission
  isCompleted: boolean
  isActive: boolean
  isLocked: boolean
  onStart: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(isActive)
  
  const categoryColors = {
    beginner: 'from-emerald-400 to-teal-500',
    intermediate: 'from-blue-400 to-purple-500',
    advanced: 'from-purple-400 to-pink-500',
    master: 'from-yellow-400 to-orange-500'
  }

  const categoryIcons = {
    beginner: '🎖️',
    intermediate: '⚡',
    advanced: '🌀',
    master: '👑'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all bg-gradient-to-br from-slate-900 to-slate-800 border-2",
        isActive && "border-cyan-400 shadow-2xl shadow-cyan-500/40 bg-cyan-950/30",
        isCompleted && "border-green-400 opacity-80 bg-green-950/20",
        isLocked && "opacity-50 cursor-not-allowed border-gray-700",
        !isActive && !isCompleted && !isLocked && "border-purple-500/40 hover:border-purple-400"
      )}>
        {/* Gradiente de fundo baseado na categoria */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r shadow-lg",
          categoryColors[mission.category]
        )} />

        <CardHeader className="pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg">
                  {mission.icon}
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-sm font-bold px-3 py-1 border-2 bg-gradient-to-r ${categoryColors[mission.category]} text-white shadow-lg border-white/30`}
                >
                  {categoryIcons[mission.category]} {mission.category}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                {mission.title}
                {isCompleted && <CheckCircle2 className="w-6 h-6 text-green-400" />}
                {isActive && <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50"
                />}
                {isLocked && <Lock className="w-5 h-5 text-gray-500" />}
              </CardTitle>
            </div>
            
            {/* Botão de Expandir/Colapsar */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="text-purple-200 hover:text-white hover:bg-purple-500/30 h-10 w-10 p-0 rounded-full flex-shrink-0 border border-purple-400/30"
                title={isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-6 h-6" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
          <CardDescription className="text-base text-gray-300 mt-2 leading-relaxed">
            {mission.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-5">
          {/* Informações básicas - sempre visível */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
            {mission.estimatedTime && (
                <div className="flex items-center gap-2 bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-500/30">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-200">{mission.estimatedTime} min</span>
              </div>
            )}
            {mission.difficulty && (
                <div className="flex items-center gap-2 bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-500/30">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-200">
                {Array.from({ length: mission.difficulty }).map((_, i) => (
                  <span key={i}>⭐</span>
                ))}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-1.5 rounded-lg border border-yellow-500/30">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-200">+{mission.rewards.xp} XP</span>
              </div>
              <div className="flex items-center gap-2 bg-cyan-900/30 px-3 py-1.5 rounded-lg border border-cyan-500/30">
                <span className="text-sm font-medium text-cyan-200">{mission.steps.length} passos</span>
              </div>
            </div>
            
            {/* Indicador de mais detalhes */}
            {!isExpanded && mission.rewards.badges.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-purple-300/70 italic">
                  ⬇️ Clique na seta acima para ver mais detalhes
                </p>
          </div>
            )}
          </div>

          {/* Detalhes expandíveis */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-4 border-t border-white/10">
          {/* Badges que desbloqueia */}
          {mission.rewards.badges.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-purple-200">🏆 Badges que desbloqueia:</p>
                      <div className="flex flex-wrap gap-2">
              {mission.rewards.badges.map(badgeId => {
                const badge = QUEST_BADGES.find(b => b.id === badgeId)
                return badge ? (
                            <Badge key={badgeId} variant="secondary" className="text-sm bg-yellow-900/30 border border-yellow-500/30 text-yellow-200">
                    {badge.icon} {badge.name}
                  </Badge>
                ) : null
              })}
            </div>
                    </div>
                  )}
                </div>
              </motion.div>
          )}
          </AnimatePresence>

          {/* Botão de ação - sempre visível */}
          <div className="pt-4">
          {!isLocked && (
            <Button
                className={cn(
                  "w-full h-12 text-base font-bold shadow-lg transition-all",
                  isActive && "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-cyan-500/50",
                  isCompleted && "bg-green-600 hover:bg-green-700 opacity-75",
                  !isActive && !isCompleted && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/50"
                )}
              variant={isActive ? "default" : isCompleted ? "outline" : "default"}
              disabled={isCompleted || isLocked}
                onClick={() => {
                  console.log('🔥 [MISSION CARD] BOTÃO CLICADO!', { isActive, isCompleted, isLocked, missionId: mission.id })
                  onStart()
                }}
            >
              {isActive && (
                <>
                    <Play className="w-5 h-5 mr-2" />
                  Continuar
                </>
              )}
              {isCompleted && (
                <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  Completada
                </>
              )}
              {!isActive && !isCompleted && (
                <>
                    <Rocket className="w-5 h-5 mr-2" />
                  Iniciar Missão
                </>
              )}
            </Button>
          )}

          {isLocked && (
              <div className="text-center bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-300 font-medium">
              🔒 Complete missões anteriores para desbloquear
            </p>
              </div>
          )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Card de Badge
 */
function BadgeCard({ 
  badge, 
  unlocked 
}: { 
  badge: QuestBadge
  unlocked: boolean
}) {
  const rarityColors = {
    common: 'from-gray-500 to-gray-700',
    rare: 'from-blue-500 to-purple-600',
    epic: 'from-purple-500 to-pink-600',
    legendary: 'from-yellow-500 to-orange-600'
  }

  return (
    <motion.div
      whileHover={{ scale: unlocked ? 1.05 : 1 }}
      className={cn(
        "relative p-5 rounded-xl border-2 transition-all",
        unlocked 
          ? "bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-400 shadow-2xl shadow-yellow-500/30" 
          : "bg-gray-900/50 border-gray-600 opacity-60"
      )}
    >
      <div className="text-center">
        <div className={cn(
          "text-5xl mb-3",
          !unlocked && "grayscale blur-sm"
        )}>
          {badge.icon}
        </div>
        <p className={cn(
          "font-bold text-base mb-1 text-white",
          !unlocked && "blur-sm"
        )}>
          {badge.hidden && !unlocked ? '???' : badge.name}
        </p>
        <p className={cn(
          "text-sm",
          unlocked ? "text-yellow-200" : "text-gray-400",
          !unlocked && "blur-sm"
        )}>
          {badge.hidden && !unlocked ? 'Badge secreto' : badge.description}
        </p>
        {unlocked && (
          <Badge variant="outline" className="mt-3 text-sm font-semibold border-2 border-yellow-400 text-yellow-400">
            {badge.rarity}
          </Badge>
        )}
      </div>
      
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </motion.div>
  )
}

/**
 * Componente principal QuestPanel
 */
export function QuestPanel({ isOpen, onClose }: QuestPanelProps) {
  const router = useRouter()
  const { progress, availableMissions, activeMission, activeStep, startMission, completeStep, completeMission } = useQuestSystem()
  const [selectedTab, setSelectedTab] = useState('available')
  const [isPanelMinimized, setIsPanelMinimized] = useState(false)
  const [panelWidth, setPanelWidth] = useState(() => {
    // Carrega a largura salva do localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quest-panel-width')
      return saved ? parseInt(saved) : 750
    }
    return 750
  })
  const [isResizing, setIsResizing] = useState(false)
  const { toast } = useToast()

  // Limites de largura
  const MIN_WIDTH = 400
  const MAX_WIDTH = 1200

  // Auto-switch para aba "Ativa" quando há missão ativa
  React.useEffect(() => {
    if (isOpen && activeMission) {
      setSelectedTab('active')
    }
  }, [isOpen, activeMission])

  // Handlers de redimensionamento
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  // Duplo clique para resetar largura padrão
  const handleDoubleClick = () => {
    setPanelWidth(750)
    localStorage.setItem('quest-panel-width', '750')
    toast({
      title: "↔️ Largura resetada",
      description: "Painel voltou ao tamanho padrão (750px)",
      duration: 2000
    })
  }

  React.useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      // Calcula a nova largura baseada na posição do mouse
      const newWidth = window.innerWidth - e.clientX
      
      // Aplica os limites
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      // Salva a largura no localStorage
      localStorage.setItem('quest-panel-width', panelWidth.toString())
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, panelWidth])

  // Previne seleção de texto durante o redimensionamento
  React.useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const handleStartMission = async (missionId: string) => {
    try {
      await startMission(missionId)
      
      // Mudar para a aba "Ativa" antes de fechar
      setSelectedTab('active')
      
      // Navegar automaticamente para a página da missão (se houver)
      const mission = QUEST_MISSIONS.find(m => m.id === missionId)
      if (mission) {
        // Encontrar o primeiro step que tem target.page
        const firstPageStep = mission.steps.find(step => step.target?.page)
        if (firstPageStep?.target?.page) {
          console.log('🧭 [QUEST PANEL] Navegando automaticamente para:', firstPageStep.target.page)
          router.push(firstPageStep.target.page)
        }
      }
      
      toast({
        title: "🚀 Missão iniciada!",
        description: "Boa sorte, Comandante!",
      })
      
      // Fechar o painel - tutorial visual aparece automaticamente
      onClose()
    } catch (error: any) {
      toast({
        title: "❌ Erro ao iniciar missão",
        description: error.message || "Algo deu errado. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleContinueMission = async () => {
    console.log('🎬 [QUEST PANEL] ===== BOTÃO CONTINUAR CLICADO =====')
    console.log('🎬 [QUEST PANEL] activeMission:', activeMission?.id, activeMission?.title)
    console.log('🎬 [QUEST PANEL] progress.missionProgress:', progress?.missionProgress)
    
    if (!activeMission || !progress?.missionProgress) {
      console.log('❌ [QUEST PANEL] Sem missão ativa ou progresso')
      toast({
        title: "⚠️ Missão não encontrada",
        description: "Não foi possível encontrar a missão ativa.",
        variant: "destructive"
      })
      return
    }

    const currentStepIndex = progress.missionProgress.currentStepIndex || 0
    console.log('📍 [QUEST PANEL] currentStepIndex:', currentStepIndex)
    console.log('📍 [QUEST PANEL] Total steps:', activeMission.steps.length)
    
    const currentStep = activeMission.steps[currentStepIndex]
    console.log('📍 [QUEST PANEL] currentStep:', currentStep?.id, currentStep?.title)
    console.log('📍 [QUEST PANEL] activeStep (do hook):', activeStep?.id, activeStep?.title)
    
    // Verificar se todos os passos foram completados
    if (currentStepIndex >= activeMission.steps.length) {
      try {
        await completeMission(activeMission.id)
        toast({
          title: "🎉 Missão Completada!",
          description: `Parabéns! Você completou "${activeMission.title}"!`,
        })
        setSelectedTab('completed')
        return
      } catch (error: any) {
        toast({
          title: "❌ Erro ao completar missão",
          description: error.message || "Algo deu errado. Tente novamente.",
          variant: "destructive"
        })
        return
      }
    }

    if (!currentStep) {
      toast({
        title: "⚠️ Passo não encontrado",
        description: "Não foi possível encontrar o passo atual.",
        variant: "destructive"
      })
      return
    }

    // Se a ação é "wait" (apenas ler/visualizar), completa automaticamente
    if (currentStep.target?.action === 'wait') {
      try {
        await completeStep(currentStep.id)
        toast({
          title: "✅ Passo completado!",
          description: `Passo "${currentStep.title}" concluído!`,
        })
        // Fechar painel - tutorial visual aparece automaticamente
        onClose()
      } catch (error: any) {
        toast({
          title: "❌ Erro ao completar passo",
          description: error.message || "Algo deu errado. Tente novamente.",
          variant: "destructive"
        })
      }
    } else if (currentStep.target?.action === 'navigate') {
      // Para navegação, verificar se já está na página certa
      const currentPath = window.location.pathname
      const targetPage = currentStep.target.page
      
      // Verificar se já está na página (aceitar /admin ou /dashboard)
      const isOnCorrectPage = currentPath === targetPage || 
                             (targetPage === '/dashboard' && currentPath.startsWith('/admin'))
      
      if (isOnCorrectPage) {
        try {
          await completeStep(currentStep.id)
          toast({
            title: "✅ Passo completado!",
            description: `Passo "${currentStep.title}" concluído!`,
          })
          // Fechar painel - tutorial visual aparece automaticamente
          onClose()
        } catch (error: any) {
          toast({
            title: "❌ Erro ao completar passo",
            description: error.message || "Algo deu errado. Tente novamente.",
            variant: "destructive"
          })
        }
      } else {
        // Navegar automaticamente para a página necessária
        console.log('🧭 [QUEST PANEL] Navegando automaticamente para:', targetPage)
        router.push(targetPage)
        
        toast({
          title: "🧭 Navegando...",
          description: `Redirecionando para: ${targetPage}`,
        })
        
        // Fechar painel - tutorial visual aparece automaticamente
        onClose()
      }
    } else {
      // Para outros tipos de ações, fechar o painel
      console.log('🚀 [QUEST PANEL] Fechando painel e mostrando tutorial visual')
      console.log('🚀 [QUEST PANEL] Step atual:', currentStep.id, currentStep.title)
      
      // Se o step tem uma página alvo, navegar automaticamente
      if (currentStep.target?.page) {
        const currentPath = window.location.pathname
        const targetPage = currentStep.target.page
        
        // Só navegar se não estiver já na página correta
        const isOnCorrectPage = currentPath === targetPage || 
                               (targetPage === '/dashboard' && currentPath.startsWith('/admin'))
        
        if (!isOnCorrectPage) {
          console.log('🧭 [QUEST PANEL] Navegando para página do step:', targetPage)
          router.push(targetPage)
        }
      }
      
      // Fechar painel IMEDIATAMENTE
      onClose()
      
      toast({
        title: "📍 Siga as instruções",
        description: "Tutorial visual abrindo...",
      })
    }
  }

  if (!progress) return null

  const currentLevel = getLevelFromXP(progress.totalXP)
  const completedMissions = QUEST_MISSIONS.filter(m => 
    progress.completedMissions?.includes(m.id)
  )

  const unlockedBadges = progress.unlockedBadges || []
  
  console.log('🏅 [QUEST PANEL] Badges desbloqueados:', unlockedBadges)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        style={{
          width: isPanelMinimized ? '120px' : `${panelWidth}px`,
          maxWidth: isPanelMinimized ? '120px' : `${MAX_WIDTH}px`
        }}
        className={cn(
          "bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-y-auto border-l-4 border-purple-500 transition-all",
          isPanelMinimized ? "p-4" : "p-8",
          isResizing ? "transition-none" : "duration-500"
        )}
      >
        {/* Handle de Redimensionamento */}
        {!isPanelMinimized && (
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className={cn(
              "absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize group hover:bg-purple-500/30 transition-colors z-50 flex items-center justify-center",
              isResizing && "bg-purple-500/50"
            )}
            title="Arraste para redimensionar | Duplo clique para resetar (750px)"
          >
            <div className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-20 bg-purple-400/50 group-hover:bg-purple-400 group-hover:h-32 transition-all rounded-r-full",
              isResizing && "bg-purple-400 h-32"
            )} />
            <GripVertical 
              className={cn(
                "w-4 h-4 text-purple-400/60 group-hover:text-purple-300 transition-colors absolute",
                isResizing && "text-purple-300"
              )} 
            />
            
            {/* Indicador de Largura durante o redimensionamento */}
            {isResizing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-6 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-purple-400"
              >
                {panelWidth}px
                <div className="text-[10px] text-purple-200 mt-0.5">
                  {panelWidth <= MIN_WIDTH && "Mínimo"}
                  {panelWidth >= MAX_WIDTH && "Máximo"}
                  {panelWidth > MIN_WIDTH && panelWidth < MAX_WIDTH && `${MIN_WIDTH}-${MAX_WIDTH}px`}
                </div>
              </motion.div>
            )}
          </div>
        )}
        <SheetHeader className={cn(
          "pb-6 border-b-2 border-purple-500/30 transition-all duration-300",
          isPanelMinimized && "pb-4"
        )}>
          <div className="flex items-center justify-between gap-2">
            {!isPanelMinimized && (
              <SheetTitle className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
            Academia de Exploradores IMPA
          </SheetTitle>
            )}
            
            {isPanelMinimized && (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg mx-auto">
                <Rocket className="w-7 h-7 text-white" />
              </div>
            )}
            
            {/* Botão de Minimizar/Expandir */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPanelMinimized(!isPanelMinimized)}
                className="text-white hover:bg-purple-500/30 h-10 w-10 p-0 rounded-full border border-purple-400/40 shadow-lg"
                title={isPanelMinimized ? "Expandir painel" : "Minimizar painel"}
              >
                {isPanelMinimized ? (
                  <ChevronLeft className="w-6 h-6" />
                ) : (
                  <ChevronRight className="w-6 h-6" />
                )}
              </Button>
            </motion.div>
          </div>
          
          {!isPanelMinimized && (
            <SheetDescription className="text-cyan-200 text-base font-medium mt-2">
            Complete missões para dominar a plataforma e desbloquear conquistas!
          </SheetDescription>
          )}
        </SheetHeader>

        {/* Conteúdo do Painel - Oculto quando minimizado */}
        {!isPanelMinimized && (
          <>
        {/* Estatísticas do Jogador */}
            <div className="mt-6 p-6 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl border-2 border-purple-500/50 shadow-xl backdrop-blur-sm">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            Suas Estatísticas
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-black/30 p-4 rounded-lg border border-cyan-500/30">
              <div className="text-4xl font-bold text-cyan-400 mb-1">{currentLevel.level}</div>
              <div className="text-xs text-cyan-200 font-medium">Nível</div>
              <div className="text-sm text-yellow-400 mt-2 font-semibold">{currentLevel.icon} {currentLevel.title}</div>
            </div>
            <div className="text-center bg-black/30 p-4 rounded-lg border border-yellow-500/30">
              <div className="text-4xl font-bold text-yellow-400 mb-1">{progress.totalXP}</div>
              <div className="text-xs text-yellow-200 font-medium">XP Total</div>
            </div>
            <div className="text-center bg-black/30 p-4 rounded-lg border border-green-500/30">
              <div className="text-4xl font-bold text-green-400 mb-1">{unlockedBadges.length}/{QUEST_BADGES.length}</div>
              <div className="text-xs text-green-200 font-medium">Conquistas</div>
            </div>
          </div>

          {/* Stats adicionais */}
          {progress.stats && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-purple-400/30">
              <div className="flex items-center gap-2 text-sm bg-black/20 p-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">{progress.stats.totalMissionsCompleted || 0} missões completas</span>
              </div>
              {progress.stats.perfectMissions > 0 && (
                <div className="flex items-center gap-2 text-sm bg-black/20 p-3 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">{progress.stats.perfectMissions} perfeitas</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs de Missões e Badges */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-purple-900/80 to-blue-900/80 p-1.5 rounded-lg border-2 border-purple-500/40">
            <TabsTrigger 
              value="available"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-purple-200 font-semibold"
            >
              Disponíveis
              {availableMissions.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-cyan-500 text-white">{availableMissions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-green-200 font-semibold"
            >
              Ativa
              {activeMission && <Badge variant="secondary" className="ml-2 bg-green-500 text-white">1</Badge>}
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-blue-200 font-semibold"
            >
              Completas
              <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">{completedMissions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="badges"
              className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-yellow-200 font-semibold"
            >
              Badges
              <Badge variant="secondary" className="ml-2 bg-yellow-500 text-white">{unlockedBadges.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Missões Disponíveis */}
          <TabsContent value="available" className="space-y-5 mt-6">
            {availableMissions.length === 0 ? (
              <Card className="p-10 text-center bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-2 border-yellow-500/40">
                <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <p className="text-white font-bold text-lg">Todas as missões disponíveis completadas!</p>
                <p className="text-base text-yellow-200 mt-3">
                  Complete mais missões para desbloquear novas aventuras
                </p>
              </Card>
            ) : (
              availableMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  isCompleted={false}
                  isActive={false}
                  isLocked={false}
                  onStart={() => handleStartMission(mission.id)}
                />
              ))
            )}
          </TabsContent>

          {/* Missão Ativa */}
          <TabsContent value="active" className="mt-6">
            {activeMission ? (
              <div className="space-y-5">
              <MissionCard
                mission={activeMission}
                isCompleted={false}
                isActive={true}
                isLocked={false}
                  onStart={handleContinueMission}
                />
                
                {/* Info do passo atual */}
                {progress?.missionProgress && (
                  <Card className={cn(
                    "border-2 shadow-xl",
                    (progress.missionProgress.currentStepIndex >= activeMission.steps.length)
                      ? "bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-400"
                      : "bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-400"
                  )}>
                    <CardContent className="pt-6 pb-6">
                      {(progress.missionProgress.currentStepIndex >= activeMission.steps.length) ? (
                        // Missão completa
                        <div className="text-center py-6">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-500/50"
                          >
                            <CheckCircle2 className="h-12 w-12 text-white" />
                          </motion.div>
                          <p className="text-white font-bold text-2xl mb-2">
                            🎉 Todos os passos completados!
                          </p>
                          <p className="text-green-200 text-base mb-6">
                            Clique em "Continuar" para finalizar a missão
                          </p>
                          <div className="flex items-center justify-center gap-3 bg-yellow-900/30 px-6 py-3 rounded-lg border-2 border-yellow-400/50 w-fit mx-auto">
                            <Sparkles className="w-6 h-6 text-yellow-400" />
                            <span className="text-xl font-bold text-yellow-200">+{activeMission.rewards.xp} XP</span>
                          </div>
                        </div>
                      ) : (
                        // Passo atual
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-lg">
                                {(progress.missionProgress.currentStepIndex || 0) + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-bold text-base mb-1">
                                {activeMission.steps[progress.missionProgress.currentStepIndex || 0]?.title || 'Carregando...'}
                              </p>
                              <p className="text-cyan-200 text-sm">
                                Passo {(progress.missionProgress.currentStepIndex || 0) + 1} de {activeMission.steps.length}
                              </p>
                            </div>
                          </div>
                          <div className="bg-black/30 p-4 rounded-lg border border-cyan-500/30">
                            <p className="text-white text-base leading-relaxed">
                              {activeMission.steps[progress.missionProgress.currentStepIndex || 0]?.description || ''}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-12 text-center bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-2 border-cyan-400/60 shadow-lg">
                <Rocket className="w-24 h-24 text-cyan-300 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                <p className="text-white font-bold text-xl mb-2">Nenhuma missão ativa</p>
                <p className="text-base text-cyan-100 mt-3 font-medium">
                  Selecione uma missão disponível para começar!
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Missões Completas */}
          <TabsContent value="completed" className="space-y-5 mt-6">
            {completedMissions.length === 0 ? (
              <Card className="p-12 text-center bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-2 border-blue-400/60 shadow-lg">
                <Trophy className="w-24 h-24 text-blue-300 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
                <p className="text-white font-bold text-xl mb-2">Nenhuma missão completada ainda</p>
                <p className="text-base text-blue-100 mt-3 font-medium">
                  Comece uma missão e mostre sua maestria!
                </p>
              </Card>
            ) : (
              completedMissions.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  isCompleted={true}
                  isActive={false}
                  isLocked={false}
                  onStart={() => {}}
                />
              ))
            )}
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {QUEST_BADGES.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={unlockedBadges.includes(badge.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
        
        {/* Versão Minimizada - Ícones Verticais */}
        {isPanelMinimized && (
          <div className="flex flex-col items-center gap-6 mt-6">
            <Button
              variant="ghost"
              className="h-14 w-14 p-0 rounded-full bg-purple-600/30 hover:bg-purple-500/50 border-2 border-purple-400/50"
              onClick={() => {
                setIsPanelMinimized(false)
                setSelectedTab('available')
              }}
              title="Missões Disponíveis"
            >
              <Trophy className="w-7 h-7 text-purple-200" />
            </Button>
            
            {activeMission && (
              <Button
                variant="ghost"
                className="h-14 w-14 p-0 rounded-full bg-green-600/30 hover:bg-green-500/50 border-2 border-green-400/50 relative"
                onClick={() => {
                  setIsPanelMinimized(false)
                  setSelectedTab('active')
                }}
                title="Missão Ativa"
              >
                <Play className="w-7 h-7 text-green-200" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-white"
                />
              </Button>
            )}
            
            <Button
              variant="ghost"
              className="h-14 w-14 p-0 rounded-full bg-blue-600/30 hover:bg-blue-500/50 border-2 border-blue-400/50"
              onClick={() => {
                setIsPanelMinimized(false)
                setSelectedTab('completed')
              }}
              title="Missões Completas"
            >
              <CheckCircle2 className="w-7 h-7 text-blue-200" />
            </Button>
            
            <Button
              variant="ghost"
              className="h-14 w-14 p-0 rounded-full bg-yellow-600/30 hover:bg-yellow-500/50 border-2 border-yellow-400/50"
              onClick={() => {
                setIsPanelMinimized(false)
                setSelectedTab('badges')
              }}
              title="Badges"
            >
              <Award className="w-7 h-7 text-yellow-200" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

