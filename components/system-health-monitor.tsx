"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Wifi, WifiOff } from "lucide-react"
import AuthRecoverySystem from "@/lib/auth-recovery"

interface HealthStatus {
  isOnline: boolean
  apiHealthy: boolean
  lastCheck: Date
  consecutiveFailures: number
}

export default function SystemHealthMonitor() {
  const [health, setHealth] = useState<HealthStatus>({
    isOnline: true,
    apiHealthy: true,
    lastCheck: new Date(),
    consecutiveFailures: 0
  })
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    let healthCheckInterval: NodeJS.Timeout
    let alertTimeout: NodeJS.Timeout

    const performHealthCheck = async () => {
      try {
        // Verificar conectividade básica
        const isOnline = navigator.onLine

        // Verificar saúde da API
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch('/api/system/version', {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache'
        })

        clearTimeout(timeoutId)
        
        const apiHealthy = response.ok
        const consecutiveFailures = apiHealthy ? 0 : health.consecutiveFailures + 1

        setHealth({
          isOnline,
          apiHealthy,
          lastCheck: new Date(),
          consecutiveFailures
        })

        // Se houver muitas falhas consecutivas, mostrar alerta
        if (consecutiveFailures >= 3) {
          setShowAlert(true)
          
          // Auto-hide alert após 10 segundos
          clearTimeout(alertTimeout)
          alertTimeout = setTimeout(() => {
            setShowAlert(false)
          }, 10000)
        } else if (apiHealthy) {
          setShowAlert(false)
        }

      } catch (error: any) {
        console.warn('Health check failed:', error.message)
        
        const consecutiveFailures = health.consecutiveFailures + 1
        setHealth(prev => ({
          ...prev,
          apiHealthy: false,
          lastCheck: new Date(),
          consecutiveFailures
        }))

        if (consecutiveFailures >= 3) {
          setShowAlert(true)
        }
      }
    }

    // Primeira verificação
    performHealthCheck()

    // Verificações periódicas a cada 30 segundos
    healthCheckInterval = setInterval(performHealthCheck, 30000)

    // Listeners para eventos de conectividade
    const handleOnline = () => {
      setHealth(prev => ({ ...prev, isOnline: true }))
      performHealthCheck()
    }

    const handleOffline = () => {
      setHealth(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(healthCheckInterval)
      clearTimeout(alertTimeout)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [health.consecutiveFailures])

  const handleFixIssues = async () => {
    setShowAlert(false)
    
    try {
      const success = await AuthRecoverySystem.performRecovery()
      if (!success) {
        // Se a recuperação automática falhar, mostrar opção de emergência
        const shouldEmergencyClean = confirm(
          '⚠️ A recuperação automática falhou.\n\n' +
          'Deseja executar uma limpeza de emergência?\n' +
          'Isso irá limpar todos os dados salvos e recarregar a página.'
        )
        
        if (shouldEmergencyClean) {
          AuthRecoverySystem.emergencyCleanup()
        }
      }
    } catch (error) {
      console.error('Erro ao tentar corrigir problemas:', error)
    }
  }

  // Não mostrar nada se tudo estiver funcionando bem
  if (!showAlert && health.isOnline && health.apiHealthy) {
    return null
  }

  return (
    <>
      {/* Indicador de status discreto no canto */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center space-x-2">
          {!health.isOnline && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <WifiOff className="h-4 w-4 mr-1" />
              Offline
            </div>
          )}
          
          {health.isOnline && !health.apiHealthy && (
            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <Wifi className="h-4 w-4 mr-1" />
              API Issues
            </div>
          )}
        </div>
      </div>

      {/* Alert modal para problemas persistentes */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Problemas Detectados
              </h3>
            </div>
            
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-2">
                O sistema detectou problemas de conectividade ou performance:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {!health.isOnline && (
                  <li>Sem conexão com a internet</li>
                )}
                {!health.apiHealthy && (
                  <li>API não está respondendo corretamente</li>
                )}
                <li>
                  {health.consecutiveFailures} falhas consecutivas detectadas
                </li>
              </ul>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={handleFixIssues}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🔧 Tentar Corrigir Automaticamente
              </button>
              
              <button
                onClick={() => setShowAlert(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Dispensar
              </button>
              
              <button
                onClick={() => AuthRecoverySystem.emergencyCleanup()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                🚨 Limpeza de Emergência
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Última verificação: {health.lastCheck.toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </>
  )
} 