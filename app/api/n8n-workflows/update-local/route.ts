import { NextResponse } from "next/server"
import { query } from "@/lib/db"

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

    // Atualizar workflow no banco local
    const { rowCount } = await query(
      `UPDATE n8n_workflows
       SET workflow_data = $1, ultima_atualizacao = $2, updated_at = $3
       WHERE workflow_id = $4`,
      [workflow_data, ultima_atualizacao || new Date().toISOString(), new Date().toISOString(), workflow_id]
    )

    if (rowCount === 0) {
      throw new Error(`Workflow não encontrado: ${workflow_id}`)
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
