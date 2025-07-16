import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 API: GET /api/user/settings chamada")

  try {
    // Retornar configurações padrão para usuários
    const defaultSettings = {
      agents_limit: 5, // Limite padrão para usuários normais
      transcribe_audio_enabled: true,
      understand_images_enabled: true,
      voice_response_enabled: true,
      calendar_integration_enabled: true,
    }

    console.log("✅ Configurações padrão retornadas")

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
