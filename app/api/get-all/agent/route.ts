import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request)

    if (!authResult.isValid) {
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
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    // Buscar agentes do usuário
    let query = supabase
      .from("ai_agents")
      .select(`
        id,
        name,
        description,
        model,
        system_prompt,
        temperature,
        max_tokens,
        is_active,
        created_at,
        updated_at
      `)
      .eq("is_active", true)

    // Se não for admin, filtrar apenas agentes do usuário
    if (user.role !== "admin") {
      query = query.eq("user_id", user.id)
    }

    const { data: agents, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching agents:", error)
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: agents || [],
      total: agents?.length || 0,
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
