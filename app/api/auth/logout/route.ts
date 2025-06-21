import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🚪 Realizando logout...")

    // Limpar todos os cookies de autenticação
    const cookieStore = await cookies()
    
    // Limpar cookies JWT
    cookieStore.delete("impaai_access_token")
    cookieStore.delete("impaai_refresh_token")
    
    // Limpar cookie tradicional (compatibilidade)
    cookieStore.delete("impaai_user")

    console.log("✅ Logout realizado com sucesso - todos os cookies limpos")

    return NextResponse.json({ success: true, message: "Logout realizado com sucesso" })
  } catch (error: any) {
    console.error("💥 Erro no logout:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
