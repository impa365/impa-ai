/**
 * API Route: Use Hint
 * POST: Registrar uso de hint
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

    console.log('🔍 [QUEST] Buscando hint para usuário:', userId)

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

    const missionProgress = progress.mission_progress || {}

    // Incrementar contador de hints
    const updatedProgress = {
      ...missionProgress,
      hintsUsed: (missionProgress.hintsUsed || 0) + 1,
      lastActivityAt: new Date().toISOString()
    }

    console.log('📝 [QUEST] Atualizando hint count:', updatedProgress.hintsUsed)

    const updated = await queryOne<any>(
      "UPDATE user_quest_progress SET mission_progress = $1 WHERE user_id = $2 RETURNING *",
      [JSON.stringify(updatedProgress), userId]
    )

    if (!updated) {
      console.error('❌ [QUEST] Erro ao registrar hint')
      return NextResponse.json(
        { error: 'Erro ao registrar hint' },
        { status: 500 }
      )
    }

    console.log('✅ [QUEST] Hint registrado com sucesso')
    return NextResponse.json(updated)

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

