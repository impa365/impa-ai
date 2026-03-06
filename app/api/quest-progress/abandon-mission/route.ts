/**
 * API Route: Abandon Mission
 * POST: Abandonar missão ativa
 */

import { NextRequest, NextResponse } from 'next/server'
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

    console.log('⚠️ [QUEST] Abandonando missão para usuário:', userId)

    // Buscar progresso
    const progress = await queryOne<any>(
      "SELECT * FROM user_quest_progress WHERE user_id = $1",
      [userId]
    )

    if (!progress) {
      console.log('❌ [QUEST] Progresso não encontrado')
      return NextResponse.json({ error: 'Progresso não encontrado' }, { status: 404 })
    }

    if (!progress.active_mission_id) {
      return NextResponse.json({ error: 'Nenhuma missão ativa' }, { status: 400 })
    }

    // Limpar missão ativa
    const updated = await queryOne<any>(
      "UPDATE user_quest_progress SET active_mission_id = NULL, mission_progress = $2 WHERE user_id = $1 RETURNING *",
      [userId, JSON.stringify({})]
    )

    if (!updated) {
      console.error('❌ [QUEST] Erro ao abandonar missão')
      return NextResponse.json(
        { error: 'Erro ao abandonar missão' },
        { status: 500 }
      )
    }

    console.log('✅ [QUEST] Missão abandonada')

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

