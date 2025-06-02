import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Validar API key
async function validateApiKey(apiKey: string) {
  const { data, error } = await supabase.from("user_api_keys").select("user_id").eq("api_key", apiKey).single()

  if (error || !data) {
    return null
  }

  // Atualizar last_used_at
  await supabase.from("user_api_keys").update({ last_used_at: new Date().toISOString() }).eq("api_key", apiKey)

  return data.user_id
}

// GET - Obter informações do bot
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const botId = params.id
    const apiKey = request.headers.get("apikey")

    if (!apiKey) {
      return NextResponse.json({ error: "API key é obrigatória" }, { status: 401 })
    }

    // Validar API key
    const userId = await validateApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ error: "API key inválida" }, { status: 401 })
    }

    // Buscar o agente
    const { data: agent, error } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections!inner(
          connection_name,
          instance_name,
          status
        )
      `)
      .eq("id", botId)
      .eq("user_id", userId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Formatar resposta com todas as informações necessárias
    const response = {
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
      whatsapp_connection: {
        name: agent.whatsapp_connections?.connection_name,
        instance: agent.whatsapp_connections?.instance_name,
        status: agent.whatsapp_connections?.status,
      },

      created_at: agent.created_at,
      updated_at: agent.updated_at,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao buscar agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
