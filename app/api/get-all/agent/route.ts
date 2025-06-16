import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { createClient } from "@supabase/supabase-js"
import { getDefaultModel } from "@/lib/api-helpers"

export async function GET(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request)

    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json(
        {
          error: authResult.error || "Unauthorized",
          message: "API key validation failed",
        },
        { status: 401 },
      )
    }

    const user = authResult.user

    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Server configuration error: Supabase URL or Anon Key is missing.")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Buscar modelo padrão do sistema
    const systemDefaultModel = await getDefaultModel()
    const fallbackModel = systemDefaultModel || "gpt-4o-mini"

    // Buscar agentes do usuário
    let query = supabase
      .from("ai_agents")
      .select(`
        id,
        name,
        description,
        model,
        training_prompt,
        temperature,
        max_tokens,
        status,
        created_at,
        updated_at,
        user_id,
        main_function,
        total_conversations,
        total_messages,
        performance_score,
        type 
      `)
      .eq("status", "active")

    if (user.role !== "admin") {
      if (!user.id) {
        console.error("User ID is missing for non-admin role.")
        return NextResponse.json({ error: "User identification failed for non-admin." }, { status: 400 })
      }
      query = query.eq("user_id", user.id)
    }

    const { data: agents, error: dbError } = await query.order("created_at", { ascending: false })

    if (dbError) {
      console.error("Error fetching agents from Supabase:", dbError)
      return NextResponse.json(
        {
          error: "Failed to fetch agents",
          details: dbError.message,
          hint: dbError.hint,
        },
        { status: 500 },
      )
    }

    const formattedAgents =
      agents?.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model || fallbackModel, // Usar modelo do agente ou padrão do sistema
        training_prompt: agent.training_prompt,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        status: agent.status,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        user_id: agent.user_id,
        main_function: agent.main_function,
        type: agent.type,
        stats: {
          total_conversations: agent.total_conversations || 0,
          total_messages: agent.total_messages || 0,
          performance_score: agent.performance_score || 0,
        },
      })) || []

    return NextResponse.json({
      success: true,
      default_model: systemDefaultModel, // Incluir o modelo padrão do sistema na resposta
      data: formattedAgents,
      total: formattedAgents.length,
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error("API Route Error in /api/get-all/agent:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
