import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const isAdmin = searchParams.get("isAdmin") === "true"

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuração do banco não encontrada",
        },
        { status: 500 },
      )
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    let url = `${supabaseUrl}/rest/v1/whatsapp_connections?select=*,user_profiles(id,email,full_name)&order=connection_name.asc`

    // Se não for admin e tiver userId, filtrar por usuário
    if (!isAdmin && userId) {
      url += `&user_id=eq.${userId}`
    }

    const response = await fetch(url, {
      headers,
      cache: "no-store", // Evitar cache
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao buscar conexões: ${response.status}`,
        },
        { status: response.status },
      )
    }

    const connections = await response.json()

    // Filtrar dados sensíveis
    const safeConnections = connections.map((conn: any) => ({
      id: conn.id,
      connection_name: conn.connection_name,
      instance_name: conn.instance_name,
      status: conn.status || "disconnected",
      user_id: conn.user_id,
      phone_number: conn.phone_number,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      user_profiles: conn.user_profiles,
      settings: conn.settings,
    }))

    return NextResponse.json({
      success: true,
      connections: safeConnections,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
