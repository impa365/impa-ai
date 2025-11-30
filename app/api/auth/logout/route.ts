import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    console.log("🚪 Realizando logout...")

    // Limpar todos os cookies de autenticação
    const cookieStore = await cookies()
    
    // Lista de todos os cookies que devem ser limpos
    const cookiesToDelete = [
      "impaai_access_token",
      "impaai_refresh_token", 
      "impaai_user",
      "impaai_user_client"
    ]

    // Deletar cada cookie
    cookiesToDelete.forEach(cookieName => {
      cookieStore.delete(cookieName)
      console.log(`🗑️ Cookie deletado: ${cookieName}`)
    })

    console.log("✅ Logout realizado com sucesso - todos os cookies limpos")

    return NextResponse.json({ success: true, message: "Logout realizado com sucesso" })
  } catch (error: any) {
    console.error("💥 Erro no logout:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
