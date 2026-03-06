import { NextResponse } from "next/server"
import { query, queryMany } from "@/lib/db"

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

    const results = []

    for (const item of workflows) {
      try {
        const workflowMeta = item.workflow
        const workflowData = workflowMeta.fluxo

        // Verificar se workflow já existe
        const existing = await queryMany(
          "SELECT id FROM n8n_workflows WHERE workflow_id = $1",
          [workflowMeta.id]
        )

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
        const { rowCount } = await query(
          `INSERT INTO n8n_workflows (workflow_id, name, descricao, workflow_data, categoria, imagem_fluxo, criado_em, ultima_atualizacao, prioridade, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            workflowMeta.id,
            workflowMeta.nome,
            workflowMeta.descricao || workflowMeta.descrição || null,
            workflowData,
            item.categoria,
            item.imagem_fluxo,
            item.criado_em,
            item.ultima_atualizacao,
            item.prioridade || 999,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        )

        if (rowCount > 0) {
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
