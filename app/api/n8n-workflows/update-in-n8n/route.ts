import { NextResponse } from "next/server"

// POST - Atualizar workflow existente no n8n
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workflow_data, workflow_id, n8n_workflow_id, ultima_atualizacao, force_update } = body

    // BLOQUEIO DE SEGURANÇA: Requer confirmação explícita para atualizar
    if (force_update !== true) {
      return NextResponse.json(
        { error: "Atualização bloqueada: requer confirmação explícita do usuário (force_update: true)" },
        { status: 403 }
      )
    }

    if (!workflow_data || !workflow_id || !n8n_workflow_id) {
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

    // Buscar configuração do n8n
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=*&type=eq.n8n_api&is_active=eq.true`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      }
    )

    if (!integrationResponse.ok) {
      throw new Error("Erro ao buscar configuração do n8n")
    }

    const integrations = await integrationResponse.json()

    if (!Array.isArray(integrations) || integrations.length === 0) {
      return NextResponse.json(
        { error: "Integração N8N API não configurada" },
        { status: 400 }
      )
    }

    const n8nConfig = integrations[0].config
    const n8n_url = n8nConfig.n8n_url
    const n8n_apikey = n8nConfig.n8n_apikey

    if (!n8n_url || !n8n_apikey) {
      return NextResponse.json(
        { error: "Configuração do n8n incompleta" },
        { status: 400 }
      )
    }

    // Construir payload do workflow (sem campos read-only)
    const workflowPayload: any = {
      name: workflow_data.name,
      nodes: workflow_data.nodes || [],
      connections: workflow_data.connections || {},
      settings: workflow_data.settings || {},
    }

    if (workflow_data.staticData) {
      workflowPayload.staticData = workflow_data.staticData
    }

    // Atualizar workflow no n8n via API
    const updateResponse = await fetch(`${n8n_url}/api/v1/workflows/${n8n_workflow_id}`, {
      method: "PUT",
      headers: {
        "X-N8N-API-KEY": n8n_apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowPayload),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      throw new Error(`Erro ao atualizar workflow no n8n: ${updateResponse.status} - ${errorText}`)
    }

    const updatedWorkflow = await updateResponse.json()

    // Atualizar última atualização no banco local
    const updateLocalResponse = await fetch(
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
          ultima_atualizacao: ultima_atualizacao || new Date().toISOString(), // Atualizar data da API
          updated_at: new Date().toISOString(),
        }),
      }
    )

    if (!updateLocalResponse.ok) {
      console.error("Erro ao atualizar workflow local, mas n8n foi atualizado com sucesso")
    }

    return NextResponse.json({
      success: true,
      message: "Workflow atualizado no n8n com sucesso",
      n8n_workflow_id: updatedWorkflow.id,
    })
  } catch (error: any) {
    console.error("Erro ao atualizar workflow no n8n:", error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
