import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Cliente Supabase com privilégios administrativos
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário está logado e é admin
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Usuário não autenticado" }, { status: 401 })
    }

    // Verificar se é admin
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("email", session.user.email)
      .single()

    if (userError || user?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Acesso negado. Apenas administradores podem executar SQL." },
        { status: 403 },
      )
    }

    const { sql } = await request.json()

    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ success: false, message: "SQL não fornecido ou inválido" }, { status: 400 })
    }

    // Executar SQL
    const { data, error } = await supabaseAdmin.rpc("execute_sql", { sql_query: sql })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao executar SQL",
          error: error.message,
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "SQL executado com sucesso",
      data: data,
      rowCount: Array.isArray(data) ? data.length : null,
    })
  } catch (error) {
    console.error("Erro ao executar SQL:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
