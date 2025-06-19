import { type NextRequest, NextResponse } from "next/server"
import { supabaseConfig } from "@/lib/supabase-config"

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
  throw new Error("Configurações do Supabase não encontradas. Verifique as variáveis de ambiente.")
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const body = await request.json()

    // Fazer requisição direta para a API REST do Supabase
    const response = await fetch(`${supabaseConfig.url}/rest/v1/ai_agents?id=eq.${agentId}`, {
      method: "PATCH",
      headers: {
        ...supabaseConfig.headers,
        Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: `Erro ao atualizar agente: ${errorData.message || response.statusText}` },
        { status: response.status },
      )
    }

    const updatedAgent = await response.json()
    return NextResponse.json(updatedAgent[0] || updatedAgent)
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id

    // Fazer requisição direta para a API REST do Supabase
    const response = await fetch(`${supabaseConfig.url}/rest/v1/ai_agents?id=eq.${agentId}`, {
      method: "DELETE",
      headers: {
        ...supabaseConfig.headers,
        Authorization: `Bearer ${supabaseConfig.serviceRoleKey}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: `Erro ao deletar agente: ${errorData.message || response.statusText}` },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
