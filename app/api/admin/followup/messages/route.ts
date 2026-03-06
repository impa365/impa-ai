import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { queryMany, queryOne, query, buildInsert } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connection_id")

    const conditions: string[] = []
    const params: any[] = []
    let paramIdx = 1

    if (connectionId) {
      conditions.push(`m.whatsapp_conenections_id = $${paramIdx++}`)
      params.push(connectionId)
    }

    // Se não for admin, filtrar por conexões do usuário
    if (user.role !== "admin") {
      const userConnections = await queryMany(
        `SELECT id FROM whatsapp_connections WHERE user_id = $1`,
        [user.id]
      )
      const connectionIds = userConnections.map((conn: any) => conn.id)

      if (connectionIds.length === 0) {
        return NextResponse.json({ success: true, messages: [] })
      }

      conditions.push(`m.whatsapp_conenections_id = ANY($${paramIdx++})`)
      params.push(connectionIds)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const messages = await queryMany(
      `SELECT m.*, wc.connection_name
       FROM "folowUp24hs_mensagem" m
       LEFT JOIN whatsapp_connections wc ON m.whatsapp_conenections_id = wc.id
       ${whereClause}
       ORDER BY m.tentativa_dia ASC`,
      params
    )

    return NextResponse.json({
      success: true,
      messages: messages || [],
    })
  } catch (error: any) {
    console.error("Erro na API followup/messages GET:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { whatsapp_conenections_id, tentativa_dia, tipo_mensagem, mensagem, link } = body

    if (!whatsapp_conenections_id || !tentativa_dia || !tipo_mensagem) {
      return NextResponse.json(
        { error: "Campos obrigatórios: whatsapp_conenections_id, tentativa_dia, tipo_mensagem" },
        { status: 400 }
      )
    }

    // Verificar se a conexão pertence ao usuário (se não for admin)
    if (user.role !== "admin") {
      const conn = await queryOne(
        `SELECT id FROM whatsapp_connections WHERE id = $1 AND user_id = $2`,
        [whatsapp_conenections_id, user.id]
      )

      if (!conn) {
        return NextResponse.json({ error: "Conexão não encontrada ou sem permissão" }, { status: 403 })
      }
    }

    // Criar mensagem
    const ins = buildInsert('"folowUp24hs_mensagem"', {
      whatsapp_conenections_id,
      tentativa_dia: Number(tentativa_dia),
      tipo_mensagem,
      mensagem: mensagem || null,
      link: link || null,
    })

    const createdMessage = await queryOne(ins.text, ins.values)

    return NextResponse.json({
      success: true,
      message: createdMessage,
    })
  } catch (error: any) {
    console.error("Erro na API followup/messages POST:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, whatsapp_conenections_id, tentativa_dia, tipo_mensagem, mensagem, link } = body

    if (!id) {
      return NextResponse.json({ error: "ID da mensagem é obrigatório" }, { status: 400 })
    }

    // Verificar se a mensagem existe e se o usuário tem permissão
    if (user.role !== "admin") {
      const msg = await queryOne(
        `SELECT m.*, wc.user_id AS wc_user_id
         FROM "folowUp24hs_mensagem" m
         LEFT JOIN whatsapp_connections wc ON m.whatsapp_conenections_id = wc.id
         WHERE m.id = $1`,
        [id]
      )

      if (!msg) {
        return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
      }

      if (msg.wc_user_id !== user.id) {
        return NextResponse.json({ error: "Sem permissão para editar esta mensagem" }, { status: 403 })
      }
    }

    // Atualizar mensagem - build SET clauses dynamically
    const setClauses: string[] = []
    const params: any[] = []
    let paramIdx = 1

    if (whatsapp_conenections_id !== undefined) {
      setClauses.push(`whatsapp_conenections_id = $${paramIdx++}`)
      params.push(whatsapp_conenections_id)
    }
    if (tentativa_dia !== undefined) {
      setClauses.push(`tentativa_dia = $${paramIdx++}`)
      params.push(Number(tentativa_dia))
    }
    if (tipo_mensagem !== undefined) {
      setClauses.push(`tipo_mensagem = $${paramIdx++}`)
      params.push(tipo_mensagem)
    }
    if (mensagem !== undefined) {
      setClauses.push(`mensagem = $${paramIdx++}`)
      params.push(mensagem || null)
    }
    if (link !== undefined) {
      setClauses.push(`link = $${paramIdx++}`)
      params.push(link || null)
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    params.push(id)
    const updatedMessage = await queryOne(
      `UPDATE "folowUp24hs_mensagem" SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      params
    )

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    })
  } catch (error: any) {
    console.error("Erro na API followup/messages PUT:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID da mensagem é obrigatório" }, { status: 400 })
    }

    // Verificar se a mensagem existe e se o usuário tem permissão
    if (user.role !== "admin") {
      const msg = await queryOne(
        `SELECT m.*, wc.user_id AS wc_user_id
         FROM "folowUp24hs_mensagem" m
         LEFT JOIN whatsapp_connections wc ON m.whatsapp_conenections_id = wc.id
         WHERE m.id = $1`,
        [id]
      )

      if (!msg) {
        return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
      }

      if (msg.wc_user_id !== user.id) {
        return NextResponse.json({ error: "Sem permissão para deletar esta mensagem" }, { status: 403 })
      }
    }

    // Deletar mensagem
    await query(`DELETE FROM "folowUp24hs_mensagem" WHERE id = $1`, [id])

    return NextResponse.json({
      success: true,
      message: "Mensagem deletada com sucesso",
    })
  } catch (error: any) {
    console.error("Erro na API followup/messages DELETE:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
} 