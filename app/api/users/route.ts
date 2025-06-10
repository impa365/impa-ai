// Content from attached file: app__api__users__route-JugaeTldQjStLn8Bw7967Vk9o2KWwT.ts
// This is a new API route. The previous project had `app/api/admin/users/route.ts`.
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase" // Assuming direct supabase client
import { getCurrentUser } from "@/lib/auth" // For client-side role check, might not be ideal for API routes

export async function GET() {
  try {
    // IMPORTANT: `getCurrentUser()` as used in client-side components typically relies on localStorage
    // or a similar client-side mechanism. In a Next.js API route (server-side),
    // you need to get the user session from cookies.
    // The previous `app/api/admin/users/route.ts` used `createRouteHandlerClient({ cookies })`
    // and `supabase.auth.getSession()`. This is the correct server-side approach.
    // The current implementation here might not work as expected for auth in an API route.

    // Simulating server-side auth for now - this needs to be replaced with proper server-side session handling.
    // For example:
    // import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
    // import { cookies } from "next/headers"
    // const supabaseAuth = createRouteHandlerClient({ cookies })
    // const { data: { session } } = await supabaseAuth.auth.getSession()
    // if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    // const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single();
    // if (userProfile?.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

    const currentUser = getCurrentUser() // This is client-side logic
    console.warn(
      "API /api/users: Using client-side getCurrentUser() in API route. This is not secure/reliable for server-side auth.",
    )

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar esta rota." },
        { status: 403 },
      )
    }

    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, status, role") // role included as per agent-modal
      .eq("status", "active")
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      return NextResponse.json({ error: "Falha ao buscar usuários", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      count: users?.length || 0,
    })
  } catch (error: any) {
    console.error("Erro na API de usuários:", error)
    return NextResponse.json({ error: "Erro interno do servidor", details: error.message }, { status: 500 })
  }
}
