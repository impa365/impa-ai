import { NextResponse } from "next/server"

// GET - Listar workflows salvos no banco
export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/n8n_workflows?select=*&order=prioridade.asc,updated_at.desc`,
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const workflows = await response.json()

    return NextResponse.json({
      success: true,
      workflows: Array.isArray(workflows) ? workflows : [],
    })
  } catch (error: any) {
    console.error("Erro ao buscar workflows:", error.message)
    return NextResponse.json({
      success: false,
      workflows: [],
      error: error.message,
    })
  }
}

// POST - Salvar/atualizar workflow no banco
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workflow_id, name, workflow_data, categoria, imagem_fluxo, criado_em, ultima_atualizacao } = body

    if (!workflow_id || !name || !workflow_data) {
      return NextResponse.json(
        { success: false, error: "Dados insuficientes" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Verificar se workflow já existe
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/n8n_workflows?select=*&workflow_id=eq.${workflow_id}`,
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

    const existing = await checkResponse.json()

    if (Array.isArray(existing) && existing.length > 0) {
      // Atualizar workflow existente
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
            name,
            workflow_data,
            categoria,
            imagem_fluxo,
            criado_em,
            ultima_atualizacao,
            updated_at: new Date().toISOString(),
          }),
        }
      )

      if (!updateResponse.ok) {
        throw new Error(`Erro ao atualizar workflow: ${updateResponse.status}`)
      }

      return NextResponse.json({
        success: true,
        message: "Workflow atualizado com sucesso",
        action: "updated",
      })
    }

    // Criar novo workflow
    const createResponse = await fetch(
      `${supabaseUrl}/rest/v1/n8n_workflows`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          workflow_id,
          name,
          workflow_data,
          categoria,
          imagem_fluxo,
          criado_em,
          ultima_atualizacao,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      }
    )

    if (!createResponse.ok) {
      throw new Error(`Erro ao criar workflow: ${createResponse.status}`)
    }

    const created = await createResponse.json()

    return NextResponse.json({
      success: true,
      message: "Workflow salvo com sucesso",
      action: "created",
      workflow: created,
    })
  } catch (error: any) {
    console.error("Erro ao salvar workflow:", error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
