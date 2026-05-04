import { NextResponse, type NextRequest } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"

/**
 * GET /api/whatsapp-connections/[id]/uazapi-info
 *
 * Retorna as informações da instância Uazapi para o dono da conexão:
 *  - URL do servidor Uazapi (da tabela integrations)
 *  - Token/API Key da instância (instance_token)
 *  - Nome da instância (instance_name)
 *  - ID da instância (instance_id)
 *
 * PROTEÇÕES:
 *  1. JWT obrigatório
 *  2. Conexão deve ser do tipo uazapi
 *  3. Usuário DEVE ser o dono da conexão
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: connectionId } = await params

  try {
    // 🔒 Autenticação JWT obrigatória
    const currentUser = await getCurrentServerUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Buscar conexão com os campos necessários
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connectionId}&select=id,user_id,connection_name,instance_name,instance_id,instance_token,api_type`,
      { headers }
    )

    if (!connectionResponse.ok) {
      return NextResponse.json({ error: "Erro ao buscar conexão" }, { status: 500 })
    }

    const connections = await connectionResponse.json()
    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 })
    }

    const connection = connections[0]

    // 🔒 Verificar ownership — usuário deve ser o dono
    if (connection.user_id !== currentUser.id) {
      // Retorna 404 para não revelar a existência da conexão
      return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 })
    }

    // 🔒 Apenas Uazapi
    if (connection.api_type !== "uazapi") {
      return NextResponse.json(
        { error: "Esta rota é exclusiva para conexões Uazapi" },
        { status: 400 }
      )
    }

    // Buscar URL do servidor Uazapi na tabela integrations
    let serverUrl = ""
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.uazapi&is_active=eq.true&select=config&limit=1`,
      { headers }
    )

    if (integrationResponse.ok) {
      const integrations = await integrationResponse.json()
      if (integrations && integrations.length > 0) {
        const config = integrations[0].config
        serverUrl = config?.serverUrl || config?.apiUrl || ""
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        connection_id: connection.id,
        connection_name: connection.connection_name,
        instance_name: connection.instance_name,
        instance_id: connection.instance_id || "",
        instance_token: connection.instance_token || "",
        server_url: serverUrl,
      },
    })
  } catch (error: any) {
    console.error("❌ Erro em uazapi-info:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
