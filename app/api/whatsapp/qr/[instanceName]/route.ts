import { type NextRequest, NextResponse } from "next/server"
import { connectUazapiInstanceServer, getUazapiInstanceStatusServer } from "@/lib/uazapi-server"

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

    // ==================== ROTEAR PARA A API CORRETA ====================

    if (apiType === "uazapi") {
      // ========== UAZAPI ==========
      console.log("🔧 Gerando QR Code via Uazapi:", instanceName)

      // Conectar instância (gera QR code)
      const connectResult = await connectUazapiInstanceServer(connection.instance_token)

      if (!connectResult.success) {
        console.error("❌ Erro ao conectar Uazapi:", connectResult.error)
        return NextResponse.json({ success: false, error: connectResult.error }, { status: 500 })
      }

      // Buscar status atualizado para pegar o QR code
      const statusResult = await getUazapiInstanceStatusServer(connection.instance_token)

      if (!statusResult.success) {
        return NextResponse.json({ success: false, error: statusResult.error }, { status: 500 })
      }

      const qrCode = statusResult.data?.instance?.qrcode || null
      const pairCode = statusResult.data?.instance?.paircode || null

      console.log("✅ QR Code gerado via Uazapi", qrCode ? "✓" : "✗", "Pair Code:", pairCode ? "✓" : "✗")

      return NextResponse.json({
        success: true,
        qrCode: qrCode,
        pairCode: pairCode,
        status: statusResult.data?.instance?.status || "disconnected",
        apiType: "uazapi",
      })
    } else {
      // ========== EVOLUTION API ==========
      console.log("🔧 Gerando QR Code via Evolution:", instanceName)

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

    // Buscar QR Code da Evolution API
      const qrResponse = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
      })

    if (!qrResponse.ok) {
        return NextResponse.json({ success: false, error: "Erro ao gerar QR Code" }, { status: 500 })
    }

      const qrData = await qrResponse.json()

    return NextResponse.json({
      success: true,
      qrCode: qrData.base64 || qrData.qrcode || null,
      status: qrData.instance?.state || "disconnected",
        apiType: "evolution",
      })
    }
  } catch (error: any) {
    console.error("❌ Erro ao gerar QR Code:", error)
    return NextResponse.json({ success: false, error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ instanceName: string }> }) {
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

    // ==================== ROTEAR PARA A API CORRETA ====================

    if (apiType === "uazapi") {
      // ========== UAZAPI ==========
      console.log("🔧 Conectando instância Uazapi (POST):", instanceName)

      const result = await connectUazapiInstanceServer(connection.instance_token)

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Instância conectada com sucesso",
        data: result.data,
        apiType: "uazapi",
      })
    } else {
      // ========== EVOLUTION API ==========
      console.log("🔧 Conectando instância Evolution (POST):", instanceName)

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

      // Conectar na Evolution API
      const connectResponse = await fetch(`${config.apiUrl}/instance/connect/${instanceName}`, {
        method: "POST",
        headers: {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!connectResponse.ok) {
        return NextResponse.json({ success: false, error: "Erro ao conectar instância" }, { status: 500 })
      }

      const data = await connectResponse.json()

      return NextResponse.json({
        success: true,
        message: "Instância conectada com sucesso",
        data,
        apiType: "evolution",
      })
    }
  } catch (error: any) {
    console.error("❌ Erro ao conectar instância:", error)
    return NextResponse.json({ success: false, error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
