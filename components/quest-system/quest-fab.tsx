/**
 * Quest FAB - Floating Action Button arrastável para o Quest System
 * Botão simples que abre direto o painel de missões
 */

'use client'

import { useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuestSystem } from '@/hooks/use-quest-system'
import { getLevelFromXP } from '@/lib/quest-missions'
import { cn } from '@/lib/utils'

interface QuestFABProps {
  onOpenPanel: () => void
  onOpenARIA: () => void
}

export function QuestFAB({ onOpenPanel, onOpenARIA }: QuestFABProps) {
  const { progress, activeMission } = useQuestSystem()
  const [isDragging, setIsDragging] = useState(false)

  // Valores de movimento
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  if (!progress) {
    return null
  }

  const currentLevel = getLevelFromXP(progress.totalXP)
  const hasMission = !!activeMission

  return (
    <>
      {/* FAB Principal - Arrastável */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        style={{ x, y }}
        className={cn(
          "fixed bottom-6 right-6 z-50 cursor-grab active:cursor-grabbing",
          isDragging && "cursor-grabbing"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="relative"
        >
          <Button
            size="lg"
            onClick={(e) => {
              if (!isDragging) {
                onOpenPanel()
              }
            }}
            className={cn(
              "h-16 w-16 rounded-full shadow-2xl",
              "bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700",
              "hover:from-purple-500 hover:via-blue-500 hover:to-purple-600",
              "border-2 border-white/30",
              "transition-all duration-300"
            )}
            title="Abrir Academia de Exploradores"
          >
            <Rocket className="h-8 w-8 text-white" />
          </Button>

          {/* Badge de Nível */}
          <Badge 
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-yellow-500 text-black font-bold text-xs border-2 border-white"
          >
            {currentLevel.level}
          </Badge>

          {/* Indicador de Missão Ativa */}
          {hasMission && (
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2 
                }}
                className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"
              />
            )}

            {/* Pulso Animado */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                repeat: Infinity,
                duration: 2
              }}
              className="absolute inset-0 rounded-full bg-purple-500 -z-10"
            />
          </motion.div>
      </motion.div>
    </>
  )
}

