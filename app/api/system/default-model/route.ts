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
      console.error("❌ Erro ao buscar modelo padrão:", response.status, errorText)
      throw new Error(`Erro ao buscar modelo padrão: ${response.status}`)
    }

    const data = await response.json()
    const defaultModel = data[0]?.setting_value || "gpt-4o-mini"

    console.log("✅ Modelo padrão encontrado:", defaultModel)

    return NextResponse.json({
      success: true,
      defaultModel,
    })
  } catch (error: any) {
    console.error("❌ Erro na API default-model:", error.message)
    return NextResponse.json(
      {
        error: "Erro ao buscar modelo padrão",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
