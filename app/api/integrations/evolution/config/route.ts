import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/integrations?type=eq.evolution_api&is_active=eq.true&select=config`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar configuração" }, { status: 500 })
    }

    const integrations = await response.json()

    if (!integrations || integrations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API não encontrada ou inativa" },
        { status: 404 },
      )
    }

    const config = integrations[0].config as { apiUrl?: string; apiKey?: string }

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { success: false, error: "Configuração da Evolution API está em formato inválido" },
        { status: 400 },
      )
    }

    if (!config.apiUrl || config.apiUrl.trim() === "") {
      return NextResponse.json({ success: false, error: "URL da Evolution API não está configurada" }, { status: 400 })
    }

    // Retornar apenas se a configuração existe e está válida
    // NÃO retornar as credenciais reais
    return NextResponse.json({
      success: true,
      configured: true,
      hasApiKey: !!(config.apiKey && config.apiKey.trim() !== ""),
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
