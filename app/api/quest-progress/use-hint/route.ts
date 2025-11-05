/**
 * API Route: Use Hint
 * POST: Registrar uso de hint
 */

import { NextRequest, NextResponse } from 'next/server'
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

    console.log('🔍 [QUEST] Buscando hint para usuário:', userId)

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
    const missionProgress = progress?.mission_progress || {}

    // Incrementar contador de hints
    const updatedProgress = {
      ...missionProgress,
      hintsUsed: (missionProgress.hintsUsed || 0) + 1,
      lastActivityAt: new Date().toISOString()
    }

    console.log('📝 [QUEST] Atualizando hint count:', updatedProgress.hintsUsed)

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
          mission_progress: updatedProgress
        })
      }
    )

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      console.error('❌ [QUEST] Erro ao registrar hint:', error)
      return NextResponse.json(
        { error: 'Erro ao registrar hint' },
        { status: updateResponse.status }
      )
    }

    const updated = await updateResponse.json()
    console.log('✅ [QUEST] Hint registrado com sucesso')
    return NextResponse.json(updated[0])

  } catch (error: any) {
    console.error('❌ [QUEST] Erro geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

