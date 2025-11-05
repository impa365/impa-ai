/**
 * Helper para autenticação nas rotas do Quest System
 * Usa o mesmo sistema de autenticação das outras APIs
 */

import { getCurrentServerUser } from '@/lib/auth-server'
import type { NextRequest } from 'next/server'

export async function authenticateQuestRequest(request?: NextRequest): Promise<{ userId: string } | { error: string, status: number }> {
  try {
    console.log('🔐 [QUEST AUTH] Verificando autenticação...')
    
    const user = await getCurrentServerUser(request)
    
    if (!user) {
      console.log('❌ [QUEST AUTH] Usuário não autenticado')
      return { error: 'Não autenticado', status: 401 }
    }

    console.log('✅ [QUEST AUTH] Usuário autenticado:', user.email, '| ID:', user.id)
    return { userId: user.id }
    
  } catch (error: any) {
    console.error('❌ [QUEST AUTH] Erro geral:', error)
    return { error: 'Erro de autenticação', status: 500 }
  }
}

