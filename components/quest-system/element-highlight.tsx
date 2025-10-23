/**
 * ElementHighlight - Destaca elementos na tela durante os steps
 * Cria um overlay escuro com spotlight no elemento alvo
 */

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react'
import { ElementHighlightConfig } from '@/types/quest'
import { createPortal } from 'react-dom'

interface ElementHighlightProps {
  config: ElementHighlightConfig | null
  onInteraction?: () => void
}

export function ElementHighlight({ config, onInteraction }: ElementHighlightProps) {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!config?.element) {
      setElementRect(null)
      return
    }

    const updatePosition = () => {
      const rect = config.element.getBoundingClientRect()
      setElementRect(rect)
    }

    // Atualizar posição inicial
    updatePosition()

    // Atualizar em scroll e resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    
    // Usar MutationObserver para detectar mudanças no DOM
    const observer = new MutationObserver(updatePosition)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    })

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      observer.disconnect()
    }
  }, [config?.element])

  if (!mounted || !config || !elementRect) return null

  const padding = 8
  const arrowSize = 32

  // Calcular posição da seta baseado no position
  const getArrowPosition = () => {
    const position = config.position || 'top'
    const positions = {
      top: {
        icon: ArrowDown,
        style: {
          top: elementRect.top - arrowSize - 12,
          left: elementRect.left + elementRect.width / 2 - arrowSize / 2
        },
        animate: { y: [0, -10, 0] }
      },
      bottom: {
        icon: ArrowUp,
        style: {
          top: elementRect.bottom + 12,
          left: elementRect.left + elementRect.width / 2 - arrowSize / 2
        },
        animate: { y: [0, 10, 0] }
      },
      left: {
        icon: ArrowRight,
        style: {
          top: elementRect.top + elementRect.height / 2 - arrowSize / 2,
          left: elementRect.left - arrowSize - 12
        },
        animate: { x: [0, -10, 0] }
      },
      right: {
        icon: ArrowLeft,
        style: {
          top: elementRect.top + elementRect.height / 2 - arrowSize / 2,
          left: elementRect.right + 12
        },
        animate: { x: [0, 10, 0] }
      }
    }
    return positions[position]
  }

  const arrowConfig = getArrowPosition()
  const ArrowIcon = arrowConfig.icon

  // Calcular posição do texto
  const getTextPosition = () => {
    const position = config.position || 'top'
    const baseStyle = {
      left: '50%',
      transform: 'translateX(-50%)'
    }

    if (position === 'top') {
      return { ...baseStyle, bottom: elementRect.bottom + 24 }
    } else if (position === 'bottom') {
      return { ...baseStyle, top: elementRect.top + 24 }
    } else if (position === 'left') {
      return {
        top: elementRect.top + elementRect.height / 2,
        right: window.innerWidth - elementRect.left + 24,
        transform: 'translateY(-50%)'
      }
    } else {
      return {
        top: elementRect.top + elementRect.height / 2,
        left: elementRect.right + 24,
        transform: 'translateY(-50%)'
      }
    }
  }

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ pointerEvents: config.allowInteraction ? 'none' : 'auto' }}
      >
        {/* Overlay escuro com recorte */}
        <div 
          className="absolute inset-0 bg-black/60"
          style={{
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              ${elementRect.left - padding}px 100%, 
              ${elementRect.left - padding}px ${elementRect.top - padding}px, 
              ${elementRect.right + padding}px ${elementRect.top - padding}px, 
              ${elementRect.right + padding}px ${elementRect.bottom + padding}px, 
              ${elementRect.left - padding}px ${elementRect.bottom + padding}px, 
              ${elementRect.left - padding}px 100%, 
              100% 100%, 
              100% 0%
            )`
          }}
        />
        
        {/* Spotlight no elemento */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute"
          style={{
            top: elementRect.top - padding,
            left: elementRect.left - padding,
            width: elementRect.width + padding * 2,
            height: elementRect.height + padding * 2,
            pointerEvents: config.allowInteraction ? 'auto' : 'none'
          }}
        >
          {/* Borda animada brilhante */}
          <div className="absolute inset-0 rounded-lg border-4 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6)]">
            <motion.div
              className="absolute inset-0 rounded-lg border-4 border-cyan-400"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Pulso de destaque (se pulse ativado) */}
          {config.pulse && (
            <motion.div
              className="absolute inset-0 rounded-lg bg-cyan-400/20"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </motion.div>
        
        {/* Seta apontando */}
        {config.showArrow !== false && (
          <motion.div
            className="absolute"
            style={{
              ...arrowConfig.style,
              zIndex: 10001
            }}
            animate={arrowConfig.animate}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowIcon className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          </motion.div>
        )}
        
        {/* Texto explicativo flutuante */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute max-w-sm"
          style={{
            ...getTextPosition(),
            zIndex: 10001
          }}
        >
          <div className="bg-gradient-to-br from-cyan-900 to-blue-900 text-white px-4 py-3 rounded-lg shadow-2xl border-2 border-cyan-400">
            <p className="text-sm font-semibold mb-1">{config.title}</p>
            <p className="text-xs text-cyan-200">{config.description}</p>
          </div>
        </motion.div>

        {/* Área clicável se permitir interação */}
        {config.allowInteraction && (
          <div
            className="absolute cursor-pointer"
            style={{
              top: elementRect.top,
              left: elementRect.left,
              width: elementRect.width,
              height: elementRect.height,
              zIndex: 10000,
              pointerEvents: 'auto'
            }}
            onClick={onInteraction}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )

  // Usar portal para renderizar no body
  return createPortal(content, document.body)
}

