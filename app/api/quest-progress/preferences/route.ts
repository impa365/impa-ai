/**
 * API Route: Update Preferences
 * PATCH: Atualizar preferências do usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateQuestRequest } from '@/lib/quest-auth'
import { queryOne } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    // Autenticação
    const auth = await authenticateQuestRequest(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const userId = auth.userId

    const preferences = await request.json()

    console.log('⚙️ [QUEST] Atualizando preferências:', preferences)

    // Buscar preferências atuais
    const progress = await queryOne<any>(
      "SELECT * FROM user_quest_progress WHERE user_id = $1",
      [userId]
    )

    if (!progress) {
      console.log('❌ [QUEST] Progresso não encontrado')
      return NextResponse.json({ error: 'Progresso não encontrado' }, { status: 404 })
    }

    const currentPrefs = progress.preferences || {}

    // Merge com novas preferências
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences
    }

    // Atualizar no banco
    const updated = await queryOne<any>(
      "UPDATE user_quest_progress SET preferences = $1 WHERE user_id = $2 RETURNING *",
      [JSON.stringify(updatedPrefs), userId]
    )

    if (!updated) {
      console.error('❌ [QUEST] Erro ao atualizar preferências')
      return NextResponse.json(
        { error: 'Erro ao atualizar preferências' },
        { status: 500 }
      )
    }

    console.log('✅ [QUEST] Preferências atualizadas')

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

