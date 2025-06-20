import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  console.log("📡 API: /api/user/agents chamada")

  try {
    const currentUser = getCurrentUser()
    console.log("🔍 Usuário atual:", currentUser ? currentUser.email : "Não encontrado")

    if (!currentUser) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (currentUser.role === "admin") {
      console.log("⚠️ Admin tentando usar API de usuário")
      return NextResponse.json({ error: "Use /api/admin/agents para admin" }, { status: 403 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente não configuradas:", {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      })
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
    // Buscar apenas agentes do usuário atual
    const agentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!inner(id,connection_name,phone_number,instance_name)&user_id=eq.${currentUser.id}&order=created_at.desc`,
      { headers },
    )

    if (!agentsResponse.ok) {
      const errorText = await agentsResponse.text()
      console.error("❌ Erro ao buscar agentes:", agentsResponse.status, errorText)
      throw new Error(`Erro ao buscar agentes: ${agentsResponse.status}`)
    }

    const agents = await agentsResponse.json()
    console.log("✅ Agentes encontrados:", agents.length)

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
    } else {
      console.warn("⚠️ Não foi possível buscar limites do usuário, usando padrão")
    }

    console.log("✅ Dados processados com sucesso")
    return NextResponse.json({
      success: true,
      agents: agents || [],
      limits: userLimits,
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
    const currentUser = getCurrentUser()
    console.log("🔍 Usuário atual:", currentUser ? currentUser.email : "Não encontrado")

    if (!currentUser) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (currentUser.role === "admin") {
      console.log("⚠️ Admin tentando usar API de usuário")
      return NextResponse.json({ error: "Use /api/admin/agents para admin" }, { status: 403 })
    }

    const agentData = await request.json()
    console.log("📝 Dados do agente recebidos:", { name: agentData.name, user_id: currentUser.id })

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente não configuradas:", {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      })
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // VALIDAR LIMITES PRIMEIRO
    console.log("🔍 Verificando limites do usuário...")

    // Contar agentes atuais do usuário
    const countResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?select=id&user_id=eq.${currentUser.id}`, {
      headers,
    })

    if (!countResponse.ok) {
      throw new Error("Erro ao verificar agentes existentes")
    }

    const existingAgents = await countResponse.json()
    const currentCount = existingAgents.length

    // Buscar limite do usuário
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=agents_limit,role&id=eq.${currentUser.id}`,
      { headers },
    )

    let maxAgents = 5 // Padrão
    if (userResponse.ok) {
      const userData = await userResponse.json()
      if (userData && userData.length > 0) {
        const user = userData[0]
        maxAgents = user.role === "admin" ? 999 : user.agents_limit || 5
      }
    }

    // VALIDAR LIMITE
    if (currentCount >= maxAgents) {
      console.log(`❌ Limite atingido: ${currentCount}/${maxAgents}`)
      return NextResponse.json(
        {
          error: "Limite de agentes atingido",
          details: `Você atingiu o limite máximo de ${maxAgents} agentes.`,
          currentCount,
          maxAgents,
        },
        { status: 400 },
      )
    }

    console.log(`✅ Limite OK: ${currentCount}/${maxAgents}`)

    // Buscar conexão WhatsApp (deve pertencer ao usuário)
    console.log("🔍 Verificando conexão WhatsApp...")
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&id=eq.${agentData.whatsapp_connection_id}&user_id=eq.${currentUser.id}`,
      { headers },
    )

    if (!connectionResponse.ok) {
      throw new Error("Erro ao buscar conexão WhatsApp")
    }

    const connections = await connectionResponse.json()
    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: "Conexão WhatsApp não encontrada ou não pertence ao usuário" }, { status: 400 })
    }

    const connection = connections[0]
    console.log("✅ Conexão encontrada:", connection.connection_name)

    // Forçar user_id para segurança
    const secureAgentData = {
      ...agentData,
      user_id: currentUser.id, // FORÇAR o ID do usuário atual
    }

    // Criar agente usando a mesma lógica do admin
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
