import { NextRequest, NextResponse } from 'next/server'
import { authenticateQuestRequest } from '@/lib/quest-auth'
import { supabaseGet, supabasePatch } from '@/lib/quest-supabase'

/**
 * POST /api/quest-progress/reset
 * Reseta todo o progresso do Quest System do usuário
 */
export async function POST(request: NextRequest) {
  console.log('🔄 [QUEST RESET] Iniciando reset de progresso...')

  try {
    // Autenticação
    const auth = await authenticateQuestRequest(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.userId
    console.log('🔄 [QUEST RESET] Resetando progresso do usuário:', userId)

    // Buscar o registro atual
    let existingData
    try {
      existingData = await supabaseGet('user_quest_progress', `user_id=eq.${userId}&select=id`)
    } catch (error: any) {
      console.error('❌ [QUEST RESET] Erro ao buscar progresso:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar progresso' }, { status: 500 })
    }

    if (!existingData || existingData.length === 0) {
      console.log('⚠️ [QUEST RESET] Nenhum progresso encontrado para resetar')
      return NextResponse.json({ 
        message: 'Nenhum progresso encontrado',
        resetted: false 
      }, { status: 200 })
    }

    // Resetar o progresso para o estado inicial
    const resetData = {
      total_xp: 0,
      current_level: 1,
      completed_missions: [],
      unlocked_badges: [],
      active_mission_id: null,
      mission_progress: null,
      stats: {
        perfectMissions: 0,
        fastestCompletionTime: null,
        totalMissionsCompleted: 0,
        totalHintsUsed: 0,
        totalTimeSpent: 0
      },
      preferences: {
        showARIA: true,
        soundEnabled: true,
        ariaPersonality: 'friendly',
        autoStartMissions: false,
        celebrationEffects: true
      },
      updated_at: new Date().toISOString()
    }

    // Atualizar o registro
    let updatedData
    try {
      updatedData = await supabasePatch(
        'user_quest_progress',
        `user_id=eq.${userId}`,
        resetData
      )
    } catch (error: any) {
      console.error('❌ [QUEST RESET] Erro ao resetar:', error.message)
      return NextResponse.json({ error: 'Erro ao resetar progresso' }, { status: 500 })
    }

    console.log('✅ [QUEST RESET] Progresso resetado com sucesso!')

    return NextResponse.json({
      message: 'Progresso resetado com sucesso!',
      resetted: true,
      data: updatedData && updatedData.length > 0 ? updatedData[0] : null
    })

  } catch (error) {
    console.error('❌ [QUEST RESET] Erro geral:', error)
    return NextResponse.json(
      { error: 'Failed to reset quest progress' },
      { status: 500 }
    )
  }
}

