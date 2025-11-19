import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: "impaai" },
    })

    // Buscar todos os usuários com informações da empresa
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        company_id,
        created_at,
        last_login_at,
        companies:company_id (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Formatar dados
    const formattedUsers = users?.map((u: any) => ({
      ...u,
      company_name: u.companies?.name || null,
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error: any) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar usuários" },
      { status: 500 }
    )
  }
}
