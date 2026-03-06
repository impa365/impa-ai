import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { queryMany, queryOne, query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connection_id")

    // Build WHERE conditions
    const conditions: string[] = []
    const params: any[] = []
    let paramIdx = 1

    if (connectionId) {
      conditions.push(`l."whatsappConection" = $${paramIdx++}`)
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
        return NextResponse.json({ success: true, leads: [] })
      }

      conditions.push(`l."whatsappConection" = ANY($${paramIdx++})`)
      params.push(connectionIds)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const leads = await queryMany(
      `SELECT l.*, wc.connection_name, wc.user_id AS wc_user_id, wc.phone_number
       FROM lead_folow24hs l
       LEFT JOIN whatsapp_connections wc ON l."whatsappConection" = wc.id
       ${whereClause}
       ORDER BY l.updated_at DESC`,
      params
    )

    // Mapear dados para o formato esperado pelo frontend
    const mappedLeads = leads.map((lead: any) => ({
      id: lead.id.toString(),
      whatsappConection: lead.whatsappConection,
      remoteJid: lead.remoteJid,
      dia: lead.dia,
      updated_at: lead.updated_at,
      connection_name: lead.connection_name || "Conexão",
      user_id: lead.wc_user_id,
      phone_number: lead.phone_number,
      // Extrair nome do contato do remoteJid (número do WhatsApp)
      nome_contato: lead.remoteJid ? lead.remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "") : "Contato",
      status: "ativo", // Por padrão todos são ativos, pode ser expandido futuramente
    }))

    return NextResponse.json({
      success: true,
      leads: mappedLeads,
    })
  } catch (error: any) {
    console.error("Erro na API followup/leads GET:", error)
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
    const { id, dia } = body

    if (!id || !dia) {
      return NextResponse.json(
        { error: "ID e dia são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se o lead existe e se o usuário tem permissão
    if (user.role !== "admin") {
      const lead = await queryOne(
        `SELECT l.*, wc.user_id AS wc_user_id
         FROM lead_folow24hs l
         LEFT JOIN whatsapp_connections wc ON l."whatsappConection" = wc.id
         WHERE l.id = $1`,
        [id]
      )

      if (!lead) {
        return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
      }

      if (lead.wc_user_id !== user.id) {
        return NextResponse.json({ error: "Sem permissão para modificar este lead" }, { status: 403 })
      }
    }

    // Atualizar o dia do lead
    const updatedLead = await queryOne(
      `UPDATE lead_folow24hs SET dia = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
      [Number(dia), new Date().toISOString(), id]
    )

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    })
  } catch (error: any) {
    console.error("Erro na API followup/leads PUT:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
} 