import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 API: /api/system/default-model chamada")

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    console.log("🔍 Buscando modelo padrão do sistema...")
    const response = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?select=setting_value&setting_key=eq.default_model`,
      { headers },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao buscar default_model:", response.status, errorText)
      throw new Error(`Erro ao buscar default_model: ${response.status}`)
    }

    const data = await response.json()
    console.log("✅ Resposta do sistema:", data)

    if (data && data.length > 0 && data[0].setting_value) {
      const defaultModel = data[0].setting_value.toString().trim()
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
