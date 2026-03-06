import { type NextRequest, NextResponse } from "next/server"
import { getUazapiInstanceStatusServer } from "@/lib/uazapi-server"
import { query, queryOne, queryMany } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ instanceName: string }> }) {
  try {
    // Next.js 15: await params antes de usar
    const { instanceName } = await params

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Buscar a conexão do banco para saber qual API usar
    const connection = await queryOne(
      'SELECT api_type, instance_token FROM whatsapp_connections WHERE instance_name = $1 LIMIT 1',
      [instanceName]
    )

    if (!connection) {
      return NextResponse.json({ success: false, error: "Conexão não encontrada" }, { status: 404 })
    }
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
      const integrations = await queryMany(
        'SELECT config FROM integrations WHERE type = $1 AND is_active = true',
        ['evolution_api']
      )

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
    await query(
      'UPDATE whatsapp_connections SET status = $1, phone_number = $2, updated_at = $3 WHERE instance_name = $4',
      [status, phoneNumber, new Date().toISOString(), instanceName]
    )

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
