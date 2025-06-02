import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Validar API key
async function validateApiKey(apiKey: string) {
  try {
    console.log("Validando API key:", apiKey?.substring(0, 10) + "...")

    const { data, error } = await supabase.from("user_api_keys").select("user_id").eq("api_key", apiKey).single()

    console.log("Resultado da validação:", { data, error })

    if (error) {
      console.error("Erro na validação da API key:", error)
      return null
    }

    if (!data) {
      console.log("API key não encontrada")
      return null
    }

    // Atualizar last_used_at
    await supabase.from("user_api_keys").update({ last_used_at: new Date().toISOString() }).eq("api_key", apiKey)

    console.log("API key válida para usuário:", data.user_id)
    return data.user_id
  } catch (error) {
    console.error("Erro ao validar API key:", error)
    return null
  }
}

// GET - Obter informações do bot
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== Iniciando requisição /api/getbot/[id] ===")

    const botId = params.id
    console.log("Bot ID:", botId)

    // Tentar múltiplas formas de obter a API key
    const apiKey =
      request.headers.get("apikey") ||
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    console.log("Headers recebidos:", Object.fromEntries(request.headers.entries()))
    console.log("API key extraída:", apiKey?.substring(0, 10) + "...")

    if (!apiKey) {
      console.log("API key não fornecida")
      return NextResponse.json(
        {
          success: false,
          error: "API key é obrigatória",
          message: "Inclua o header 'apikey' na sua requisição",
        },
        { status: 401 },
      )
    }

    // Validar API key
    const userId = await validateApiKey(apiKey)
    if (!userId) {
      console.log("API key inválida ou não encontrada")
      return NextResponse.json(
        {
          success: false,
          error: "API key inválida",
          message: "A API key fornecida não é válida ou não existe",
          debug: {
            apiKeyProvided: !!apiKey,
            apiKeyLength: apiKey?.length,
            apiKeyPrefix: apiKey?.substring(0, 10),
          },
        },
        { status: 401 },
      )
    }

    console.log("Buscando agente para usuário:", userId, "bot:", botId)

    // Buscar o agente
    const { data: agent, error } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections(
          connection_name,
          instance_name,
          status
        )
      `)
      .eq("id", botId)
      .eq("user_id", userId)
      .single()

    if (error || !agent) {
      console.log("Agente não encontrado:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Agente não encontrado",
          message: "O agente com o ID fornecido não foi encontrado ou não pertence a você",
          details: error?.message,
        },
        { status: 404 },
      )
    }

    console.log("Agente encontrado:", agent.name)

    // Formatar resposta com todas as informações necessárias
    const response = {
      success: true,
      message: "Agente encontrado com sucesso",
      bot: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        identity_description: agent.identity_description,
        training_prompt: agent.training_prompt,
        voice_tone: agent.voice_tone,
        main_function: agent.main_function,
        temperature: agent.temperature,
        is_default: agent.is_default,
        status: agent.status,

        // Configurações de funcionalidades (true/false)
        transcribe_audio: agent.transcribe_audio || false,
        understand_images: agent.understand_images || false,
        voice_response_enabled: agent.voice_response_enabled || false,
        calendar_integration: agent.calendar_integration || false,

        // Dados das integrações (quando habilitadas)
        voice_config: agent.voice_response_enabled
          ? {
              provider: agent.voice_provider, // "eleven_labs" ou "fish_audio"
              api_key: agent.voice_api_key,
              voice_id: agent.voice_id,
            }
          : null,

        calendar_config: agent.calendar_integration
          ? {
              api_key: agent.calendar_api_key,
              event_type_id: agent.calendar_event_type_id,
            }
          : null,

        // Configurações da Evolution API
        evolution_config: agent.model_config
          ? {
              listening_from_me: agent.model_config.listening_from_me || false,
              stop_bot_from_me: agent.model_config.stop_bot_from_me || false,
              keep_open: agent.model_config.keep_open || false,
              debounce_time: agent.model_config.debounce_time || 0,
              split_messages: agent.model_config.split_messages || false,
              time_per_char: agent.model_config.time_per_char || 0,
              delay_message: agent.model_config.delay_message || 0,
              presence_online: agent.model_config.presence_online || false,
              presence_composing: agent.model_config.presence_composing || false,
              presence_recording: agent.model_config.presence_recording || false,
              trigger_type: agent.model_config.trigger_type || "keyword",
              trigger_operator: agent.model_config.trigger_operator || "contains",
              trigger_value: agent.model_config.trigger_value || "",
            }
          : null,

        // Informações da conexão WhatsApp
        whatsapp_connection: agent.whatsapp_connections
          ? {
              name: agent.whatsapp_connections.connection_name,
              instance: agent.whatsapp_connections.instance_name,
              status: agent.whatsapp_connections.status,
            }
          : null,

        created_at: agent.created_at,
        updated_at: agent.updated_at,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        message: "Ocorreu um erro inesperado no servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
