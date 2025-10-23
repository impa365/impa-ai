/**
 * MissionCompleteModal - Celebração ao completar missão
 * Modal animado com confetti e recompensas
 */

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Trophy,
  Star,
  Award,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { AchievementEvent } from '@/types/quest'
import { getLevelFromXP, QUEST_LEVELS } from '@/lib/quest-missions'

interface MissionCompleteModalProps {
  event: AchievementEvent | null
  isOpen: boolean
  onClose: () => void
}

export function MissionCompleteModal({ event, isOpen, onClose }: MissionCompleteModalProps) {
  const { width, height } = useWindowSize()
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState<'xp' | 'badges' | 'levelup' | 'done'>('xp')

  useEffect(() => {
    if (isOpen && event) {
      console.log('🎉 [MISSION COMPLETE MODAL] Event recebido:', event)
      console.log('🏅 [MISSION COMPLETE MODAL] Badges no event:', event.data.badges)
      setShowConfetti(true)
      setCurrentAnimation('xp')
      
      // Sequência de animações
      const timers = [
        setTimeout(() => setCurrentAnimation('badges'), 2000),
        setTimeout(() => {
          if (event.data.newLevel && event.data.oldLevel && event.data.newLevel > event.data.oldLevel) {
            setCurrentAnimation('levelup')
          } else {
            setCurrentAnimation('done')
          }
        }, 4000),
        setTimeout(() => {
          if (event.data.newLevel && event.data.oldLevel && event.data.newLevel > event.data.oldLevel) {
            setCurrentAnimation('done')
          }
        }, 7000)
      ]

      return () => timers.forEach(clearTimeout)
    } else {
      setShowConfetti(false)
    }
  }, [isOpen, event])

  if (!event) return null

  const leveledUp = event.data.newLevel && event.data.oldLevel && event.data.newLevel > event.data.oldLevel
  const newLevelData = event.data.newLevel ? QUEST_LEVELS.find(l => l.level === event.data.newLevel) : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={leveledUp ? 400 : 200}
          recycle={false}
          gravity={0.3}
          colors={leveledUp ? ['#FFD700', '#FFA500', '#FF69B4', '#00CED1'] : ['#00CED1', '#4169E1', '#9370DB']}
        />
      )}
      
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 border-green-500">
        <AnimatePresence mode="wait">
          {/* Animação XP */}
          {currentAnimation === 'xp' && (
            <motion.div
              key="xp"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
              
              <DialogHeader>
                <DialogTitle className="text-3xl text-white text-center">
                  MISSÃO COMPLETA!
                </DialogTitle>
                <DialogDescription className="text-green-300 text-center text-lg">
                  {event.data.mission?.title}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="flex items-center justify-center gap-3 text-yellow-400"
                >
                  <Star className="w-8 h-8" />
                  <span className="text-4xl font-bold">+{event.data.xp} XP</span>
                  <Star className="w-8 h-8" />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Animação Badges */}
          {currentAnimation === 'badges' && event.data.badges && event.data.badges.length > 0 && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
            >
              <Award className="w-20 h-20 text-purple-400 mx-auto mb-4" />
              
              <DialogHeader>
                <DialogTitle className="text-2xl text-white text-center">
                  CONQUISTAS DESBLOQUEADAS!
                </DialogTitle>
              </DialogHeader>
              
              <div className="mt-6 space-y-3">
                {event.data.badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{badge.icon}</div>
                        <div className="flex-1">
                          <p className="font-bold text-white">{badge.name}</p>
                          <p className="text-sm text-purple-200">{badge.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {badge.rarity}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Animação Level Up */}
          {currentAnimation === 'levelup' && leveledUp && newLevelData && (
            <motion.div
              key="levelup"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [-180, 0, 0]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]" />
              </motion.div>
              
              <DialogHeader>
                <DialogTitle className="text-4xl text-white text-center font-black">
                  🎊 SUBIU DE NÍVEL! 🎊
                </DialogTitle>
              </DialogHeader>
              
              <div className="mt-6 text-center space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl text-gray-400">Nível {event.data.oldLevel}</div>
                    <div className="text-sm text-gray-500">{QUEST_LEVELS.find(l => l.level === event.data.oldLevel)?.title}</div>
                  </div>
                  
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowRight className="w-8 h-8 text-cyan-400" />
                  </motion.div>
                  
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-4xl text-yellow-400 font-black"
                    >
                      Nível {event.data.newLevel}
                    </motion.div>
                    <div className="text-lg text-cyan-400 font-bold">
                      {newLevelData.icon} {newLevelData.title}
                    </div>
                  </div>
                </div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-white text-lg"
                >
                  Você está cada vez mais poderoso, Comandante! 💪✨
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Animação Final */}
          {currentAnimation === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-4" />
              
              <DialogHeader>
                <DialogTitle className="text-2xl text-white text-center">
                  Parabéns, Comandante!
                </DialogTitle>
                <DialogDescription className="text-green-200 text-center">
                  Continue explorando e domine a plataforma IMPA!
                </DialogDescription>
              </DialogHeader>
              
              {/* Resumo das recompensas */}
              <div className="mt-6 space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <Star className="w-5 h-5" />
                  <span className="font-semibold">+{event.data.xp} XP ganho</span>
                </div>
                
                {event.data.badges && event.data.badges.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-purple-400">
                    <Award className="w-5 h-5" />
                    <span className="font-semibold">{event.data.badges.length} badge{event.data.badges.length > 1 ? 's' : ''} desbloqueado{event.data.badges.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                
                {leveledUp && (
                  <div className="flex items-center justify-center gap-2 text-cyan-400">
                    <Crown className="w-5 h-5" />
                    <span className="font-semibold">Subiu para nível {event.data.newLevel}!</span>
                  </div>
                )}
                
                {event.data.time && event.data.time < 120000 && (
                  <div className="flex items-center justify-center gap-2 text-orange-400">
                    <Zap className="w-5 h-5" />
                    <span className="font-semibold">Speedrun: {Math.floor(event.data.time / 1000)}s!</span>
                  </div>
                )}
              </div>
              
              <DialogFooter className="mt-6">
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Continuar Explorando
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

