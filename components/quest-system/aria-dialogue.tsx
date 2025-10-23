/**
 * ARIADialogue - Assistente virtual inteligente
 * Exibe diálogos, hints e ações sugeridas
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  X, 
  Sparkles, 
  Lightbulb,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import { useQuestSystem } from '@/hooks/use-quest-system'
import { cn } from '@/lib/utils'

interface ARIADialogueProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

/**
 * Componente para efeito de typing (texto digitando)
 */
function TypewriterText({ 
  text, 
  className, 
  speed = 30,
  onComplete 
}: { 
  text: string
  className?: string
  speed?: number
  onComplete?: () => void
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  useEffect(() => {
    // Reset ao mudar o texto
    setDisplayedText('')
    setCurrentIndex(0)
  }, [text])

  return <p className={className}>{displayedText}</p>
}

export function ARIADialogue({ isOpen, onClose, className }: ARIADialogueProps) {
  const { ariaState, useHint, activeStep } = useQuestSystem()
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)

  const currentDialogue = ariaState.currentDialogue[currentDialogueIndex] || 
    "Olá, Comandante! Estou aqui para ajudar. 👋"

  // Função para avançar para o próximo diálogo
  const nextDialogue = () => {
    if (currentDialogueIndex < ariaState.currentDialogue.length - 1) {
      setCurrentDialogueIndex(prev => prev + 1)
      setIsTyping(true)
    }
  }

  // Reset quando abrir ou mudar diálogos
  useEffect(() => {
    if (isOpen) {
      setCurrentDialogueIndex(0)
      setIsTyping(true)
    }
  }, [isOpen, ariaState.currentDialogue])

  // Ícone e cor baseado no mood da ARIA
  const moodConfig = {
    happy: { color: 'from-cyan-400 to-blue-500', pulse: false },
    excited: { color: 'from-yellow-400 to-orange-500', pulse: true },
    thinking: { color: 'from-purple-400 to-pink-500', pulse: false },
    concerned: { color: 'from-gray-400 to-gray-600', pulse: false },
    celebrating: { color: 'from-green-400 to-emerald-500', pulse: true }
  }

  const config = moodConfig[ariaState.mood] || moodConfig.happy

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.4 }}
          className={cn("fixed bottom-24 right-4 z-50 w-96", className)}
        >
          <Card className="bg-gradient-to-br from-cyan-900/95 to-blue-900/95 backdrop-blur-md border-cyan-400/50 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {/* Avatar ARIA */}
                <motion.div 
                  className={cn(
                    "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
                    config.color
                  )}
                  animate={config.pulse ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </motion.div>
                
                <div className="flex-1">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    ARIA
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                  </CardTitle>
                  <p className="text-cyan-300 text-xs">
                    Assistente de Navegação
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Mensagem com typing effect */}
              <div className="bg-black/30 rounded-lg p-4 min-h-[80px] relative">
                <TypewriterText 
                  text={currentDialogue}
                  className="text-white text-sm leading-relaxed"
                  speed={20}
                  onComplete={() => setIsTyping(false)}
                />
                
                {/* Indicador de mais diálogos */}
                {!isTyping && currentDialogueIndex < ariaState.currentDialogue.length - 1 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-2 right-2 text-cyan-400 hover:text-cyan-300"
                    onClick={nextDialogue}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
              
              {/* Ações sugeridas */}
              {ariaState.suggestedActions && ariaState.suggestedActions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-cyan-300 text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AÇÕES SUGERIDAS:
                  </p>
                  {ariaState.suggestedActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left border-cyan-400/50 hover:bg-cyan-400/10 text-white",
                          action.primary && "border-yellow-400/50 bg-yellow-400/10"
                        )}
                        onClick={action.action}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* Hint atual */}
              {ariaState.currentHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert className="border-yellow-400/50 bg-yellow-400/10">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <AlertDescription className="text-white text-sm">
                      {ariaState.currentHint}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              
              {/* Botão para pedir hint */}
              {activeStep && activeStep.hints && activeStep.hints.length > 0 && !ariaState.currentHint && (
                <Button
                  variant="outline"
                  className="w-full border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                  onClick={useHint}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Preciso de uma dica
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

