import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("⚙️ Buscando configurações do sistema...")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Buscar configurações via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    })

    if (!response.ok) {
      console.log("⚠️ Tabela system_settings não encontrada, usando valores padrão")
      // Retornar valores padrão se a tabela não existir
      return NextResponse.json({
        settings: {
          default_whatsapp_connections_limit: 1,
          default_agents_limit: 2,
        },
      })
    }

    const settings = await response.json()
    console.log("✅ Configurações encontradas:", settings.length)

    // Converter array de configurações em objeto
    const settingsObj: Record<string, any> = {}
    settings.forEach((setting: any) => {
      settingsObj[setting.setting_key] = setting.setting_value
    })

    // Garantir valores padrão
    const finalSettings = {
      default_whatsapp_connections_limit: settingsObj.default_whatsapp_connections_limit || 1,
      default_agents_limit: settingsObj.default_agents_limit || 2,
      ...settingsObj,
    }

    return NextResponse.json({ settings: finalSettings })
  } catch (error: any) {
    console.error("💥 Erro ao buscar configurações:", error.message)
    // Retornar valores padrão em caso de erro
    return NextResponse.json({
      settings: {
        default_whatsapp_connections_limit: 1,
        default_agents_limit: 2,
      },
    })
  }
}
