import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  console.log("API: /api/whatsapp-connections chamada.")

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("API: Erro ao obter sessão:", sessionError)
      return NextResponse.json({ error: "Erro de autenticação", details: sessionError.message }, { status: 500 })
    }

    if (!session) {
      console.warn("API: Tentativa de acesso não autenticada.")
      return NextResponse.json({ error: "Não autorizado. Sessão não encontrada." }, { status: 401 })
    }

    console.log(`API: Usuário autenticado: ${session.user.id}. Buscando conexões...`)

    // Seleciona todas as colunas necessárias, sem filtro de status
    const { data, error, count } = await supabase
      .from("whatsapp_connections")
      .select("id, connection_name, instance_name, status, user_id, phone_number", { count: "exact" })
      // .eq('user_id', session.user.id) // Descomente se conexões são por usuário
      .order("created_at", { ascending: false })

    if (error) {
      console.error("API: Erro ao buscar conexões do Supabase:", error)
      return NextResponse.json({ error: "Falha ao buscar conexões", details: error.message }, { status: 500 })
    }

    console.log(`API: ${data?.length || 0} conexões encontradas para o usuário ${session.user.id}.`)
    return NextResponse.json({
      success: true,
      connections: data || [],
      count: count || 0,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error("API: Exceção no handler GET:", e)
    return NextResponse.json({ error: "Erro interno do servidor", details: e.message }, { status: 500 })
  }
}
