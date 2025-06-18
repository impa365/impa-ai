import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("📡 API: /api/whatsapp-connections chamada")

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const isAdmin = searchParams.get("isAdmin") === "true"

    console.log("📝 Parâmetros recebidos:", { userId, isAdmin })

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

    let url = `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&order=connection_name.asc`

    // Se não for admin e tiver userId, filtrar por usuário
    if (!isAdmin && userId) {
      url += `&user_id=eq.${userId}`
    }

    console.log("🔍 Buscando conexões WhatsApp:", url)
    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao buscar conexões:", response.status, errorText)
      throw new Error(`Erro ao buscar conexões: ${response.status}`)
    }

    const connections = await response.json()
    console.log("✅ Conexões encontradas:", connections.length)

    // Filtrar dados sensíveis
    const safeConnections = connections.map((conn: any) => ({
      id: conn.id,
      connection_name: conn.connection_name,
      instance_name: conn.instance_name,
      status: conn.status,
      user_id: conn.user_id,
      phone_number: conn.phone_number,
      created_at: conn.created_at,
    }))

    return NextResponse.json({
      success: true,
      connections: safeConnections,
    })
  } catch (error: any) {
    console.error("❌ Erro na API whatsapp-connections:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
