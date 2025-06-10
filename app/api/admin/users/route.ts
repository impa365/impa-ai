import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single()

    if (userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, role")
      .order("full_name")

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erro no handler de usuários:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
