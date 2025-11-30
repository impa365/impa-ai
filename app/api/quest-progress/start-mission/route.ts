/**
 * API Route: Start Mission
 * POST: Iniciar uma nova missão
 */

import { NextRequest, NextResponse } from 'next/server'
import { QUEST_MISSIONS } from '@/lib/quest-missions'
import { authenticateQuestRequest, checkQuestSystemEnabled } from '@/lib/quest-auth'
import { supabaseGet, supabasePatch } from '@/lib/quest-supabase'

export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const auth = await authenticateQuestRequest(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const userId = auth.userId

    // Verificar se quest system está ativo
    const isEnabled = await checkQuestSystemEnabled(userId)
    if (!isEnabled) {
      return NextResponse.json({ questDisabled: true }, { status: 200 })
    }

    const { missionId } = await request.json()

    console.log('🎮 [QUEST] Iniciando missão:', missionId, 'para usuário:', userId)

    // Verificar se a missão existe
    const mission = QUEST_MISSIONS.find(m => m.id === missionId)
    if (!mission) {
      return NextResponse.json({ error: 'Missão não encontrada' }, { status: 404 })
    }

    // Buscar progresso atual
    let progressData
    try {
      progressData = await supabaseGet('user_quest_progress', `user_id=eq.${userId}&select=*`)
    } catch (error: any) {
      console.error('❌ [QUEST] Erro ao buscar progresso:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar progresso' }, { status: 500 })
    }

    if (!progressData || progressData.length === 0) {
      return NextResponse.json({ error: 'Progresso não encontrado' }, { status: 404 })
    }

    const progress = progressData[0]

    // Verificar se já tem uma missão ativa
    if (progress.active_mission_id) {
      return NextResponse.json(
        { error: 'Você já tem uma missão ativa. Complete ou abandone antes de iniciar outra.' },
        { status: 400 }
      )
    }

    // Verificar se já completou esta missão
    if (progress.completed_missions?.includes(missionId)) {
      return NextResponse.json(
        { error: 'Você já completou esta missão' },
        { status: 400 }
      )
    }

    // Atualizar progresso
    try {
      const updated = await supabasePatch('user_quest_progress', `user_id=eq.${userId}`, {
        active_mission_id: missionId,
        mission_progress: {
          missionId,
          currentStepIndex: 0,
          completedSteps: [],
          startedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          attempts: 0,
          hintsUsed: 0,
          errors: 0
        }
      })

      console.log('✅ [QUEST] Missão iniciada com sucesso')
      return NextResponse.json(updated[0])
      
    } catch (error: any) {
      console.error('❌ [QUEST] Erro ao iniciar missão:', error.message)
      return NextResponse.json(
        { error: 'Erro ao iniciar missão' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

