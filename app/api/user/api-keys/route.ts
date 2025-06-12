import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("=== API KEYS ROUTE (GET) INICIADA ===")
  console.log("Timestamp:", new Date().toISOString())

  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("user_id")

    console.log("Parâmetros recebidos:", { userId })

    if (!userId) {
      console.log("user_id não fornecido")
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    // Por enquanto, vamos retornar dados mock para testar
    console.log("Retornando dados mock para teste...")

    const mockApiKeys = [
      {
        id: "mock-1",
        api_key: "impa_mock_key_123456789",
        name: "API Key de Teste",
        description: "Chave de teste para verificar funcionamento",
        created_at: new Date().toISOString(),
        last_used_at: null,
        is_active: true,
        is_admin_key: false,
        access_scope: "user",
      },
    ]

    console.log("Dados mock preparados:", mockApiKeys)
    console.log("=== API KEYS ROUTE (GET) FINALIZADA COM SUCESSO ===")

    return NextResponse.json({
      success: true,
      apiKeys: mockApiKeys,
    })
  } catch (error: any) {
    console.error("=== ERRO NA API KEYS ROUTE ===")
    console.error("Erro:", error)
    console.error("Stack:", error.stack)

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("=== API KEYS ROUTE (POST) INICIADA ===")

  try {
    const body = await request.json()
    console.log("Body recebido:", body)

    // Retornar sucesso mock por enquanto
    return NextResponse.json({
      success: true,
      message: "API Key criada com sucesso (mock)",
      apiKey: {
        id: "mock-new",
        api_key: "impa_mock_new_123456789",
        name: body.name || "Nova API Key",
        description: body.description || "Nova chave criada",
        created_at: new Date().toISOString(),
        is_active: true,
        is_admin_key: body.is_admin_key || false,
        access_scope: body.is_admin_key ? "admin" : "user",
      },
    })
  } catch (error: any) {
    console.error("=== ERRO NA API KEYS ROUTE (POST) ===")
    console.error("Erro:", error)

    return NextResponse.json({ error: "Erro interno do servidor", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log("=== API KEYS ROUTE (DELETE) INICIADA ===")

  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const userId = searchParams.get("user_id")

    console.log("Parâmetros DELETE:", { id, userId })

    if (!id || !userId) {
      return NextResponse.json({ error: "id e user_id são obrigatórios" }, { status: 400 })
    }

    // Retornar sucesso mock
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("=== ERRO NA API KEYS ROUTE (DELETE) ===")
    console.error("Erro:", error)

    return NextResponse.json({ error: "Erro interno do servidor", details: error.message }, { status: 500 })
  }
}
