/**
 * QuestHUD - Mini perfil do comandante com XP e missão ativa
 * Fica sempre visível no canto superior direito
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Star, 
  Compass, 
  Sparkles, 
  Trophy,
  Rocket
} from 'lucide-react'
import { useQuestSystem } from '@/hooks/use-quest-system'
import { getLevelFromXP, getXPForNextLevel, QUEST_MISSIONS } from '@/lib/quest-missions'
import { cn } from '@/lib/utils'

interface QuestHUDProps {
  onOpenPanel?: () => void
  onOpenARIA?: () => void
  className?: string
}

export function QuestHUD({ onOpenPanel, onOpenARIA, className }: QuestHUDProps) {
  const { progress, activeMission, ariaState } = useQuestSystem()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!progress) return null

  const currentLevel = getLevelFromXP(progress.totalXP)
  const xpForNext = getXPForNextLevel(progress.totalXP)
  const xpProgress = currentLevel.maxXP === Infinity 
    ? 100 
    : ((progress.totalXP - currentLevel.minXP) / (currentLevel.maxXP - currentLevel.minXP)) * 100

  // Obter dados da missão ativa
  const activeMissionData = activeMission 
    ? QUEST_MISSIONS.find(m => m.id === activeMission.id)
    : null

  const missionProgress = progress.missionProgress
  const missionStepsTotal = activeMissionData?.steps.length || 0
  const missionStepsCompleted = missionProgress?.completedSteps?.length || 0
  const missionProgressPercent = missionStepsTotal > 0 
    ? (missionStepsCompleted / missionStepsTotal) * 100 
    : 0

  return (
    <div className={cn("fixed top-20 right-4 z-50", className)}>
      {/* Mini Perfil do Comandante */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <Card className="w-64 bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-md shadow-xl border-purple-500/30">
          <div className="flex items-center gap-3 p-3">
            <Avatar className="border-2 border-yellow-400 shadow-lg">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-purple-600 text-white">
                👤
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">
                Comandante
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs">{currentLevel.icon}</span>
                <span className="text-yellow-400 text-xs font-semibold">
                  {currentLevel.title}
                </span>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onOpenPanel}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-white/10"
            >
              <Compass className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Barra de XP */}
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="text-white/70 text-xs">Nível {currentLevel.level}</span>
              </div>
              <span className="text-white/70 text-xs">
                {progress.totalXP} / {currentLevel.maxXP === Infinity ? '∞' : currentLevel.maxXP} XP
              </span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-[length:200%_100%]"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${xpProgress}%`,
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                  width: { type: "spring", duration: 1 },
                  backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                }}
              />
            </div>
            {xpForNext > 0 && (
              <p className="text-white/50 text-xs mt-1 text-right">
                {xpForNext} XP para próximo nível
              </p>
            )}
          </div>
          
          {/* Missão Ativa */}
          <AnimatePresence>
            {activeMission && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/10 p-3 bg-black/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-3 h-3 text-cyan-400" />
                  <p className="text-cyan-300 text-xs font-semibold">MISSÃO ATIVA</p>
                </div>
                <p className="text-white font-medium text-sm mb-2 line-clamp-2">
                  {activeMissionData?.title}
                </p>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={missionProgressPercent} 
                    className="flex-1 h-1.5 bg-white/20"
                  />
                  <span className="text-white text-xs font-mono">
                    {missionStepsCompleted}/{missionStepsTotal}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
      
      {/* ARIA Avatar - Minimizado */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="mt-3 cursor-pointer relative"
        whileHover={{ scale: 1.05 }}
        onClick={onOpenARIA}
      >
        <div className="relative w-16 h-16">
          {/* Avatar da ARIA */}
          <motion.div 
            className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-cyan-300"
            animate={{
              boxShadow: [
                '0 0 20px rgba(34, 211, 238, 0.4)',
                '0 0 40px rgba(34, 211, 238, 0.6)',
                '0 0 20px rgba(34, 211, 238, 0.4)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-8 h-8 text-white drop-shadow-lg" />
          </motion.div>
          
          {/* Badge de notificação */}
          <AnimatePresence>
            {ariaState.hasNewHint && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <span className="text-white text-xs font-bold">!</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pulso de fundo */}
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-400/20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>

      {/* Badge de nível atual (tooltip) */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute top-0 right-full mr-2 pointer-events-none"
      >
        <div className="bg-black/90 text-white px-3 py-2 rounded-lg shadow-xl border border-purple-500/30 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-xs text-white/70">Missões Completas</p>
              <p className="text-sm font-bold">{progress.completedMissions?.length || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

