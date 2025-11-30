/**
 * Helper para autenticação nas rotas do Quest System
 * Usa o mesmo sistema de autenticação das outras APIs
 */

import { getCurrentServerUser } from '@/lib/auth-server'
import { supabaseGet } from '@/lib/quest-supabase'
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

/**
 * Verificar se o Quest System está ativo para o usuário
 * Retorna null se estiver ativo, ou um NextResponse se estiver desativado
 */
export async function checkQuestSystemEnabled(userId: string): Promise<boolean> {
  try {
    const data = await supabaseGet('user_quest_progress', `user_id=eq.${userId}&select=preferences`)
    
    if (!data || data.length === 0) {
      // Se não tem progresso ainda, sistema está ativo por padrão
      return true
    }
    
    const preferences = data[0].preferences || {}
    const isEnabled = preferences.showARIA !== false
    
    if (!isEnabled) {
      console.log('⏸️ [QUEST] Sistema desativado (showARIA: false)')
    }
    
    return isEnabled
  } catch (error) {
    console.error('❌ [QUEST] Erro ao verificar status:', error)
    // Em caso de erro, permitir (fail-open)
    return true
  }
}

