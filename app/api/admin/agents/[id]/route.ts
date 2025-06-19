import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const body = await request.json()

    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Fazer requisição direta para a API REST do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        Authorization: `Bearer ${supabaseKey}`,
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

    // Verificar variáveis de ambiente em runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Fazer requisição direta para a API REST do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        Authorization: `Bearer ${supabaseKey}`,
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
