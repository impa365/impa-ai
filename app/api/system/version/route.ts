import { NextResponse } from "next/server"

// Cache simples para versão
let versionCache: { version: string; timestamp: number } | null = null
const CACHE_TTL = 60 * 1000 // 1 minuto

export async function GET() {
  try {
    // Verificar cache primeiro
    const now = Date.now()
    if (versionCache && (now - versionCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({ version: versionCache.version })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ version: "1.0.0" })
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
      return NextResponse.json({ version: "1.0.0" })
    }

    const data = await response.json()
    const version = data && data.length > 0 ? data[0].setting_value : "1.0.0"

    // Atualizar cache
    versionCache = { version, timestamp: now }

    return NextResponse.json({ version })
  } catch (error: any) {
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
