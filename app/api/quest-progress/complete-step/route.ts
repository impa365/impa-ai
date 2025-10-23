/**
 * API Route: Complete Step
 * POST: Completar um step da missão ativa
 */

import { NextRequest, NextResponse } from 'next/server'
import { QUEST_MISSIONS } from '@/lib/quest-missions'
import { authenticateQuestRequest } from '@/lib/quest-auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const auth = await authenticateQuestRequest(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const userId = auth.userId

    const { missionId, stepId } = await request.json()

    console.log('✅ [QUEST] Completando step:', stepId, 'da missão:', missionId)

    // Buscar progresso
    const progressResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_quest_progress?user_id=eq.${userId}&select=*`,
      {
        headers: {
          'Accept-Profile': 'impaai',
          'Content-Profile': 'impaai',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    )

    const progressData = await progressResponse.json()
    console.log('📊 [QUEST] Dados recebidos:', progressData)

    if (!progressData || progressData.length === 0 || !progressData[0]) {
      console.log('❌ [QUEST] Progresso não encontrado')
      return NextResponse.json({ error: 'Progresso não encontrado' }, { status: 404 })
    }

    const progress = progressData[0]

    // Verificar se esta missão está ativa
    if (progress.active_mission_id !== missionId) {
      console.log(`❌ [QUEST] Missão não ativa. Esperado: ${missionId}, Atual: ${progress.active_mission_id}`)
      return NextResponse.json({ error: 'Esta missão não está ativa' }, { status: 400 })
    }

    // Buscar a missão
    const mission = QUEST_MISSIONS.find(m => m.id === missionId)
    if (!mission) {
      return NextResponse.json({ error: 'Missão não encontrada' }, { status: 404 })
    }

    // Buscar o step
    const stepIndex = mission.steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) {
      return NextResponse.json({ error: 'Step não encontrado' }, { status: 404 })
    }

    const missionProgress = progress.mission_progress || {}
    const completedSteps = missionProgress.completedSteps || []

    // Verificar se já completou este step
    if (completedSteps.includes(stepId)) {
      return NextResponse.json({ message: 'Step já completado' })
    }

    // Adicionar step aos completados
    completedSteps.push(stepId)

    // Avançar para próximo step
    const nextStepIndex = stepIndex + 1

    // Atualizar progresso
    const updatedMissionProgress = {
      ...missionProgress,
      currentStepIndex: nextStepIndex,
      completedSteps,
      lastActivityAt: new Date().toISOString()
    }

    console.log('📝 [QUEST] Atualizando progresso:', {
      currentStepIndex: nextStepIndex,
      totalSteps: mission.steps.length,
      completedStepsCount: completedSteps.length
    })

    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_quest_progress?user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Accept-Profile': 'impaai',
          'Content-Profile': 'impaai',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          mission_progress: updatedMissionProgress
        })
      }
    )

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      console.error('❌ [QUEST] Erro ao completar step:', error)
      return NextResponse.json(
        { error: 'Erro ao completar step' },
        { status: updateResponse.status }
      )
    }

    const updated = await updateResponse.json()
    console.log('✅ [QUEST] Step completado com sucesso')

    return NextResponse.json(updated[0])

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

