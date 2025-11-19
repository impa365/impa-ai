import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let user
    try {
      user = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      return NextResponse.json({ success: false, error: "Usuário não autenticado" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", user.email, "ID:", user.id)
    console.log("🔍 Buscando conexões WhatsApp para usuário:", user.email, "ID:", user.id)

    // Configuração do Supabase (apenas no servidor)
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar conexões do usuário (incluindo api_type)
    const connectionsUrl = `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,connection_name,instance_name,phone_number,status,api_type,created_at,updated_at,last_seen_at,messages_sent,messages_received&user_id=eq.${user.id}&order=created_at.desc`
    console.log("📡 URL da requisição:", connectionsUrl)
    
    const connectionsResponse = await fetch(connectionsUrl, { headers })

    if (!connectionsResponse.ok) {
      const errorText = await connectionsResponse.text()
      console.error("❌ Erro ao buscar conexões:", connectionsResponse.status, connectionsResponse.statusText)
      console.error("❌ Detalhes do erro:", errorText)
      return NextResponse.json({ success: false, error: `Erro ao buscar conexões: ${connectionsResponse.statusText}` }, { status: 500 })
    }

    const connections = await connectionsResponse.json()

    // Buscar limites do usuário
    const userProfileResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=connections_limit,role&id=eq.${user.id}`,
      { headers },
    )

    let userLimit = 0 // padrão
    if (userProfileResponse.ok) {
      const userProfileData = await userProfileResponse.json()
      if (userProfileData && userProfileData.length > 0) {
        const profile = userProfileData[0]

        // Se for admin, limite ilimitado
        if (profile.role === "admin") {
          userLimit = 999
        }
        // Usar connections_limit se definido
        else if (profile.connections_limit !== undefined && profile.connections_limit !== null) {
          userLimit =
            typeof profile.connections_limit === "string"
              ? Number.parseInt(profile.connections_limit)
              : profile.connections_limit
        }
      }
    }

    console.log(`✅ Encontradas ${connections.length} conexões. Limite: ${userLimit}`)

    // Retornar dados (SEM informações confidenciais)
    return NextResponse.json({
      success: true,
      data: {
        connections: connections.map((conn: any) => ({
          id: conn.id,
          connection_name: conn.connection_name,
          instance_name: conn.instance_name,
          phone_number: conn.phone_number,
          status: conn.status,
          api_type: conn.api_type || "evolution", // CRÍTICO: Incluir api_type
          created_at: conn.created_at,
          updated_at: conn.updated_at,
          last_seen_at: conn.last_seen_at,
          messages_sent: conn.messages_sent || 0,
          messages_received: conn.messages_received || 0,
          // NÃO incluir: instance_token, instance_id, webhook_url, settings
        })),
        limits: {
          current: connections.length,
          maximum: userLimit,
          canCreate: connections.length < userLimit,
        },
      },
    })
  } catch (error: any) {
    console.error("💥 Erro interno ao buscar conexões:", error)
    return NextResponse.json({ success: false, error: `Erro interno: ${error.message}` }, { status: 500 })
  }
}
