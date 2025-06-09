"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Smartphone,
  Bot,
  MessageSquare,
  Settings,
  CheckCircle,
  Play,
  ArrowRight,
  Lightbulb,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

interface TutorialStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  action?: {
    label: string
    href: string
    type: "internal" | "external"
  }
  tips?: string[]
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Bem-vindo à Impa AI! 🎉",
    description:
      "Vamos te ajudar a configurar sua primeira IA para WhatsApp em apenas 4 passos simples. Este tutorial levará cerca de 5 minutos.",
    icon: <Zap className="w-8 h-8 text-blue-500" />,
    tips: [
      "Tenha seu número de WhatsApp Business pronto",
      "Prepare as informações sobre como sua IA deve se comportar",
      "Defina qual será a palavra-chave para ativar sua IA",
    ],
  },
  {
    id: 2,
    title: "1. Conectar seu WhatsApp",
    description:
      "Primeiro, você precisa conectar um número de WhatsApp à plataforma. Isso permitirá que sua IA receba e envie mensagens.",
    icon: <Smartphone className="w-8 h-8 text-green-500" />,
    action: {
      label: "Ir para Conexões WhatsApp",
      href: "/dashboard/whatsapp",
      type: "internal",
    },
    tips: [
      "Use um número WhatsApp Business de preferência",
      "Certifique-se de ter acesso ao WhatsApp Web",
      "O QR Code aparecerá para você escanear",
      "Mantenha o WhatsApp conectado no seu celular",
    ],
  },
  {
    id: 3,
    title: "2. Criar seu Primeiro Agente",
    description:
      "Agora vamos criar sua primeira IA! Aqui você define a personalidade, comportamento e função da sua assistente virtual.",
    icon: <Bot className="w-8 h-8 text-purple-500" />,
    action: {
      label: "Ir para Meus Agentes",
      href: "/dashboard/agents",
      type: "internal",
    },
    tips: [
      "Escolha um nome marcante para sua IA",
      "Defina claramente qual é o objetivo (vendas, suporte, etc.)",
      "Configure uma palavra-chave simples como '/bot' ou 'oi'",
      "Escreva instruções claras sobre como a IA deve responder",
    ],
  },
  {
    id: 4,
    title: "3. Configurar Comportamento",
    description:
      "Configure como sua IA irá se comportar: tom de voz, tipo de respostas, funcionalidades extras como áudio e agendamento.",
    icon: <Settings className="w-8 h-8 text-orange-500" />,
    tips: [
      "Escolha um tom de voz adequado ao seu negócio",
      "Configure se a IA deve transcrever áudios",
      "Defina se ela pode agendar reuniões",
      "Teste diferentes configurações de criatividade",
    ],
  },
  {
    id: 5,
    title: "4. Testar e Ativar! 🚀",
    description: "Sua IA está pronta! Agora é só testar enviando a palavra-chave no WhatsApp e ver a mágica acontecer.",
    icon: <MessageSquare className="w-8 h-8 text-green-600" />,
    tips: [
      "Envie a palavra-chave que você configurou",
      "Teste diferentes tipos de perguntas",
      "Verifique se as respostas estão adequadas",
      "Ajuste as configurações conforme necessário",
    ],
  },
]

export default function OnboardingTutorial() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar se o tutorial já foi completado
    const tutorialCompleted = localStorage.getItem("tutorial_completed")
    const currentUser = getCurrentUser()

    if (!tutorialCompleted && currentUser) {
      setIsVisible(true)
    } else {
      setIsCompleted(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAction = (action: TutorialStep["action"]) => {
    if (action) {
      if (action.type === "internal") {
        router.push(action.href)
      } else {
        window.open(action.href, "_blank")
      }
    }
  }

  const completeTutorial = () => {
    localStorage.setItem("tutorial_completed", "true")
    setIsVisible(false)
    setIsCompleted(true)
  }

  const restartTutorial = () => {
    localStorage.removeItem("tutorial_completed")
    setCurrentStep(0)
    setIsVisible(true)
    setIsCompleted(false)
  }

  const closeTutorial = () => {
    setIsVisible(false)
  }

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100

  if (!isVisible && !isCompleted) return null

  if (isCompleted) {
    return (
      <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Tutorial Concluído!</h3>
                <p className="text-sm text-gray-600">Você já sabe como usar a plataforma</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={restartTutorial}>
              <Play className="w-4 h-4 mr-2" />
              Revisar Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const step = tutorialSteps[currentStep]

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">{step.icon}</div>
            <div>
              <CardTitle className="text-xl text-gray-900">{step.title}</CardTitle>
              <CardDescription className="text-gray-600">
                Passo {currentStep + 1} de {tutorialSteps.length}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={closeTutorial} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-gray-700 leading-relaxed">{step.description}</p>
        </div>

        {step.tips && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">💡 Dicas importantes:</p>
                <ul className="space-y-1">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {step.action && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Próxima ação:</p>
                <p className="text-sm opacity-90">Clique no botão para continuar</p>
              </div>
              <Button onClick={() => handleAction(step.action)} className="bg-white text-blue-600 hover:bg-gray-100">
                {step.action.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-blue-500" : index < currentStep ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                Finalizar
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
