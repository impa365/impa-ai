import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autorização interna
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

    const { error } = await supabase.from("user_api_keys").delete().eq("id", id)

    if (error) {
      console.error("❌ Erro ao excluir API key:", error)
      return NextResponse.json({ error: "Erro ao excluir API key" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
