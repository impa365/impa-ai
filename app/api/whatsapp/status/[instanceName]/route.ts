import { type NextRequest, NextResponse } from "next/server"
import { getUazapiInstanceStatusServer } from "@/lib/uazapi-server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ instanceName: string }> }) {
  try {
    // Next.js 15: await params antes de usar
    const { instanceName } = await params

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração não encontrada" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar a conexão do banco para saber qual API usar
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}&select=api_type,instance_token&limit=1`,
      { headers }
    )

    if (!connectionResponse.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar conexão" }, { status: 500 })
    }

    const connections = await connectionResponse.json()

    if (!connections || connections.length === 0) {
      return NextResponse.json({ success: false, error: "Conexão não encontrada" }, { status: 404 })
    }

    const connection = connections[0]
    const apiType = connection.api_type || "evolution"

    let status = "disconnected"
    let phoneNumber = null

    // ==================== ROTEAR PARA A API CORRETA ====================

    if (apiType === "uazapi") {
      // ========== UAZAPI ==========
      console.log("🔧 Verificando status via Uazapi:", instanceName)

      const result = await getUazapiInstanceStatusServer(connection.instance_token)

      if (!result.success) {
        console.error("❌ Erro ao verificar status Uazapi:", result.error)
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      // O campo instance.status já vem com os valores corretos: "disconnected", "connecting", "connected"
      status = result.data?.instance?.status || "disconnected"
      
      // Extrair número de telefone do owner ou jid
      phoneNumber = result.data?.instance?.owner || result.data?.status?.jid?.user || null

      console.log("✅ Status Uazapi:", status, "Phone:", phoneNumber || "N/A")
      console.log(`📊 Dados completos:`, JSON.stringify({
        instanceStatus: result.data?.instance?.status,
        statusConnected: result.data?.status?.connected,
        statusLoggedIn: result.data?.status?.loggedIn,
        owner: result.data?.instance?.owner,
        jid: result.data?.status?.jid
      }))
    } else {
      // ========== EVOLUTION API ==========
      console.log("🔧 Verificando status via Evolution:", instanceName)

      // Buscar configuração da Evolution API
      const integrationResponse = await fetch(
        `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
        { headers }
      )

      if (!integrationResponse.ok) {
        return NextResponse.json({ success: false, error: "Erro ao buscar configuração da API" }, { status: 500 })
      }

      const integrations = await integrationResponse.json()

      if (!integrations || integrations.length === 0) {
        return NextResponse.json({ success: false, error: "Evolution API não configurada" }, { status: 500 })
      }

      const config = integrations[0].config

      if (!config?.apiUrl || !config?.apiKey) {
        return NextResponse.json({ success: false, error: "Configuração da Evolution API incompleta" }, { status: 500 })
      }

      // Verificar status na Evolution API
      const statusResponse = await fetch(`${config.apiUrl}/instance/connectionState/${instanceName}`, {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
      })

      if (!statusResponse.ok) {
        return NextResponse.json({ success: false, error: "Erro ao verificar status" }, { status: 500 })
      }

      const statusData = await statusResponse.json()

      if (statusData?.instance?.state) {
        switch (statusData.instance.state) {
          case "open":
            status = "connected"
            break
          case "connecting":
            status = "connecting"
            break
          default:
            status = "disconnected"
        }
      }

      phoneNumber = statusData?.instance?.wuid || null
    }

    // Atualizar status no banco
    await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`, {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: status,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString(),
      }),
    })

    return NextResponse.json({
      success: true,
      status: status,
      phoneNumber: phoneNumber,
      apiType: apiType,
    })
  } catch (error: any) {
    console.error("❌ Erro ao verificar status:", error)
    return NextResponse.json({ success: false, error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
