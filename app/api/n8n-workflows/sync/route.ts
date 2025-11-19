import { NextResponse } from "next/server"

// POST - Sincronizar workflows do painel com a API externa
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workflows } = body

    if (!Array.isArray(workflows) || workflows.length === 0) {
      return NextResponse.json(
        { error: "Nenhum workflow para sincronizar" },
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

    const results = []

    for (const item of workflows) {
      try {
        // A API retorna: { workflow: { id, nome, descrição, fluxo } }
        const workflowMeta = item.workflow
        const workflowData = workflowMeta.fluxo // O workflow n8n real está em 'fluxo'

        // Verificar se workflow já existe
        const checkResponse = await fetch(
          `${supabaseUrl}/rest/v1/n8n_workflows?select=*&workflow_id=eq.${workflowMeta.id}`,
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
            `${supabaseUrl}/rest/v1/n8n_workflows?workflow_id=eq.${workflowMeta.id}`,
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
                name: workflowMeta.nome,
                descricao: workflowMeta.descricao || workflowMeta.descrição || null,
                workflow_data: workflowData,
                categoria: item.categoria,
                imagem_fluxo: item.imagem_fluxo,
                criado_em: item.criado_em,
                // NÃO atualizar ultima_atualizacao aqui - preserva data do banco para detectar updates
                prioridade: item.prioridade || 999,
                updated_at: new Date().toISOString(),
              }),
            }
          )

          if (updateResponse.ok) {
            results.push({
              workflow_id: workflowMeta.id,
              name: workflowMeta.nome,
              action: "updated",
              success: true,
            })
          } else {
            results.push({
              workflow_id: workflowMeta.id,
              name: workflowMeta.nome,
              action: "update_failed",
              success: false,
            })
          }
        } else {
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
                workflow_id: workflowMeta.id,
                name: workflowMeta.nome,
                descricao: workflowMeta.descricao || workflowMeta.descrição || null,
                workflow_data: workflowData,
                categoria: item.categoria,
                imagem_fluxo: item.imagem_fluxo,
                criado_em: item.criado_em,
                ultima_atualizacao: item.ultima_atualizacao,
                prioridade: item.prioridade || 999,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }),
            }
          )

          if (createResponse.ok) {
            results.push({
              workflow_id: workflowMeta.id,
              name: workflowMeta.nome,
              action: "created",
              success: true,
            })
          } else {
            results.push({
              workflow_id: workflowMeta.id,
              name: workflowMeta.nome,
              action: "create_failed",
              success: false,
            })
          }
        }
      } catch (error: any) {
        results.push({
          workflow_id: item.workflow?.id || "unknown",
          name: item.workflow?.nome || "unknown",
          action: "error",
          success: false,
          error: error.message,
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${successCount} sucesso, ${failCount} falhas`,
      results,
      successCount,
      failCount,
    })
  } catch (error: any) {
    console.error("Erro ao sincronizar workflows:", error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
