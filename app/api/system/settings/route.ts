import { NextResponse } from "next/server"

// Cache simples em memória para otimização
let cachedSettings: { settings: any; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 segundos

export async function GET() {
  try {
    // Verificar cache primeiro para performance máxima
    if (cachedSettings && Date.now() - cachedSettings.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        settings: cachedSettings.settings
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: "Configuração do banco não encontrada"
      }, { status: 500 })
    }

    // Buscar apenas configurações públicas ou específicas necessárias
    const response = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?select=setting_key,setting_value&or=(setting_key.eq.footer_text,setting_key.eq.system_name,setting_key.eq.app_name,is_public.eq.true)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Erro na consulta: ${response.status}`)
    }

    const data = await response.json()

    // Converter array de configurações em objeto
    const settings: any = {}
    data.forEach((setting: any) => {
      try {
        // Tentar fazer parse do JSON, se falhar usar o valor direto
        settings[setting.setting_key] = JSON.parse(setting.setting_value)
      } catch {
        settings[setting.setting_key] = setting.setting_value
      }
    })

    // Atualizar cache
    cachedSettings = {
      settings,
      timestamp: Date.now()
    }

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    
    // Fallback com configurações padrão
    const defaultSettings = {
      footer_text: "© 2024 Impa AI - Desenvolvido pela Comunidade IMPA",
      system_name: "Impa AI",
      app_name: "Impa AI"
    }

    return NextResponse.json({
      success: true,
      settings: defaultSettings
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { setting_key, setting_value } = body

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json({
        success: false,
        error: "setting_key e setting_value são obrigatórios"
      }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: "Configuração do banco não encontrada"
      }, { status: 500 })
    }

    // Atualizar configuração
    const response = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.${setting_key}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          setting_value: JSON.stringify(setting_value),
          updated_at: new Date().toISOString()
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Erro ao atualizar: ${response.status}`)
    }

    // Limpar cache para forçar atualização na próxima consulta
    cachedSettings = null

    return NextResponse.json({
      success: true,
      message: "Configuração atualizada com sucesso"
    })

  } catch (error) {
    console.error("Erro ao atualizar configuração:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}
