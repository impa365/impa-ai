"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import DynamicTitle from "@/components/dynamic-title"
import { getCurrentUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bot } from "lucide-react"
import { useSystemName } from "@/hooks/use-system-config"

export default function LoginPage() {
  const [loading, setLoading] = useState(true)
  const [isLandingEnabled, setIsLandingEnabled] = useState<boolean | null>(null)
  const router = useRouter()
  const { systemName, isLoading: isLoadingSystemName } = useSystemName()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = getCurrentUser()
        if (user) {
          if (user.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/dashboard")
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Error checking user:", error)
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  // Verificar se a landing page está ativa
  useEffect(() => {
    const checkLandingStatus = async () => {
      try {
        const response = await fetch('/api/system/landing-page-status')
        const data = await response.json()
        
        if (data.success) {
          setIsLandingEnabled(data.landingPageEnabled)
        } else {
          setIsLandingEnabled(false)
        }
      } catch (error) {
        console.error('Erro ao verificar status da landing page:', error)
        setIsLandingEnabled(false)
      }
    }

    checkLandingStatus()
  }, [])

  const handleBackToLanding = () => {
    router.push("/landing")
  }

  if (loading) {
    return (
      <>
        <DynamicTitle suffix="Login" />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-8"></div>
            <p className="text-white text-xl">Carregando...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DynamicTitle suffix="Login" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
        {/* Header com botão voltar */}
        <div className="p-6 flex items-center justify-between">
          {isLandingEnabled && (
            <Button
              variant="ghost"
              onClick={handleBackToLanding}
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Início
            </Button>
          )}
          
          {!isLandingEnabled && <div />} {/* Spacer quando botão não existe */}
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
                              {systemName || "Sistema de IA"}
            </span>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                Bem-vindo de Volta!
              </h1>
              <p className="text-gray-300 text-lg">
                Faça login para acessar seu painel {systemName || "Sistema de IA"}
              </p>
            </div>
            
            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 {systemName || "Sistema de IA"} - Desenvolvido pela Comunidade IMPA
          </p>
        </div>
      </div>
    </>
  )
} 