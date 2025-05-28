"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Zap, Smartphone, Wifi, Settings, Rocket } from "lucide-react"

interface InstanceCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionName: string
  onComplete: () => void
  onConnectWhatsApp: () => void
}

const creationSteps = [
  { icon: Zap, text: "Inicializando instância...", duration: 1000 },
  { icon: Settings, text: "Configurando parâmetros...", duration: 1000 },
  { icon: Wifi, text: "Estabelecendo conexão...", duration: 1000 },
  { icon: Smartphone, text: "Preparando WhatsApp...", duration: 1000 },
  { icon: Rocket, text: "Finalizando configuração...", duration: 1000 },
]

export default function InstanceCreationModal({
  open,
  onOpenChange,
  connectionName,
  onComplete,
  onConnectWhatsApp,
}: InstanceCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    if (!open) {
      setCurrentStep(0)
      setProgress(0)
      setIsComplete(false)
      setHasCompleted(false)
      return
    }

    let totalTime = 0
    const stepDuration = 1000 // 1 segundo por step

    const timer = setInterval(() => {
      totalTime += 100

      // Atualizar progresso
      const newProgress = Math.min((totalTime / 5000) * 100, 100)
      setProgress(newProgress)

      // Atualizar step atual
      const newStep = Math.floor(totalTime / stepDuration)
      if (newStep < creationSteps.length) {
        setCurrentStep(newStep)
      }

      // Completar após 5 segundos
      if (totalTime >= 5000 && !hasCompleted) {
        setIsComplete(true)
        setHasCompleted(true)
        clearInterval(timer)

        // Chamar onComplete apenas uma vez
        setTimeout(() => {
          onComplete()
        }, 100)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [open, onComplete, hasCompleted])

  useEffect(() => {
    if (isComplete && hasCompleted) {
      // Fechar o modal automaticamente após 2 segundos
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isComplete, hasCompleted, onOpenChange])

  const CurrentIcon = isComplete ? CheckCircle : creationSteps[currentStep]?.icon || Zap

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">{isComplete ? "Instância Criada!" : "Criando Instância"}</DialogTitle>
          <DialogDescription className="text-center">
            {isComplete ? (
              <>
                Sua conexão <strong>{connectionName}</strong> foi criada com sucesso!
              </>
            ) : (
              <>
                Configurando sua conexão WhatsApp: <strong>{connectionName}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ícone animado */}
          <div className="flex justify-center">
            <div className={`relative ${isComplete ? "animate-bounce" : "animate-pulse"}`}>
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isComplete ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                <CurrentIcon className="w-10 h-10" />
              </div>

              {/* Círculos animados ao redor */}
              {!isComplete && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-blue-300 animate-ping animation-delay-200"></div>
                </>
              )}
            </div>
          </div>

          {/* Texto do step atual */}
          <div className="text-center">
            <p className={`font-medium ${isComplete ? "text-green-600" : "text-gray-700"}`}>
              {isComplete ? "✨ Instância criada com sucesso!" : creationSteps[currentStep]?.text}
            </p>
          </div>

          {/* Barra de progresso */}
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-center text-sm text-gray-500">{Math.round(progress)}% concluído</p>
          </div>

          {/* Lista de steps */}
          <div className="space-y-2">
            {creationSteps.map((step, index) => {
              const StepIcon = step.icon
              const isCurrentStep = index === currentStep
              const isCompletedStep = index < currentStep || isComplete

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    isCurrentStep
                      ? "bg-blue-50 text-blue-700"
                      : isCompletedStep
                        ? "bg-green-50 text-green-700"
                        : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompletedStep ? "bg-green-100" : isCurrentStep ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {isCompletedStep ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium">{step.text}</span>
                </div>
              )
            })}
          </div>

          {/* Mensagem de sucesso */}
          {isComplete && (
            <div className="pt-4 border-t">
              <p className="text-center text-sm text-green-600">
                Instância criada com sucesso! O modal fechará automaticamente...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
