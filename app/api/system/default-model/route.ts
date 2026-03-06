import { NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function GET() {
  console.log("📡 API: /api/system/default-model chamada")

  try {
    console.log("🔍 Buscando modelo padrão do sistema...")
    const row = await queryOne<{ setting_value: string }>(
      "SELECT setting_value FROM system_settings WHERE setting_key = $1",
      ["default_model"]
    )
    console.log("✅ Resposta do sistema:", row)

    if (row && row.setting_value) {
      const defaultModel = row.setting_value.toString().trim()
      console.log("✅ Default model encontrado:", defaultModel)

      return NextResponse.json({
        success: true,
        defaultModel: defaultModel,
      })
    } else {
      console.warn("⚠️ Default model não encontrado, usando fallback")
      return NextResponse.json({
        success: true,
        defaultModel: "gpt-3.5-turbo",
      })
    }
  } catch (error: any) {
    console.error("❌ Erro na API default-model:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
        defaultModel: "gpt-3.5-turbo", // Fallback
      },
      { status: 500 },
    )
  }
}
