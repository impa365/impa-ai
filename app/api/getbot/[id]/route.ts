import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const botId = params.id

    // Obter API key do cabeçalho
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.headers.get("x-auth-token")

    if (!apiKey) {
      console.log("❌ API key não fornecida")
      return NextResponse.json({ error: "API key não fornecida" }, { status: 401 })
    }

    console.log("🔑 Verificando API key:", apiKey.substring(0, 10) + "...")
    console.log("🤖 Buscando bot com ID:", botId)

    // Verificar se a API key existe
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id, email, role, status")
      .eq("api_key", apiKey)
      .eq("status", "active")
      .single()

    if (userError || !userData) {
      console.log("❌ API key inválida ou usuário inativo")
      return NextResponse.json({ error: "API key inválida ou usuário inativo" }, { status: 401 })
    }

    console.log("✅ API key válida para usuário:", userData.email)

    // Buscar bot específico
    const { data: bot, error: botError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        whatsapp_connections:whatsapp_connection_id (
          connection_name,
          instance_name,
          phone_number,
          status
        )
      `)
      .eq("id", botId)
      .eq("user_id", userData.id)
      .single()

    if (botError || !bot) {
      console.error("❌ Bot não encontrado ou sem permissão:", botError?.message)
      return NextResponse.json({ error: "Bot não encontrado ou sem permissão" }, { status: 404 })
    }

    console.log("✅ Bot encontrado:", bot.name)

    // Formatar resposta
    const botResponse = {
      id: bot.id,
      name: bot.name,
      description: bot.description,
      status: bot.status,
      model: bot.model,
      temperature: bot.temperature,

      // Configurações de comportamento
      training_prompt: bot.training_prompt,
      voice_tone: bot.voice_tone,
      main_function: bot.main_function,

      // Funcionalidades
      transcribe_audio: bot.transcribe_audio,
      understand_images: bot.understand_images,

      // Integrações
      voice_response: {
        enabled: bot.voice_response_enabled,
        provider: bot.voice_provider,
        voice_id: bot.voice_id,
      },

      calendar: {
        enabled: bot.calendar_integration,
        api_key: bot.calendar_api_key,
        meeting_id: bot.calendar_meeting_id,
      },

      chatnode_config: {
        enabled: bot.chatnode_integration,
        api_key: bot.chatnode_api_key,
        bot_id: bot.chatnode_bot_id,
      },

      orimon_config: {
        enabled: bot.orimon_integration,
        api_key: bot.orimon_api_key,
        bot_id: bot.orimon_bot_id,
      },

      whatsapp: bot.whatsapp_connections,

      // Configurações avançadas
      is_default: bot.is_default,
      listen_own_messages: bot.listen_own_messages,
      stop_bot_by_me: bot.stop_bot_by_me,
      keep_conversation_open: bot.keep_conversation_open,
      split_long_messages: bot.split_long_messages,
      character_wait_time: bot.character_wait_time,

      created_at: bot.created_at,
      updated_at: bot.updated_at,
    }

    return NextResponse.json({
      success: true,
      bot: botResponse,
    })
  } catch (error: any) {
    console.error("💥 Erro geral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
