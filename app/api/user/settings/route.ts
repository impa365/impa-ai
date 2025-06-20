import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  console.log("📡 API: GET /api/user/settings chamada")

  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (currentUser.role === "admin") {
      return NextResponse.json({ error: "Use APIs admin para admin" }, { status: 403 })
    }

    // Retornar configurações padrão baseadas no usuário
    // Não expor nenhuma informação confidencial
    const defaultSettings = {
      user_id: currentUser.id,
      agents_limit: 1, // Limite padrão para usuários normais
      transcribe_audio_enabled: true,
      understand_images_enabled: true,
      voice_response_enabled: false,
      calendar_integration_enabled: false,
    }

    console.log("✅ Configurações padrão retornadas para usuário:", currentUser.id)

    return NextResponse.json({
      success: true,
      settings: defaultSettings,
    })
  } catch (error: any) {
    console.error("❌ Erro na API user/settings:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
