import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔧 Buscando versão da aplicação...")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Configuração do Supabase não encontrada")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    // Buscar versão via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/system_settings?setting_key=eq.app_version`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    })

    if (!response.ok) {
      console.error("❌ Erro ao buscar versão:", response.status)
      return NextResponse.json({ version: "1.0.0" })
    }

    const data = await response.json()
    const version = data && data.length > 0 ? data[0].setting_value : "1.0.0"

    console.log("✅ Versão encontrada:", version)
    return NextResponse.json({ version })
  } catch (error: any) {
    console.error("💥 Erro ao buscar versão:", error.message)
    return NextResponse.json({ version: "1.0.0" })
  }
}

export async function POST(request: Request) {
  try {
    const { version } = await request.json()

    if (!version) {
      return NextResponse.json({ error: "Versão é obrigatória" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    // Atualizar versão via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/system_settings?setting_key=eq.app_version`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
      body: JSON.stringify({
        setting_value: version,
        updated_at: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      console.error("❌ Erro ao atualizar versão:", response.status)
      return NextResponse.json({ error: "Erro ao atualizar versão" }, { status: 500 })
    }

    console.log("✅ Versão atualizada:", version)
    return NextResponse.json({ success: true, version })
  } catch (error: any) {
    console.error("💥 Erro ao atualizar versão:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
