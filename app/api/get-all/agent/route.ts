import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request)

    if (!authResult.isValid || !authResult.user) {
      // Adicionada verificação para authResult.user
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

    // Buscar agentes do usuário
    let query = supabase
      .from("ai_agents") // Confirme se o nome da tabela está correto
      .select(`
        id,
        name,
        description,
        model,
        training_prompt,
        temperature,
        max_tokens,
        is_active,
        created_at,
        updated_at,
        user_id, 
        assistant_type,
        main_function,
        total_conversations,
        total_messages,
        performance_score
      `)
      .eq("is_active", true)

    // Se não for admin, filtrar apenas agentes do usuário
    // Certifique-se que user.id e user.role estão corretos e disponíveis
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
          details: dbError.message, // Adiciona detalhes do erro do Supabase
          hint: dbError.hint,
        },
        { status: 500 },
      )
    }

    // Formatar resposta para incluir estatísticas e outros campos relevantes
    const formattedAgents =
      agents?.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model,
        training_prompt: agent.training_prompt,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        is_active: agent.is_active,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        user_id: agent.user_id,
        assistant_type: agent.assistant_type,
        main_function: agent.main_function,
        stats: {
          total_conversations: agent.total_conversations || 0,
          total_messages: agent.total_messages || 0,
          performance_score: agent.performance_score || 0,
        },
      })) || []

    return NextResponse.json({
      success: true,
      data: formattedAgents,
      total: formattedAgents.length,
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role,
      },
    })
  } catch (error: any) {
    // Especificar o tipo do erro se possível
    console.error("API Route Error in /api/get-all/agent:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message, // Adiciona a mensagem do erro genérico
      },
      { status: 500 },
    )
  }
}
