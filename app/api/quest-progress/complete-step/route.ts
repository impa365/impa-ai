/**
 * API Route: Complete Step
 * POST: Completar um step da missão ativa
 */

import { NextRequest, NextResponse } from 'next/server'
import { QUEST_MISSIONS } from '@/lib/quest-missions'
import { authenticateQuestRequest, checkQuestSystemEnabled } from '@/lib/quest-auth'
import { queryOne } from '@/lib/db'

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

    const { missionId, stepId } = await request.json()

    console.log('✅ [QUEST] Completando step:', stepId, 'da missão:', missionId)

    // Buscar progresso
    const progress = await queryOne<any>(
      "SELECT * FROM user_quest_progress WHERE user_id = $1",
      [userId]
    )

    console.log('📊 [QUEST] Dados recebidos:', progress)

    if (!progress) {
      console.log('❌ [QUEST] Progresso não encontrado')
      return NextResponse.json({ error: 'Progresso não encontrado' }, { status: 404 })
    }

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

    const updated = await queryOne<any>(
      "UPDATE user_quest_progress SET mission_progress = $1 WHERE user_id = $2 RETURNING *",
      [JSON.stringify(updatedMissionProgress), userId]
    )

    if (!updated) {
      console.error('❌ [QUEST] Erro ao completar step')
      return NextResponse.json(
        { error: 'Erro ao completar step' },
        { status: 500 }
      )
    }

    console.log('✅ [QUEST] Step completado com sucesso')

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

