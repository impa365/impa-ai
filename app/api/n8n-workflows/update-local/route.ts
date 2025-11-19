import { NextResponse } from "next/server"

// POST - Atualizar workflow no banco local (marcar como atualizado)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workflow_id, workflow_data, ultima_atualizacao, force_update } = body

    // BLOQUEIO DE SEGURANÇA: Requer confirmação explícita para atualizar
    if (force_update !== true) {
      return NextResponse.json(
        { error: "Atualização bloqueada: requer confirmação explícita do usuário (force_update: true)" },
        { status: 403 }
      )
    }

    if (!workflow_id || !workflow_data) {
      return NextResponse.json(
        { error: "Dados insuficientes" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      )
    }

    // Atualizar workflow no banco local
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/n8n_workflows?workflow_id=eq.${workflow_id}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
        body: JSON.stringify({
          workflow_data: workflow_data,
          ultima_atualizacao: ultima_atualizacao || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      }
    )

    if (!updateResponse.ok) {
      throw new Error(`Erro ao atualizar workflow: ${updateResponse.status}`)
    }

    return NextResponse.json({
      success: true,
      message: "Workflow atualizado no banco local",
    })
  } catch (error: any) {
    console.error("Erro ao atualizar workflow local:", error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
