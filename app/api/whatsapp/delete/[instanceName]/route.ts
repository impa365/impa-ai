import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params

    console.log(`[DELETE] Iniciando deleção da instância: ${instanceName}`)

    if (!instanceName) {
      console.error("[DELETE] Nome da instância não fornecido")
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    console.log("[DELETE] Verificando variáveis de ambiente:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : "undefined",
    })

    if (!supabaseUrl) {
      console.error("[DELETE] SUPABASE_URL não definida")
      return NextResponse.json(
        { success: false, error: "Configuração do banco de dados não encontrada (URL)" },
        { status: 500 },
      )
    }

    const supabaseKey = supabaseServiceKey || supabaseAnonKey
    if (!supabaseKey) {
      console.error("[DELETE] Nenhuma chave do Supabase encontrada")
      return NextResponse.json(
        { success: false, error: "Configuração do banco de dados não encontrada (KEY)" },
        { status: 500 },
      )
    }

    // Buscar configuração da Evolution API
    console.log("[DELETE] Buscando configuração da Evolution API...")
    const integrationUrl = `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`

    const integrationResponse = await fetch(integrationUrl, {
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    console.log("[DELETE] Resposta da busca de integração:", {
      status: integrationResponse.status,
      statusText: integrationResponse.statusText,
      ok: integrationResponse.ok,
    })

    if (!integrationResponse.ok) {
      const errorText = await integrationResponse.text()
      console.error("[DELETE] Erro ao buscar configuração da API:", errorText)
      return NextResponse.json(
        { success: false, error: `Erro ao buscar configuração da API: ${integrationResponse.status}` },
        { status: 500 },
      )
    }

    const integrations = await integrationResponse.json()
    console.log("[DELETE] Integrações encontradas:", integrations?.length || 0)

    if (!integrations || integrations.length === 0) {
      console.error("[DELETE] Nenhuma integração Evolution API encontrada")
      return NextResponse.json({ success: false, error: "Evolution API não configurada" }, { status: 500 })
    }

    const config = integrations[0].config
    console.log("[DELETE] Configuração da Evolution API:", {
      hasApiUrl: !!config?.apiUrl,
      hasApiKey: !!config?.apiKey,
      apiUrlPrefix: config?.apiUrl ? config.apiUrl.substring(0, 20) + "..." : "undefined",
    })

    if (!config?.apiUrl || !config?.apiKey) {
      console.error("[DELETE] Configuração da Evolution API incompleta")
      return NextResponse.json({ success: false, error: "Configuração da Evolution API incompleta" }, { status: 500 })
    }

    // Deletar instância na Evolution API
    console.log(`[DELETE] Deletando instância na Evolution API: ${config.apiUrl}/instance/delete/${instanceName}`)

    const deleteResponse = await fetch(`${config.apiUrl}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: {
        apikey: config.apiKey,
      },
      signal: AbortSignal.timeout(15000),
    })

    console.log("[DELETE] Resposta da Evolution API:", {
      status: deleteResponse.status,
      statusText: deleteResponse.statusText,
      ok: deleteResponse.ok,
    })

    if (!deleteResponse.ok) {
      let errorMessage = `Erro ${deleteResponse.status}`
      try {
        const errorData = await deleteResponse.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        console.error("[DELETE] Erro detalhado da Evolution API:", errorData)
      } catch (parseError) {
        errorMessage = `${errorMessage} - ${deleteResponse.statusText}`
        console.error("[DELETE] Erro ao parsear resposta da Evolution API:", parseError)
      }

      return NextResponse.json(
        { success: false, error: `Erro ao deletar instância na Evolution API: ${errorMessage}` },
        { status: 500 },
      )
    }

    // Deletar conexão do banco de dados
    console.log(`[DELETE] Deletando conexão do banco: ${instanceName}`)
    const deleteDbUrl = `${supabaseUrl}/rest/v1/whatsapp_connections?instance_name=eq.${instanceName}`

    const deleteDbResponse = await fetch(deleteDbUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    console.log("[DELETE] Resposta da deleção do banco:", {
      status: deleteDbResponse.status,
      statusText: deleteDbResponse.statusText,
      ok: deleteDbResponse.ok,
    })

    if (!deleteDbResponse.ok) {
      const errorText = await deleteDbResponse.text()
      console.error("[DELETE] Erro ao deletar conexão do banco:", errorText)
      return NextResponse.json(
        { success: false, error: "Instância deletada da Evolution API, mas erro ao remover do banco de dados" },
        { status: 500 },
      )
    }

    console.log(`[DELETE] Instância ${instanceName} deletada com sucesso`)
    return NextResponse.json({
      success: true,
      message: "Instância deletada com sucesso",
    })
  } catch (error: any) {
    console.error("[DELETE] Erro geral ao deletar instância:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })

    if (error.name === "TimeoutError") {
      return NextResponse.json({ success: false, error: "Timeout ao deletar instância" }, { status: 408 })
    }

    return NextResponse.json({ success: false, error: `Erro interno do servidor: ${error.message}` }, { status: 500 })
  }
}
