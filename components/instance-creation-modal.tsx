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
    const stepDuration = 1000

    const timer = setInterval(() => {
      totalTime += 100

      const newProgress = Math.min((totalTime / 5000) * 100, 100)
      setProgress(newProgress)

      const newStep = Math.floor(totalTime / stepDuration)
      if (newStep < creationSteps.length) {
        setCurrentStep(newStep)
      }

      if (totalTime >= 5000 && !hasCompleted) {
        setIsComplete(true)
        setHasCompleted(true)
        clearInterval(timer)

        setTimeout(() => {
          onComplete()
        }, 100)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [open, onComplete, hasCompleted])

  useEffect(() => {
    if (isComplete && hasCompleted) {
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
          <DialogTitle className="text-center text-foreground">
            {isComplete ? "Instância Criada!" : "Criando Instância"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {isComplete ? (
              <>
                Sua conexão <strong className="text-foreground">{connectionName}</strong> foi criada com sucesso!
              </>
            ) : (
              <>
                Configurando sua conexão WhatsApp: <strong className="text-foreground">{connectionName}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <div className={`relative ${isComplete ? "animate-bounce" : "animate-pulse"}`}>
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  isComplete
                    ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                }`}
              >
                <CurrentIcon className="w-10 h-10" />
              </div>

              {!isComplete && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-blue-300 animate-ping animation-delay-200"></div>
                </>
              )}
            </div>
          </div>

          <div className="text-center">
            <p className={`font-medium ${isComplete ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
              {isComplete ? "✨ Instância criada com sucesso!" : creationSteps[currentStep]?.text}
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">{Math.round(progress)}% concluído</p>
          </div>

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
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : isCompletedStep
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompletedStep
                        ? "bg-green-100 dark:bg-green-900"
                        : isCurrentStep
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {isCompletedStep ? <CheckCircle className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium">{step.text}</span>
                </div>
              )
            })}
          </div>

          {isComplete && (
            <div className="pt-4 border-t">
              <p className="text-center text-sm text-green-600 dark:text-green-400">
                Instância criada com sucesso! O modal fechará automaticamente...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
