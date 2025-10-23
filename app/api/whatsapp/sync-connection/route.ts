import { type NextRequest, NextResponse } from "next/server"
import { getUazapiInstanceStatusServer } from "@/lib/uazapi-server"

/**
 * Sincronização manual/forçada de uma conexão específica
 * Usado quando o usuário clica em "Atualizar" no painel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instanceName } = body

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

    // Buscar a conexão do banco
    const connectionResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}&select=id,instance_name,instance_token,api_type,status&limit=1`,
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

    let realStatus = "disconnected"
    let phoneNumber = null
    let qrCode = null
    let pairCode = null

    console.log(`🔄 Sincronização manual: ${instanceName} (${apiType})`)

    // ==================== ROTEAR PARA A API CORRETA ====================

    if (apiType === "uazapi") {
      // ========== UAZAPI ==========
      const result = await getUazapiInstanceStatusServer(connection.instance_token)

      if (!result.success) {
        console.error("❌ Erro ao verificar status Uazapi:", result.error)
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      // O campo instance.status já vem com os valores corretos: "disconnected", "connecting", "connected"
      realStatus = result.data?.instance?.status || "disconnected"
      
      // Extrair número de telefone do owner ou jid
      phoneNumber = result.data?.instance?.owner || result.data?.status?.jid?.user || null
      qrCode = result.data?.instance?.qrcode || null
      pairCode = result.data?.instance?.paircode || null

      console.log(`✅ Uazapi ${instanceName}: ${realStatus}`, phoneNumber || "sem número", qrCode ? "QR ✓" : "", pairCode ? `Pair: ${pairCode}` : "")
      console.log(`📊 Dados completos:`, JSON.stringify({
        instanceStatus: result.data?.instance?.status,
        statusConnected: result.data?.status?.connected,
        statusLoggedIn: result.data?.status?.loggedIn,
        owner: result.data?.instance?.owner,
        jid: result.data?.status?.jid
      }))
    } else {
      // ========== EVOLUTION API ==========
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

      const statusResponse = await fetch(`${config.apiUrl}/instance/connectionState/${instanceName}`, {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()

        if (statusData?.instance?.state) {
          switch (statusData.instance.state) {
            case "open":
              realStatus = "connected"
              break
            case "connecting":
              realStatus = "connecting"
              break
            default:
              realStatus = "disconnected"
          }
        }

        phoneNumber = statusData?.instance?.wuid || null
      }

      console.log(`✅ Evolution ${instanceName}: ${realStatus}`)
    }

    // Atualizar status no banco
    const updateData: any = {
      status: realStatus,
      updated_at: new Date().toISOString(),
    }

    if (phoneNumber) {
      updateData.phone_number = phoneNumber
    }

    await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${connection.id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(updateData),
    })

    console.log(`📝 Conexão atualizada: ${instanceName} → ${realStatus}`)

    return NextResponse.json({
      success: true,
      status: realStatus,
      phoneNumber: phoneNumber,
      qrCode: qrCode,
      pairCode: pairCode,
      apiType: apiType,
      message: `Status atualizado: ${realStatus}`,
    })
  } catch (error: any) {
    console.error("❌ Erro na sincronização manual:", error)
    return NextResponse.json({ success: false, error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
