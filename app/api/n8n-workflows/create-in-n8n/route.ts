import { NextResponse } from "next/server"
import { query, queryMany } from "@/lib/db"

// POST - Criar workflow no n8n usando a API
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workflow_data, workflow_id } = body

    if (!workflow_data) {
      return NextResponse.json(
        { error: "Dados do workflow não fornecidos" },
        { status: 400 }
      )
    }

    // Buscar configurações do n8n
    const integrations = await queryMany(
      "SELECT * FROM integrations WHERE type = $1",
      ["n8n_api"]
    )

    if (!Array.isArray(integrations) || integrations.length === 0) {
      return NextResponse.json(
        { error: "Configuração do n8n não encontrada. Configure a integração N8N API primeiro." },
        { status: 400 }
      )
    }

    const n8nConfig = integrations[0].config
    const { n8n_url, n8n_apikey } = n8nConfig

    if (!n8n_url || !n8n_apikey) {
      return NextResponse.json(
        { error: "URL ou API Key do n8n não configurados" },
        { status: 400 }
      )
    }

    // Preparar dados do workflow removendo campos read-only
    const workflowPayload: any = {
      name: workflow_data.name,
      nodes: workflow_data.nodes || [],
      connections: workflow_data.connections || {},
      settings: workflow_data.settings || {},
    }

    // Adicionar campos opcionais se existirem
    if (workflow_data.staticData) {
      workflowPayload.staticData = workflow_data.staticData
    }

    // Criar workflow no n8n (sem o campo 'active' que é read-only)
    const n8nResponse = await fetch(`${n8n_url}/api/v1/workflows`, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": n8n_apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowPayload),
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      throw new Error(`Erro ao criar workflow no n8n: ${n8nResponse.status} - ${errorText}`)
    }

    const createdWorkflow = await n8nResponse.json()

    // Se o workflow original estava ativo, ativar no n8n
    if (workflow_data.active) {
      const activateResponse = await fetch(`${n8n_url}/api/v1/workflows/${createdWorkflow.id}/activate`, {
        method: "POST",
        headers: {
          "X-N8N-API-KEY": n8n_apikey,
        },
      })

      if (!activateResponse.ok) {
        console.warn("Aviso: Workflow criado mas não foi possível ativá-lo automaticamente")
      }
    }

    // Atualizar banco com o ID do n8n
    if (workflow_id) {
      await query(
        `UPDATE n8n_workflows
         SET synced_to_n8n = $1, n8n_workflow_id = $2, updated_at = $3
         WHERE workflow_id = $4`,
        [true, createdWorkflow.id, new Date().toISOString(), workflow_id]
      )
    }

    return NextResponse.json({
      success: true,
      message: `Workflow criado no n8n com sucesso${workflow_data.active ? ' e ativado' : ''}`,
      workflow: createdWorkflow,
    })
  } catch (error: any) {
    console.error("Erro ao criar workflow no n8n:", error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
