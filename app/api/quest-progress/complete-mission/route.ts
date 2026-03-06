/**
 * API Route: Complete Mission
 * POST: Completar missão ativa e conceder recompensas
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

    const { missionId } = await request.json()

    console.log('🎉 [QUEST] Completando missão:', missionId)

    // Buscar progresso
    const progress = await queryOne<any>(
      "SELECT * FROM user_quest_progress WHERE user_id = $1",
      [userId]
    )

    if (!progress) {
      console.log('❌ [QUEST] Progresso não encontrado')
      return NextResponse.json({ error: 'Progresso não encontrado' }, { status: 404 })
    }

    // Verificar se esta missão está ativa
    if (progress.active_mission_id !== missionId) {
      return NextResponse.json({ error: 'Esta missão não está ativa' }, { status: 400 })
    }

    // Buscar a missão
    const mission = QUEST_MISSIONS.find(m => m.id === missionId)
    if (!mission) {
      return NextResponse.json({ error: 'Missão não encontrada' }, { status: 404 })
    }

    // Calcular recompensas
    const newXP = (progress.total_xp || 0) + mission.rewards.xp
    const completedMissions = [...(progress.completed_missions || []), missionId]
    
    console.log('🎁 [QUEST] Badges da missão:', mission.rewards.badges)
    console.log('🏅 [QUEST] Badges já desbloqueados:', progress.unlocked_badges)
    
    const newBadges = mission.rewards.badges.filter(
      badge => !progress.unlocked_badges?.includes(badge)
    )
    const unlockedBadges = [...(progress.unlocked_badges || []), ...newBadges]
    
    console.log('🆕 [QUEST] Novos badges a desbloquear:', newBadges)
    console.log('📋 [QUEST] Lista final de badges:', unlockedBadges)

    // Calcular tempo gasto
    const missionProgress = progress.mission_progress || {}
    const startTime = new Date(missionProgress.startedAt).getTime()
    const endTime = Date.now()
    const timeSpent = Math.floor((endTime - startTime) / 1000) // Em segundos

    // Verificar se foi perfeito (sem erros, sem hints)
    const isPerfect = (missionProgress.errors || 0) === 0 && (missionProgress.hintsUsed || 0) === 0

    // Verificar se foi speedrun
    const isSpeedrun = mission.id === 'speedrun-challenge' && timeSpent < 120

    // Adicionar badges especiais
    if (isPerfect && !unlockedBadges.includes('perfectionist')) {
      unlockedBadges.push('perfectionist')
    }
    if (isSpeedrun && !unlockedBadges.includes('quantum-flash')) {
      unlockedBadges.push('quantum-flash')
    }

    // Atualizar stats
    const stats = progress.stats || {}
    const newStats = {
      ...stats,
      totalMissionsCompleted: (stats.totalMissionsCompleted || 0) + 1,
      perfectMissions: isPerfect ? (stats.perfectMissions || 0) + 1 : (stats.perfectMissions || 0),
      fastestSpeedrun: isSpeedrun 
        ? (stats.fastestSpeedrun ? Math.min(stats.fastestSpeedrun, timeSpent) : timeSpent)
        : stats.fastestSpeedrun,
      totalTimeSpent: (stats.totalTimeSpent || 0) + timeSpent,
      totalHintsUsed: (stats.totalHintsUsed || 0) + (missionProgress.hintsUsed || 0)
    }

    // Atualizar progresso
    const updated = await queryOne<any>(
      `UPDATE user_quest_progress
       SET total_xp = $1, completed_missions = $2, unlocked_badges = $3,
           active_mission_id = $4, mission_progress = $5, stats = $6
       WHERE user_id = $7 RETURNING *`,
      [
        newXP,
        JSON.stringify(completedMissions),
        JSON.stringify(unlockedBadges),
        null,
        JSON.stringify({}),
        JSON.stringify(newStats),
        userId
      ]
    )

    if (!updated) {
      console.error('❌ [QUEST] Erro ao completar missão')
      return NextResponse.json(
        { error: 'Erro ao completar missão' },
        { status: 500 }
      )
    }

    console.log('🎉 [QUEST] Missão completada! XP ganho:', mission.rewards.xp)
    console.log('🏆 [QUEST] Badges desbloqueados:', newBadges)

    return NextResponse.json({
      ...updated,
      rewards: {
        xp: mission.rewards.xp,
        badges: newBadges,
        isPerfect,
        isSpeedrun,
        timeSpent
      }
    })

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

