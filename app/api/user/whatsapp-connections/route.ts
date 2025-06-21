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

    // Buscar todas as conexões WhatsApp (o frontend filtra depois)
    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?select=*&order=created_at.desc`, {
      headers,
    })

    if (!response.ok) {
      throw new Error("Erro ao buscar conexões WhatsApp")
    }

    const connections = await response.json()

    return NextResponse.json({
      success: true,
      connections: connections || [],
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
