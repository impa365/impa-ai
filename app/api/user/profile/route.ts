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

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, role")
      .eq("id", session.user.id)
      .single()

    if (error) {
      console.error("Erro ao buscar perfil:", error)
      return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Erro no handler de perfil:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
