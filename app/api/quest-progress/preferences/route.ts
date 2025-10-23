/**
 * API Route: Update Preferences
 * PATCH: Atualizar preferências do usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateQuestRequest } from '@/lib/quest-auth'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY!

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
    if (!progressData || progressData.length === 0 || !progressData[0]) {
      console.log('❌ [QUEST] Progresso não encontrado')
      return NextResponse.json({ error: 'Progresso não encontrado' }, { status: 404 })
    }

    const currentPrefs = progressData[0].preferences || {}

    // Merge com novas preferências
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences
    }

    // Atualizar no banco
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
          preferences: updatedPrefs
        })
      }
    )

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      console.error('❌ [QUEST] Erro ao atualizar preferências:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar preferências' },
        { status: updateResponse.status }
      )
    }

    const updated = await updateResponse.json()
    console.log('✅ [QUEST] Preferências atualizadas')

    return NextResponse.json(updated[0])

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

