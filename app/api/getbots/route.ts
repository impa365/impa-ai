import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("apikey")

    console.log("🔍 API getbots chamada:", { hasApiKey: !!apiKey })

    if (!apiKey) {
      return NextResponse.json({ error: "API key é obrigatória" }, { status: 401 })
    }

    // Buscar informações da API key
    const { data: apiKeyData, error: apiKeyError } = await db
      .apiKeys()
      .select(`
        id,
        user_id,
        is_admin_key,
        access_scope,
        user_profiles!user_api_keys_user_id_fkey(
          id,
          role,
          full_name,
          email
        )
      `)
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (apiKeyError || !apiKeyData) {
      console.log("❌ API key inválida:", apiKeyError?.message)
      return NextResponse.json({ error: "API key inválida" }, { status: 401 })
    }

    console.log("✅ API key válida:", {
      userId: apiKeyData.user_id,
      isAdmin: apiKeyData.is_admin_key,
      scope: apiKeyData.access_scope,
      userRole: apiKeyData.user_profiles?.role,
    })

    // Buscar agentes com base no escopo de acesso
    let agentsQuery = db
      .agents()
      .select(`
        id,
        name,
        description,
        type,
        status,
        main_function,
        voice_tone,
        created_at,
        updated_at,
        user_id,
        whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
          connection_name,
          phone_number,
          status
        ),
        user_profiles!ai_agents_user_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    // Se não for API key de admin, filtrar apenas bots do próprio usuário
    if (!apiKeyData.is_admin_key || apiKeyData.access_scope !== "admin") {
      agentsQuery = agentsQuery.eq("user_id", apiKeyData.user_id)
      console.log("🔒 Acesso restrito aos próprios bots do usuário")
    } else {
      console.log("🔓 Acesso de administrador - pode acessar todos os bots")
    }

    const { data: agents, error: agentsError } = await agentsQuery

    if (agentsError) {
      console.error("❌ Erro ao buscar agentes:", agentsError)
      return NextResponse.json({ error: "Erro ao buscar agentes" }, { status: 500 })
    }

    console.log("✅ Agentes encontrados:", {
      total: agents?.length || 0,
      isAdminAccess: apiKeyData.is_admin_key,
    })

    // Atualizar último uso da API key
    await db.apiKeys().update({ last_used_at: new Date().toISOString() }).eq("api_key", apiKey)

    // Formatar resposta baseada no tipo de acesso
    const responseAgents =
      agents?.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        status: agent.status,
        main_function: agent.main_function,
        voice_tone: agent.voice_tone,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        whatsapp_connection: agent.whatsapp_connections,
        // Incluir informações do proprietário apenas para admins
        owner: apiKeyData.is_admin_key
          ? {
              id: agent.user_profiles?.id,
              name: agent.user_profiles?.full_name,
              email: agent.user_profiles?.email,
            }
          : undefined,
      })) || []

    return NextResponse.json({
      user: {
        id: apiKeyData.user_profiles?.id,
        name: apiKeyData.user_profiles?.full_name,
        email: apiKeyData.user_profiles?.email,
        role: apiKeyData.user_profiles?.role,
      },
      agents: responseAgents,
      total: responseAgents.length,
      access_info: {
        is_admin_access: apiKeyData.is_admin_key,
        access_scope: apiKeyData.access_scope,
        can_access_all_bots: apiKeyData.is_admin_key && apiKeyData.access_scope === "admin",
      },
    })
  } catch (error) {
    console.error("💥 Erro na API getbots:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
