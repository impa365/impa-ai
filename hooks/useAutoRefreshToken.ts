import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, setCurrentUser, clearCurrentUser } from '@/lib/auth'

/**
 * Hook para renovar automaticamente os tokens JWT
 * Previne logout automático por expiração de token
 */
export function useAutoRefreshToken() {
  const router = useRouter()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  const refreshToken = async (): Promise<boolean> => {
    // Evitar múltiplas chamadas simultâneas
    if (isRefreshingRef.current) {
      console.log('🔄 Refresh já em andamento, aguardando...')
      return true
    }

    try {
      isRefreshingRef.current = true
      console.log('🔄 Iniciando refresh automático de token...')

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Importante para enviar cookies
      })

      if (!response.ok) {
        console.error('❌ Falha no refresh do token:', response.status)
        
        // Se o refresh falhou, fazer logout
        if (response.status === 401) {
          console.log('🚪 Token expirado, fazendo logout...')
          clearCurrentUser()
          router.push('/')
          return false
        }
        
        return false
      }

      const data = await response.json()
      
      if (data.user) {
        console.log('✅ Token renovado com sucesso para:', data.user.email)
        
        // Atualizar dados do usuário localmente
        setCurrentUser(data.user)
        
        return true
      }

      return false
    } catch (error) {
      console.error('💥 Erro ao renovar token:', error)
      return false
    } finally {
      isRefreshingRef.current = false
    }
  }

  const startAutoRefresh = () => {
    // Limpar intervalo anterior se existir
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    // Verificar se usuário está logado
    const user = getCurrentUser()
    if (!user) {
      console.log('❌ Usuário não logado, auto-refresh não será iniciado')
      return
    }

    console.log('✅ Auto-refresh de token iniciado para:', user.email)

    // Fazer primeiro refresh imediatamente (caso o token já esteja próximo do vencimento)
    refreshToken()

    // Renovar token a cada 45 minutos (token expira em 1 hora)
    // Isso garante que sempre teremos um token válido com 15min de margem
    refreshIntervalRef.current = setInterval(() => {
      console.log('⏰ Executando refresh periódico de token...')
      refreshToken()
    }, 45 * 60 * 1000) // 45 minutos
  }

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      console.log('🛑 Auto-refresh de token parado')
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }

  useEffect(() => {
    startAutoRefresh()

    // Cleanup ao desmontar componente
    return () => {
      stopAutoRefresh()
    }
  }, [])

  return {
    refreshToken,
    startAutoRefresh,
    stopAutoRefresh,
  }
}
