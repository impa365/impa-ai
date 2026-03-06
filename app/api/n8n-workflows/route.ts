import { NextResponse } from "next/server"
import { query, queryMany, queryOne } from "@/lib/db"

// GET - Listar workflows salvos no banco
export async function GET() {
  try {
    const workflows = await queryMany(
      "SELECT * FROM n8n_workflows ORDER BY prioridade ASC, updated_at DESC"
    )

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

    // Verificar se workflow já existe
    const existing = await queryOne(
      "SELECT * FROM n8n_workflows WHERE workflow_id = $1",
      [workflow_id]
    )

    if (existing) {
      // Atualizar workflow existente
      await query(
        `UPDATE n8n_workflows
         SET name = $1, workflow_data = $2, categoria = $3, imagem_fluxo = $4,
             criado_em = $5, ultima_atualizacao = $6, updated_at = $7
         WHERE workflow_id = $8`,
        [name, workflow_data, categoria, imagem_fluxo, criado_em, ultima_atualizacao, new Date().toISOString(), workflow_id]
      )

      return NextResponse.json({
        success: true,
        message: "Workflow atualizado com sucesso",
        action: "updated",
      })
    }

    // Criar novo workflow
    const { rows: created } = await query(
      `INSERT INTO n8n_workflows (workflow_id, name, workflow_data, categoria, imagem_fluxo, criado_em, ultima_atualizacao, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [workflow_id, name, workflow_data, categoria, imagem_fluxo, criado_em, ultima_atualizacao, new Date().toISOString(), new Date().toISOString()]
    )

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
