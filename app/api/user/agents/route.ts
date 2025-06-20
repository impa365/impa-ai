import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  console.log("📡 API: /api/user/agents chamada")

  try {
    // Buscar usuário atual do cookie (igual ao admin)
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      console.log("❌ Cookie de usuário não encontrado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
      console.log("✅ Usuário encontrado:", currentUser.email)
    } catch (error) {
      console.log("❌ Erro ao parsear cookie do usuário")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

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

    console.log("🔍 Buscando agentes do usuário:", currentUser.id)
    // FILTRAR NO BACKEND - apenas agentes do usuário atual
    const agentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(id,connection_name,phone_number,instance_name,status)&user_id=eq.${currentUser.id}&order=created_at.desc`,
      { headers },
    )

    if (!agentsResponse.ok) {
      const errorText = await agentsResponse.text()
      console.error("❌ Erro ao buscar agentes:", agentsResponse.status, errorText)
      throw new Error(`Erro ao buscar agentes: ${agentsResponse.status}`)
    }

    const agents = await agentsResponse.json()
    console.log("✅ Agentes do usuário encontrados:", agents.length)

    console.log("🔍 Buscando conexões WhatsApp do usuário...")
    // FILTRAR NO BACKEND - apenas conexões do usuário atual
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&user_id=eq.${currentUser.id}&order=connection_name.asc`,
      { headers },
    )

    if (!connectionsResponse.ok) {
      const errorText = await connectionsResponse.text()
      console.error("❌ Erro ao buscar conexões:", connectionsResponse.status, errorText)
      throw new Error(`Erro ao buscar conexões: ${connectionsResponse.status}`)
    }

    const connections = await connectionsResponse.json()
    console.log("✅ Conexões do usuário encontradas:", connections.length)

    // Buscar limites do usuário
    console.log("🔍 Buscando limites do usuário...")
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=agents_limit,connections_limit,role&id=eq.${currentUser.id}`,
      { headers },
    )

    let userLimits = { max_agents: 5, max_whatsapp_connections: 3 }
    if (userResponse.ok) {
      const userData = await userResponse.json()
      if (userData && userData.length > 0) {
        const user = userData[0]
        userLimits = {
          max_agents: user.role === "admin" ? 999 : user.agents_limit || 5,
          max_whatsapp_connections: user.role === "admin" ? 999 : user.connections_limit || 3,
        }
      }
    }

    console.log("✅ Dados processados com sucesso - APENAS DO USUÁRIO")
    return NextResponse.json({
      success: true,
      agents: agents || [],
      connections: connections || [],
      limits: userLimits,
      // NÃO enviamos dados de outros usuários
    })
  } catch (error: any) {
    console.error("❌ Erro na API user/agents:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  console.log("📡 API: POST /api/user/agents chamada")

  try {
    // Buscar usuário atual do cookie
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const agentData = await request.json()
    console.log("📝 Dados do agente recebidos:", { name: agentData.name, user_id: currentUser.id })

    // FORÇAR user_id para segurança - não confiar no frontend
    const secureAgentData = {
      ...agentData,
      user_id: currentUser.id, // SEMPRE usar o ID do usuário logado
    }

    // Usar a API do admin para criar (reutilizar lógica)
    const createResponse = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(secureAgentData),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      throw new Error(errorData.details || "Erro ao criar agente")
    }

    const result = await createResponse.json()
    console.log("✅ Agente criado com sucesso:", result.agent?.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erro ao criar agente:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao criar agente",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
