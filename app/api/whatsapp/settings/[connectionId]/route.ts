import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { connectionId: string } }) {
  try {
    const { connectionId } = params

    if (!connectionId) {
      return NextResponse.json({ success: false, error: "ID da conexão é obrigatório" }, { status: 400 })
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    // Buscar configurações da conexão
    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connectionId}&select=settings`, {
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar configurações" }, { status: 500 })
    }

    const connections = await response.json()

    if (!connections || connections.length === 0) {
      return NextResponse.json({ success: false, error: "Conexão não encontrada" }, { status: 404 })
    }

    const connection = connections[0]
    const settings = connection.settings || {
      groupsIgnore: false,
      readMessages: true,
      alwaysOnline: false,
      readStatus: true,
      rejectCall: false,
      msgCall: "Não posso atender no momento, envie uma mensagem.",
      syncFullHistory: false,
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { connectionId: string } }) {
  try {
    const { connectionId } = params
    const settings = await request.json()

    if (!connectionId) {
      return NextResponse.json({ success: false, error: "ID da conexão é obrigatório" }, { status: 400 })
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    // Atualizar configurações no banco
    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connectionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        settings: settings,
        updated_at: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Erro ao salvar configurações" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Configurações salvas com sucesso",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
