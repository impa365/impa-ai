import { NextResponse } from "next/server"

// POST - Sincronizar APENAS workflows NOVOS (nunca atualiza workflows existentes)
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
        const workflowMeta = item.workflow
        const workflowData = workflowMeta.fluxo

        // Verificar se workflow já existe
        const checkResponse = await fetch(
          `${supabaseUrl}/rest/v1/n8n_workflows?select=id&workflow_id=eq.${workflowMeta.id}`,
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
          // Workflow já existe - PULAR (não atualizar)
          results.push({
            workflow_id: workflowMeta.id,
            name: workflowMeta.nome,
            action: "skipped",
            success: true,
            message: "Workflow já existe - não atualizado automaticamente",
          })
          continue
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

    const createdCount = results.filter((r) => r.action === "created").length
    const skippedCount = results.filter((r) => r.action === "skipped").length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${createdCount} novos, ${skippedCount} já existentes, ${failCount} falhas`,
      results,
      createdCount,
      skippedCount,
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
