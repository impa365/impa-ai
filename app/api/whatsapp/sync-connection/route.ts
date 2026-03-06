import { type NextRequest, NextResponse } from "next/server"
import { getUazapiInstanceStatusServer } from "@/lib/uazapi-server"
import { query, queryOne, queryMany } from "@/lib/db"

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

    // Buscar a conexão do banco
    const connections = await queryMany(
      'SELECT id, instance_name, instance_token, api_type, status FROM whatsapp_connections WHERE instance_name = $1 LIMIT 1',
      [instanceName]
    )

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

    await query(
      'UPDATE whatsapp_connections SET status = $1, updated_at = $2' +
        (phoneNumber ? ', phone_number = $3 WHERE id = $4' : ' WHERE id = $3'),
      phoneNumber
        ? [updateData.status, updateData.updated_at, phoneNumber, connection.id]
        : [updateData.status, updateData.updated_at, connection.id]
    )

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
