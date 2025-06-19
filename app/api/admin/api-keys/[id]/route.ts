import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Cliente faz requisição segura
    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. API faz requisição segura para o banco
    const { error } = await supabase.from("user_api_keys").delete().eq("id", params.id)

    if (error) {
      console.error("❌ Erro ao deletar API key:", error)
      return NextResponse.json({ error: "Erro ao deletar API key" }, { status: 500 })
    }

    // 3. Banco confirma exclusão
    // 4. API confirma para o painel
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Erro interno:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
