/**
 * QuestTutorialGuide - Guia visual interativo para missões
 * Exibe spotlight, setas e tooltips diretamente na página
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Lightbulb,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import { useQuestSystem } from '@/hooks/use-quest-system'

interface ElementPosition {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Calcula a posição do elemento na página
 */
function getElementPosition(selector: string): ElementPosition | null {
  const element = document.querySelector(selector)
  if (!element) return null
  
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  }
}

/**
 * Determina a melhor posição para o tooltip
 */
function getTooltipPosition(elementPos: ElementPosition, tooltipWidth: number = 400) {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  
  // Tentar à direita
  if (elementPos.left + elementPos.width + tooltipWidth + 50 < windowWidth) {
    return {
      position: 'right' as const,
      top: elementPos.top + elementPos.height / 2 - 100,
      left: elementPos.left + elementPos.width + 30
    }
  }
  
  // Tentar à esquerda
  if (elementPos.left - tooltipWidth - 50 > 0) {
    return {
      position: 'left' as const,
      top: elementPos.top + elementPos.height / 2 - 100,
      left: elementPos.left - tooltipWidth - 30
    }
  }
  
  // Tentar abaixo
  if (elementPos.top + elementPos.height + 250 < windowHeight) {
    return {
      position: 'bottom' as const,
      top: elementPos.top + elementPos.height + 30,
      left: Math.max(20, Math.min(elementPos.left, windowWidth - tooltipWidth - 20))
    }
  }
  
  // Fallback: acima
  return {
    position: 'top' as const,
    top: elementPos.top - 230,
    left: Math.max(20, Math.min(elementPos.left, windowWidth - tooltipWidth - 20))
  }
}

/**
 * Componente de Seta
 */
function Arrow({ position }: { position: 'top' | 'bottom' | 'left' | 'right' }) {
  const ArrowIcon = {
    top: ArrowUp,
    bottom: ArrowDown,
    left: ArrowLeft,
    right: ArrowRight
  }[position]
  
  return (
    <motion.div
      animate={{
        x: position === 'right' ? [0, 10, 0] : position === 'left' ? [0, -10, 0] : 0,
        y: position === 'bottom' ? [0, 10, 0] : position === 'top' ? [0, -10, 0] : 0
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute"
      style={{
        top: position === 'bottom' ? '-40px' : position === 'top' ? 'auto' : '50%',
        bottom: position === 'top' ? '-40px' : 'auto',
        left: position === 'right' ? '-40px' : position === 'left' ? 'auto' : '50%',
        right: position === 'left' ? '-40px' : 'auto',
        transform: position === 'left' || position === 'right' ? 'translateY(-50%)' : 'translateX(-50%)'
      }}
    >
      <ArrowIcon className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
    </motion.div>
  )
}

/**
 * Componente Principal
 */
export function QuestTutorialGuide() {
  const { activeMission, activeStep, progress, completeStep, abandonMission } = useQuestSystem()
  const [elementPos, setElementPos] = useState<ElementPosition | null>(null)
  const [tooltipPos, setTooltipPos] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  
  // DEBUG: Log quando activeStep muda
  useEffect(() => {
    console.log('🎯 [TUTORIAL GUIDE] activeMission:', activeMission?.id)
    console.log('🎯 [TUTORIAL GUIDE] activeStep:', activeStep?.id, activeStep?.title)
    console.log('🎯 [TUTORIAL GUIDE] isVisible:', isVisible)
  }, [activeMission, activeStep, isVisible])
  
  useEffect(() => {
    if (!activeMission || !activeStep) {
      console.log('⚠️ [TUTORIAL GUIDE] Não renderizando - sem missão ou step ativo')
      console.log('⚠️ [TUTORIAL GUIDE] activeMission:', activeMission)
      console.log('⚠️ [TUTORIAL GUIDE] activeStep:', activeStep)
      setIsVisible(false)
      return
    }
    
    console.log('✅ [TUTORIAL GUIDE] Preparando para mostrar step:', activeStep.title)
    console.log('✅ [TUTORIAL GUIDE] Missão:', activeMission.id)
    console.log('✅ [TUTORIAL GUIDE] Step completo:', activeStep)
    
    // Aguardar um pouco para a página renderizar
    const timer = setTimeout(() => {
      console.log('⏱️ [TUTORIAL GUIDE] Timer executado, processando target...')
      const target = activeStep.target
      
      if (target?.element) {
        console.log('🎯 [TUTORIAL GUIDE] Target tem elemento:', target.element)
        const pos = getElementPosition(target.element)
        if (pos) {
          console.log('✅ [TUTORIAL GUIDE] Elemento encontrado, posição:', pos)
          setElementPos(pos)
          setTooltipPos(getTooltipPosition(pos))
          setIsVisible(true)
          
          // Scroll suave até o elemento
          const element = document.querySelector(target.element)
          if (element) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
          }
        } else {
          console.log('⚠️ [TUTORIAL GUIDE] Elemento não encontrado no DOM, mostrando no centro')
          // Se o elemento não existe, mostrar no centro mesmo assim
          setElementPos(null)
          setTooltipPos({
            position: 'center',
            top: window.innerHeight / 2 - 150,
            left: window.innerWidth / 2 - 200
          })
          setIsVisible(true)
        }
      } else {
        console.log('📍 [TUTORIAL GUIDE] Sem elemento específico, mostrando no centro')
        // Se não tem elemento específico, mostrar no centro
        setElementPos(null)
        setTooltipPos({
          position: 'center',
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200
        })
        setIsVisible(true)
      }
    }, 100) // Reduzido de 300ms para 100ms para aparecer mais rápido
    
    return () => clearTimeout(timer)
  }, [activeMission, activeStep])
  
  // Atualizar posições no resize
  useEffect(() => {
    if (!isVisible || !activeStep?.target?.element) return
    
    const handleResize = () => {
      const pos = getElementPosition(activeStep.target!.element!)
      if (pos) {
        setElementPos(pos)
        setTooltipPos(getTooltipPosition(pos))
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isVisible, activeStep])
  
  const handleNext = async () => {
    if (!activeStep) return
    
    console.log('➡️ [TUTORIAL GUIDE] Completando step manualmente:', activeStep.id)
    
    try {
      await completeStep(activeStep.id)
      console.log('✅ [TUTORIAL GUIDE] Step completado com sucesso')
    } catch (error) {
      console.error('❌ [TUTORIAL GUIDE] Erro ao completar passo:', error)
    }
  }
  
  const handleSkip = async () => {
    console.log('🚫 [TUTORIAL GUIDE] Usuário clicou para fechar/pular tutorial')
    
    if (!activeMission) return
    
    try {
      await abandonMission()
      console.log('✅ [TUTORIAL GUIDE] Missão abandonada com sucesso')
      setIsVisible(false)
    } catch (error) {
      console.error('❌ [TUTORIAL GUIDE] Erro ao abandonar missão:', error)
      // Mesmo se der erro, ocultar o tutorial
      setIsVisible(false)
    }
  }
  
  // SEMPRE mostrar se houver missão e step ativo, ignorando isVisible
  console.log('🖥️ [TUTORIAL GUIDE] Render check - isVisible:', isVisible, 'activeMission:', !!activeMission, 'activeStep:', !!activeStep)
  
  if (!activeMission || !activeStep) {
    console.log('❌ [TUTORIAL GUIDE] Não renderizando - falta missão ou step')
    return null
  }
  
  // REMOVIDO O CHECK DE isVisible - agora sempre mostra se tiver missão/step
  console.log('✅ [TUTORIAL GUIDE] RENDERIZANDO TUTORIAL!')
  
  const currentStepIndex = activeMission.steps.findIndex(s => s.id === activeStep.id)
  const totalSteps = activeMission.steps.length
  
  // Usar isVisible OU forçar true se tiver target.element
  const shouldShow = isVisible || (activeStep.target?.element || activeStep.target?.page)
  console.log('👀 [TUTORIAL GUIDE] shouldShow:', shouldShow, 'isVisible:', isVisible, 'tem target:', !!(activeStep.target?.element || activeStep.target?.page))
  
  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] pointer-events-none"
        >
        {/* Overlay escuro com buraco no elemento destacado */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {elementPos && (
                <rect
                  x={elementPos.left - 8}
                  y={elementPos.top - 8}
                  width={elementPos.width + 16}
                  height={elementPos.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
        
        {/* Destaque do elemento */}
        {elementPos && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="absolute pointer-events-none"
              style={{
                top: elementPos.top - 8,
                left: elementPos.left - 8,
                width: elementPos.width + 16,
                height: elementPos.height + 16
              }}
            >
              {/* Borda brilhante */}
              <div className="absolute inset-0 rounded-xl border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-pulse" />
              
              {/* Partículas brilhantes nos cantos */}
              <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-bounce" />
            </motion.div>
            
            {/* Seta apontando */}
            {tooltipPos && (
              <div
                className="absolute"
                style={{
                  top: elementPos.top + elementPos.height / 2 - 16,
                  left: elementPos.left + elementPos.width / 2 - 16
                }}
              >
                <Arrow position={tooltipPos.position} />
              </div>
            )}
          </>
        )}
        
        {/* Tooltip flutuante */}
        {tooltipPos && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="absolute pointer-events-auto"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              width: tooltipPos.position === 'center' ? 400 : 380
            }}
          >
            <Card className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-500 text-black font-bold">
                      Passo {currentStepIndex + 1}/{totalSteps}
                    </Badge>
                    <Badge variant="outline" className="text-purple-200 border-purple-400">
                      {activeMission.icon} {activeMission.title}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {activeStep.title}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-300 hover:text-white hover:bg-purple-800/50 rounded-full h-8 w-8 p-0"
                  title="Fechar tutorial"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Descrição */}
              <div className="mb-6">
                <p className="text-cyan-100 text-base leading-relaxed">
                  {activeStep.description}
                </p>
              </div>
              
              {/* Diálogos da ARIA (se houver) */}
              {activeStep.ariaDialogue && activeStep.ariaDialogue.length > 0 && (
                <div className="bg-purple-950/50 border-2 border-purple-500/40 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-purple-200 font-medium text-sm mb-1">ARIA diz:</p>
                      <p className="text-cyan-200 text-sm italic">
                        "{activeStep.ariaDialogue[0]}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hints disponíveis */}
              {activeStep.hints && activeStep.hints.length > 0 && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-yellow-300 text-sm font-semibold flex items-center gap-2 hover:text-yellow-200">
                    <Lightbulb className="w-4 h-4" />
                    Precisa de ajuda? Clique aqui
                  </summary>
                  <ul className="mt-3 space-y-2 pl-6">
                    {activeStep.hints.map((hint, index) => (
                      <li key={index} className="text-yellow-100 text-sm list-disc">
                        {hint}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              
              {/* Ações */}
              <div className="space-y-3">
                {/* Mensagem de ação (se aplicável) */}
                {(activeStep.target?.action === 'navigate' || activeStep.target?.action === 'click') && (
                  <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-3 text-center">
                    <div className="text-sm text-cyan-300 italic flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        ✨
                      </motion.div>
                      Execute a ação acima para continuar automaticamente
                    </div>
                  </div>
                )}
                
                {/* Botões de controle */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="bg-red-600/80 border-2 border-red-400 text-white hover:bg-red-700 hover:border-red-300 font-bold shadow-lg"
                  >
                    Pular Tutorial
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold shadow-lg"
                  >
                    Próximo
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </div>
              
              {/* Progresso visual */}
              <div className="mt-4 flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      index < currentStepIndex 
                        ? 'bg-green-500' 
                        : index === currentStepIndex 
                        ? 'bg-yellow-400' 
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

