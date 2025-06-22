import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Buscar configuração da Evolution API - USAR VARIÁVEIS SEGURAS
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Variáveis de ambiente não encontradas:", {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      })
      return NextResponse.json(
        { success: false, error: "Configuração do banco de dados não encontrada" },
        { status: 500 },
      )
    }

    // Buscar configuração da Evolution API
    const integrationResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    )

    if (!integrationResponse.ok) {
      console.error("Erro ao buscar configuração da API:", {
        status: integrationResponse.status,
        statusText: integrationResponse.statusText,
      })
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

    // Deletar instância na Evolution API
    const deleteResponse = await fetch(`${config.apiUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: config.apiKey,
      },
      signal: AbortSignal.timeout(15000), // 15 segundos timeout
    })

    if (!deleteResponse.ok) {
      let errorMessage = `Erro ${deleteResponse.status}`
      try {
        const errorData = await deleteResponse.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = `${errorMessage} - ${deleteResponse.statusText}`
      }

      return NextResponse.json(
        { success: false, error: `Erro ao deletar instância na Evolution API: ${errorMessage}` },
        { status: 500 },
      )
    }

    // Deletar conexão do banco de dados
    const deleteDbResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    )

    if (!deleteDbResponse.ok) {
      console.error("Erro ao deletar conexão do banco, mas instância foi deletada da Evolution API")
      return NextResponse.json(
        { success: false, error: "Instância deletada da Evolution API, mas erro ao remover do banco de dados" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Instância deletada com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao deletar instância:", error)

    if (error.name === "TimeoutError") {
      return NextResponse.json({ success: false, error: "Timeout ao deletar instância" }, { status: 408 })
    }

    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
