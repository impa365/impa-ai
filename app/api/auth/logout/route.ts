import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🚪 Realizando logout...")

    // Limpar cookie do usuário
    const cookieStore = await cookies()
    cookieStore.delete("impaai_user")

    console.log("✅ Logout realizado com sucesso")

    return NextResponse.json({ success: true, message: "Logout realizado com sucesso" })
  } catch (error: any) {
    console.error("💥 Erro no logout:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
