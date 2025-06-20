import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log("📡 API: GET /api/user/agents/[id] chamada")

  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (currentUser.role === "admin") {
      return NextResponse.json({ error: "Use /api/admin/agents para admin" }, { status: 403 })
    }

    const agentId = params.id
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

    // Buscar agente (apenas se pertencer ao usuário)
    const agentResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,whatsapp_connections!inner(id,connection_name,phone_number,instance_name)&id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      { headers },
    )

    if (!agentResponse.ok) {
      throw new Error("Erro ao buscar agente")
    }

    const agents = await agentResponse.json()
    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      agent: agents[0],
    })
  } catch (error: any) {
    console.error("❌ Erro na API user/agents/[id]:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  console.log("📡 API: PUT /api/user/agents/[id] chamada")

  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (currentUser.role === "admin") {
      return NextResponse.json({ error: "Use /api/admin/agents para admin" }, { status: 403 })
    }

    const agentId = params.id
    const agentData = await request.json()

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

    // Verificar se o agente pertence ao usuário
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=id&id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      { headers },
    )

    if (!checkResponse.ok) {
      throw new Error("Erro ao verificar agente")
    }

    const existingAgents = await checkResponse.json()
    if (!existingAgents || existingAgents.length === 0) {
      return NextResponse.json({ error: "Agente não encontrado ou não pertence ao usuário" }, { status: 404 })
    }

    // Usar a API do admin para atualizar (com segurança)
    const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/agents`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: agentId,
        ...agentData,
        user_id: currentUser.id, // FORÇAR o ID do usuário atual
      }),
    })

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json()
      throw new Error(errorData.details || "Erro ao atualizar agente")
    }

    const result = await updateResponse.json()
    console.log("✅ Agente atualizado com sucesso:", agentId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erro ao atualizar agente:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao atualizar agente",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  console.log("📡 API: DELETE /api/user/agents/[id] chamada")

  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (currentUser.role === "admin") {
      return NextResponse.json({ error: "Use /api/admin/agents para admin" }, { status: 403 })
    }

    const agentId = params.id
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

    // Verificar se o agente pertence ao usuário
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=id&id=eq.${agentId}&user_id=eq.${currentUser.id}`,
      { headers },
    )

    if (!checkResponse.ok) {
      throw new Error("Erro ao verificar agente")
    }

    const existingAgents = await checkResponse.json()
    if (!existingAgents || existingAgents.length === 0) {
      return NextResponse.json({ error: "Agente não encontrado ou não pertence ao usuário" }, { status: 404 })
    }

    // Usar a API do admin para deletar (com segurança)
    const deleteResponse = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/agents?id=${agentId}`,
      {
        method: "DELETE",
      },
    )

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json()
      throw new Error(errorData.details || "Erro ao deletar agente")
    }

    const result = await deleteResponse.json()
    console.log("✅ Agente deletado com sucesso:", agentId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Erro ao deletar agente:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao deletar agente",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
