import { NextRequest, NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get("connection_id")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Construir query para buscar leads com informações da conexão
    let query = `${supabaseUrl}/rest/v1/lead_folow24hs?select=*,whatsapp_connections!whatsappConection(connection_name,user_id,phone_number)&order=updated_at.desc`

    // Filtrar por conexão se especificado
    if (connectionId) {
      query += `&whatsappConection=eq.${connectionId}`
    }

    // Se não for admin, filtrar por usuário através das conexões
    if (user.role !== "admin") {
      // Buscar conexões do usuário primeiro
      const connectionsResponse = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?select=id&user_id=eq.${user.id}`,
        { headers }
      )
      
      if (!connectionsResponse.ok) {
        throw new Error("Erro ao buscar conexões do usuário")
      }
      
      const userConnections = await connectionsResponse.json()
      const connectionIds = userConnections.map((conn: any) => conn.id)
      
      if (connectionIds.length === 0) {
        return NextResponse.json({ success: true, leads: [] })
      }
      
      query += `&whatsappConection=in.(${connectionIds.join(",")})`
    }

    const response = await fetch(query, { headers })

    if (!response.ok) {
      throw new Error("Erro ao buscar leads")
    }

    const leads = await response.json()

    // Mapear dados para o formato esperado pelo frontend
    const mappedLeads = leads.map((lead: any) => ({
      id: lead.id.toString(),
      whatsappConection: lead.whatsappConection,
      remoteJid: lead.remoteJid,
      dia: lead.dia,
      updated_at: lead.updated_at,
      connection_name: lead.whatsapp_connections?.connection_name || "Conexão",
      user_id: lead.whatsapp_connections?.user_id,
      phone_number: lead.whatsapp_connections?.phone_number,
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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Verificar se o lead existe e se o usuário tem permissão
    if (user.role !== "admin") {
      const leadResponse = await fetch(
        `${supabaseUrl}/rest/v1/lead_folow24hs?select=*,whatsapp_connections!whatsappConection(user_id)&id=eq.${id}`,
        { headers }
      )

      if (!leadResponse.ok) {
        throw new Error("Erro ao verificar lead")
      }

      const leads = await leadResponse.json()
      if (!leads || leads.length === 0) {
        return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
      }

      const lead = leads[0]
      if (lead.whatsapp_connections?.user_id !== user.id) {
        return NextResponse.json({ error: "Sem permissão para modificar este lead" }, { status: 403 })
      }
    }

    // Atualizar o dia do lead
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/lead_folow24hs?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        dia: Number(dia),
        updated_at: new Date().toISOString(),
      }),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      throw new Error(`Erro ao atualizar lead: ${errorText}`)
    }

    const updatedLead = await updateResponse.json()

    return NextResponse.json({
      success: true,
      lead: updatedLead[0],
    })
  } catch (error: any) {
    console.error("Erro na API followup/leads PUT:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
} 