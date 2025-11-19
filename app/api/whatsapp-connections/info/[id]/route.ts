import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, hasPermission } from "@/lib/auth-utils"

/**
 * GET /api/whatsapp-connections/info/[id]
 * Retorna informações básicas de uma conexão WhatsApp (incluindo api_type)
 * Validação de segurança: apenas o dono da conexão ou admin pode acessar
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectionId } = await params
    console.log("📡 API: GET /api/whatsapp-connections/info/[id] chamada para:", connectionId)

    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", currentUser.email, "| Role:", currentUser.role)

    // Configurações do Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente do Supabase não configuradas")
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar conexão do banco
    console.log("🔍 Buscando conexão WhatsApp...")
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,connection_name,api_type,user_id&id=eq.${connectionId}`,
      { headers }
    )

    if (!connectionResponse.ok) {
      const errorText = await connectionResponse.text()
      console.error("❌ Erro ao buscar conexão:", connectionResponse.status, errorText)
      throw new Error(`Erro ao buscar conexão: ${connectionResponse.status}`)
    }

    const connections = await connectionResponse.json()
    
    if (!connections || connections.length === 0) {
      console.error("❌ Conexão não encontrada")
      return NextResponse.json(
        { 
          success: false,
          error: "Conexão não encontrada" 
        }, 
        { status: 404 }
      )
    }

    const connection = connections[0]
    console.log("✅ Conexão encontrada:", connection.connection_name, "| API Type:", connection.api_type)

    // 🔒 SEGURANÇA: Validar propriedade da conexão
    if (!hasPermission(currentUser.id, connection.user_id, currentUser.role)) {
      console.error("❌ Acesso negado: usuário não é dono nem admin")
      return NextResponse.json(
        { 
          success: false,
          error: "Você não tem permissão para acessar esta conexão" 
        }, 
        { status: 403 }
      )
    }

    console.log("✅ Acesso autorizado:", currentUser.role === "admin" ? "admin" : "owner")

    // Retornar apenas informações básicas (não retornar tokens/senhas)
    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        connection_name: connection.connection_name,
        api_type: connection.api_type || "evolution", // Default para evolution se não tiver
        user_id: connection.user_id,
      },
    })
  } catch (error: any) {
    console.error("❌ Erro na API /api/whatsapp-connections/info/[id]:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

