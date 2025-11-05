import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 API: GET /api/user/whatsapp-connections chamada")

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar todas as conexões WhatsApp incluindo api_type
    const response = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,connection_name,instance_name,status,api_type,user_id,phone_number,created_at,updated_at,settings,adciona_folow,remover_folow&order=created_at.desc`,
      {
        headers,
      }
    )

    if (!response.ok) {
      throw new Error("Erro ao buscar conexões WhatsApp")
    }

    const connections = await response.json()

    // Garantir que api_type sempre existe (fallback para "evolution")
    const safeConnections = connections.map((conn: any) => ({
      ...conn,
      api_type: conn.api_type || "evolution",
    }))

    return NextResponse.json({
      success: true,
      connections: safeConnections,
    })
  } catch (error: any) {
    console.error("❌ Erro na API user/whatsapp-connections:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
