/**
 * API Route: Quest Progress
 * GET: Buscar progresso do usuário
 * POST: Inicializar progresso (primeira vez)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateQuestRequest } from '@/lib/quest-auth'
import { supabaseGet, supabasePost } from '@/lib/quest-supabase'

/**
 * Normalizar progresso do banco (snake_case) para API (camelCase)
 */
function normalizeProgress(dbProgress: any) {
  console.log('🔧 [NORMALIZE] Dados do banco:', dbProgress)
  
  const normalized = {
    id: dbProgress.id,
    userId: dbProgress.user_id,
    totalXP: dbProgress.total_xp || 0,
    currentLevel: dbProgress.current_level || 1,
    completedMissions: dbProgress.completed_missions || [],
    unlockedBadges: dbProgress.unlocked_badges || [],
    activeMissionId: dbProgress.active_mission_id || null,
    missionProgress: dbProgress.mission_progress || null,
    stats: dbProgress.stats || {
      totalMissionsCompleted: 0,
      fastestSpeedrun: null,
      perfectMissions: 0,
      totalHintsUsed: 0,
      totalTimeSpent: 0
    },
    preferences: dbProgress.preferences || {
      soundEnabled: true,
      autoStartMissions: false,
      showARIA: true,
      celebrationEffects: true
    },
    createdAt: dbProgress.created_at,
    updatedAt: dbProgress.updated_at
  }
  
  console.log('✅ [NORMALIZE] Dados normalizados:', normalized)
  console.log('✅ [NORMALIZE] Preferences:', normalized.preferences)
  
  return normalized
}

/**
 * Buscar progresso do usuário
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const auth = await authenticateQuestRequest(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const userId = auth.userId

    console.log('🎮 [QUEST] Buscando progresso do usuário:', userId)

    // Buscar progresso no Supabase para verificar se está ativo
    let data
    try {
      data = await supabaseGet('user_quest_progress', `user_id=eq.${userId}&select=*`)
    } catch (error: any) {
      console.error('❌ [QUEST] Erro ao buscar progresso:', error.message)
      return NextResponse.json(
        { error: 'Erro ao buscar progresso' },
        { status: 500 }
      )
    }

    // Se não existe, criar automaticamente
    if (!data || data.length === 0) {
      console.log('🆕 [QUEST] Criando progresso inicial para usuário:', userId)
      
      try {
        const newData = await supabasePost('user_quest_progress', {
          user_id: userId,
          total_xp: 0,
          current_level: 1,
          completed_missions: [],
          unlocked_badges: [],
          active_mission_id: null,
          mission_progress: null,
          stats: {
            totalMissionsCompleted: 0,
            fastestSpeedrun: null,
            perfectMissions: 0,
            totalHintsUsed: 0,
            totalTimeSpent: 0
          },
          preferences: {
            soundEnabled: true,
            autoStartMissions: false,
            showARIA: true,
            celebrationEffects: true
          }
        })
        data = [newData]
      } catch (error: any) {
        console.error('❌ [QUEST] Erro ao criar progresso:', error.message)
        return NextResponse.json(
          { error: 'Erro ao criar progresso' },
          { status: 500 }
        )
      }
    }

    // ⚠️ VERIFICAR SE SISTEMA ESTÁ DESATIVADO
    const preferences = data[0].preferences || {}
    if (preferences.showARIA === false) {
      console.log('⏸️ [QUEST] Sistema desativado (showARIA: false) - retornando vazio')
      return NextResponse.json({
        questDisabled: true,
        message: 'Sistema de tutorial desativado'
      }, { status: 200 })
    }

    console.log('✅ [QUEST] Progresso encontrado')
    const normalizedData = normalizeProgress(data[0])
    return NextResponse.json(normalizedData)

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

