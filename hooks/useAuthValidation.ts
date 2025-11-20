import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

/**
 * Hook para validar autenticação quando o usuário retorna à aba
 * Previne uso de sessão expirada
 */
export function useAuthValidation() {
  const router = useRouter()

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Quando a aba fica visível novamente
      if (!document.hidden) {
        console.log('👁️ Aba visível, verificando autenticação...')
        
        const user = getCurrentUser()
        
        if (!user) {
          console.log('❌ Usuário não encontrado, redirecionando para login...')
          router.push('/')
        } else {
          console.log('✅ Usuário válido:', user.email)
        }
      }
    }

    // Adicionar listener para mudança de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router])
}
