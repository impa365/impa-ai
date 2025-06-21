import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, canAccessAgent } from "@/lib/api-auth"
import { getSupabaseServer } from "@/lib/supabase-config"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 GET /api/get/agent/[id] - Starting request")
    console.log("📋 Agent ID:", params.id)

    // Validate API key
    const validation = await validateApiKey(request)
    console.log("🔐 API Key validation:", validation.isValid ? "✅ Valid" : "❌ Invalid")

    if (!validation.isValid || !validation.user) {
      console.log("❌ Authentication failed:", validation.error)
      return NextResponse.json({ error: validation.error || "Falha na autenticação da API key" }, { status: 401 })
    }

    const { user } = validation
    const agentId = params.id

    console.log("👤 User:", { id: user.id, role: user.role, email: user.email })

    // Get Supabase client
    const supabase = await getSupabaseServer()
    console.log("🗄️ Supabase client initialized")

    // Fetch agent with user profile
    console.log("🔍 Fetching agent from database...")
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        user_profiles (
          id,
          full_name,
          email
        )
      `)
      .eq("id", agentId)
      .single()

    if (agentError) {
      console.error("❌ Database error fetching agent:", agentError)
      return NextResponse.json({ error: "Erro ao buscar agente no banco de dados" }, { status: 500 })
    }

    if (!agent) {
      console.log("❌ Agent not found with ID:", agentId)
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    console.log("✅ Agent found:", { id: agent.id, name: agent.name, user_id: agent.user_id })

    // Check permissions
    const isAdminAccess = user.role === "admin"
    const hasAccess = canAccessAgent(user.role, isAdminAccess, agent.user_id, user.id)

    console.log("🔒 Access check:", {
      userRole: user.role,
      isAdmin: isAdminAccess,
      agentUserId: agent.user_id,
      requestUserId: user.id,
      hasAccess,
    })

    if (!hasAccess) {
      console.log("❌ Access denied")
      return NextResponse.json({ error: "Sem permissão para acessar este agente" }, { status: 403 })
    }

    // Get default model
    console.log("🔍 Fetching default model...")
    const { data: defaultModelData, error: modelError } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    if (modelError) {
      console.log("⚠️ Warning: Could not fetch default model:", modelError.message)
    }

    const systemDefaultModel = defaultModelData?.setting_value || "gpt-4o-mini"
    console.log("🤖 Default model:", systemDefaultModel)

    // Get WhatsApp connection if exists
    let whatsappConnection = null
    if (agent.whatsapp_connection_id) {
      console.log("📱 Fetching WhatsApp connection...")
      const { data: connectionData, error: connError } = await supabase
        .from("whatsapp_connections")
        .select("id, instance_name, status, phone_number, connection_name")
        .eq("id", agent.whatsapp_connection_id)
        .single()

      if (connError) {
        console.log("⚠️ Warning: Could not fetch WhatsApp connection:", connError.message)
      } else {
        whatsappConnection = connectionData
        console.log("📱 WhatsApp connection found:", connectionData?.instance_name)
      }
    }

    // Build response
    const response = {
      success: true,
      default_model: systemDefaultModel,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        avatar_url: agent.avatar_url,
        identity_description: agent.identity_description,
        training_prompt: agent.training_prompt,
        voice_tone: agent.voice_tone,
        main_function: agent.main_function,
        type: agent.type || "chat",
        status: agent.status,
        model: agent.model || systemDefaultModel,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        top_p: agent.top_p,
        frequency_penalty: agent.frequency_penalty,
        presence_penalty: agent.presence_penalty,
        model_config: agent.model_config,
        transcribe_audio: agent.transcribe_audio,
        understand_images: agent.understand_images,
        voice_response_enabled: agent.voice_response_enabled,
        calendar_integration: agent.calendar_integration,
        calendar_api_key: agent.calendar_api_key,
        chatnode_integration: agent.chatnode_integration,
        orimon_integration: agent.orimon_integration,
        voice_provider: agent.voice_provider,
        voice_id: agent.voice_id,
        voice_api_key: agent.voice_api_key,
        is_default: agent.is_default,
        listen_own_messages: agent.listen_own_messages,
        stop_bot_by_me: agent.stop_bot_by_me,
        keep_conversation_open: agent.keep_conversation_open,
        split_long_messages: agent.split_long_messages,
        character_wait_time: agent.character_wait_time,
        trigger_type: agent.trigger_type,
        working_hours: agent.working_hours,
        auto_responses: agent.auto_responses,
        fallback_responses: agent.fallback_responses,
        performance_score: agent.performance_score || 0,
        total_conversations: agent.total_conversations || 0,
        total_messages: agent.total_messages || 0,
        last_training_at: agent.last_training_at,
        evolution_bot_id: agent.evolution_bot_id,
        chatnode_bot_id: agent.chatnode_bot_id,
        chatnode_api_key: agent.chatnode_api_key,
        orimon_bot_id: agent.orimon_bot_id,
        orimon_api_key: agent.orimon_api_key,
        calendar_meeting_id: agent.calendar_meeting_id,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        whatsapp_connection: whatsappConnection,
        owner: agent.user_profiles
          ? {
              id: agent.user_profiles.id,
              name: agent.user_profiles.full_name,
              email: agent.user_profiles.email,
            }
          : null,
      },
      access_info: {
        is_admin_access: isAdminAccess,
        access_scope: user.role === "admin" ? "admin" : "user",
        requester: {
          id: user.id,
          name: user.full_name || user.email,
          role: user.role,
        },
      },
    }

    console.log("✅ Response prepared successfully")
    return NextResponse.json(response)
  } catch (error) {
    console.error("💥 Critical error in GET /api/get/agent/[id]:", error)
    console.error("📊 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      params: params,
    })

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    )
  }
}
