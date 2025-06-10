import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase" // Assuming direct supabase client usage as per the file

// Note: The original attachment had a supabase client from @supabase/auth-helpers-nextjs.
// The provided file seems to use a direct import from "@/lib/supabase".
// I'll stick to the provided file's import. If issues arise, this might need to be aligned
// with how session/auth is handled elsewhere (e.g. createRouteHandlerClient({ cookies })).

export async function GET(request: Request) {
  console.log("API: /api/whatsapp-connections chamada.")

  // const supabase = createRouteHandlerClient({ cookies }) // Using direct supabase import now
  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get("user_id") // Para admins filtrarem por usuário específico
  const includeUserInfo = searchParams.get("include_user_info") === "true"

  try {
    const {
      data: { session },
      error: sessionError,
    } = await createRouteHandlerClient({ cookies }).auth.getSession()

    if (sessionError) {
      console.error("API: Erro ao obter sessão:", sessionError)
      return NextResponse.json({ error: "Erro de autenticação", details: sessionError.message }, { status: 500 })
    }

    if (!session) {
      console.warn("API: Tentativa de acesso não autenticada.")
      return NextResponse.json({ error: "Não autorizado. Sessão não encontrada." }, { status: 401 })
    }

    // Verificar se o usuário é admin
    const { data: userProfile, error: profileError } = await createRouteHandlerClient({ cookies })
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("API: Erro ao buscar perfil do usuário:", profileError)
      return NextResponse.json({ error: "Erro ao verificar permissões" }, { status: 500 })
    }

    const isAdmin = userProfile?.role === "admin"
    console.log(`API: Usuário ${session.user.id} é admin: ${isAdmin}`)

    // Construir query baseada no tipo de usuário
    let query = supabase.from("whatsapp_connections").select(
      `
        id, 
        connection_name, 
        instance_name, 
        status, 
        user_id, 
        phone_number,
        created_at,
        ${includeUserInfo ? "user_profiles!inner(id, full_name, email)" : ""}
      `,
      { count: "exact" },
    )

    // Filtrar por usuário baseado no contexto
    if (isAdmin && targetUserId) {
      // Admin quer ver conexões de um usuário específico
      console.log(`API: Filtrando conexões para usuário específico: ${targetUserId}`)
      query = query.eq("user_id", targetUserId)
      console.log(`API: Admin buscando conexões do usuário: ${targetUserId}`)
    } else if (!isAdmin) {
      // Usuário comum só vê suas próprias conexões
      query = query.eq("user_id", session.user.id)
      console.log(`API: Usuário comum buscando suas próprias conexões`)
    } else {
      // Admin sem filtro específico - retorna todas as conexões
      console.log(`API: Admin buscando todas as conexões`)
    }

    // Aceitar múltiplos status de conexão
    const validStatuses = ["connected", "Authenticated", "disconnected", "connecting"]
    query = query.in("status", validStatuses)
    query = query.order("created_at", { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error("API: Erro ao buscar conexões do Supabase:", error)
      return NextResponse.json({ error: "Falha ao buscar conexões", details: error.message }, { status: 500 })
    }

    console.log(`API: ${data?.length || 0} conexões encontradas.`)
    return NextResponse.json({
      success: true,
      connections: data || [],
      count: count || 0,
      isAdmin,
      targetUserId: targetUserId || session.user.id,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error("API: Exceção no handler GET:", e)
    return NextResponse.json({ error: "Erro interno do servidor", details: e.message }, { status: 500 })
  }
}
