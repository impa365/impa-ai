import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: NextRequest, { params }: { params: { instanceName: string } }) {
  try {
    const { instanceName } = params

    if (!instanceName) {
      return NextResponse.json({ success: false, error: "Nome da instância é obrigatório" }, { status: 400 })
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Variáveis de ambiente do Supabase não configuradas:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      })
      return NextResponse.json(
        { success: false, error: "Configuração do banco de dados não encontrada" },
        { status: 500 },
      )
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Buscar configuração da Evolution API
    const { data: integrations, error: integrationError } = await supabase
      .from("integrations")
      .select("config")
      .eq("type", "evolution_api")
      .eq("is_active", true)
      .single()

    if (integrationError || !integrations) {
      console.error("Erro ao buscar configuração da Evolution API:", integrationError)
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API não encontrada" },
        { status: 500 },
      )
    }

    const config = integrations.config

    if (!config?.apiUrl || !config?.apiKey) {
      return NextResponse.json({ success: false, error: "Configuração da Evolution API incompleta" }, { status: 500 })
    }

    // Validar URL da API
    let apiUrl: string
    try {
      const url = new URL(config.apiUrl)
      apiUrl = url.toString().replace(/\/$/, "")
    } catch (urlError) {
      return NextResponse.json({ success: false, error: "URL da Evolution API inválida" }, { status: 500 })
    }

    // Buscar a conexão no banco antes de deletar
    const { data: connection, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("id, instance_name, connection_name")
      .eq("instance_name", instanceName)
      .single()

    if (connectionError || !connection) {
      console.error("Conexão não encontrada no banco:", connectionError)
      return NextResponse.json({ success: false, error: "Conexão não encontrada" }, { status: 404 })
    }

    // Deletar instância na Evolution API primeiro
    try {
      const deleteResponse = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
        method: "DELETE",
        headers: {
          apikey: config.apiKey,
        },
        signal: AbortSignal.timeout(15000), // 15 segundos timeout
      })

      // Log da resposta da Evolution API
      console.log(`Evolution API delete response: ${deleteResponse.status}`)

      if (!deleteResponse.ok) {
        let errorMessage = `Erro ${deleteResponse.status}`
        try {
          const errorData = await deleteResponse.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `${errorMessage} - ${deleteResponse.statusText}`
        }

        console.error("Erro ao deletar da Evolution API:", errorMessage)
        // Continuar mesmo se a Evolution API falhar (pode já ter sido deletada)
      }
    } catch (evolutionError: any) {
      console.error("Erro na requisição para Evolution API:", evolutionError.message)
      // Continuar mesmo se a Evolution API falhar
    }

    // Deletar conexão do banco de dados
    const { error: deleteDbError } = await supabase
      .from("whatsapp_connections")
      .delete()
      .eq("instance_name", instanceName)

    if (deleteDbError) {
      console.error("Erro ao deletar conexão do banco:", deleteDbError)
      return NextResponse.json({ success: false, error: "Erro ao remover conexão do banco de dados" }, { status: 500 })
    }

    console.log(`Conexão ${instanceName} deletada com sucesso`)

    return NextResponse.json({
      success: true,
      message: "Conexão deletada com sucesso",
    })
  } catch (error: any) {
    console.error("Erro interno ao deletar instância:", error)

    if (error.name === "TimeoutError") {
      return NextResponse.json({ success: false, error: "Timeout ao deletar instância" }, { status: 408 })
    }

    return NextResponse.json(
      { success: false, error: `Erro interno: ${error.message || "Erro desconhecido"}` },
      { status: 500 },
    )
  }
}
