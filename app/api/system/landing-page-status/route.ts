import { NextResponse } from "next/server"

// Cache simples em memória para otimização
let cachedStatus: { enabled: boolean; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 segundos

export async function GET() {
  try {
    // Verificar se a landing page foi desabilitada completamente via variável de ambiente
    if (process.env.DISABLE_LANDING_PAGE === 'true') {
      return NextResponse.json({
        success: true,
        landingPageEnabled: false,
        disabled: true,
        message: "Landing page desabilitada via configuração do sistema"
      })
    }

    // Verificar cache primeiro para performance máxima
    if (cachedStatus && Date.now() - cachedStatus.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        landingPageEnabled: cachedStatus.enabled
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Fallback seguro: se não conseguir conectar, desativa landing page
      return NextResponse.json({
        success: true,
        landingPageEnabled: false
      })
    }

    // Buscar configuração específica da landing page
    const response = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?select=setting_value&setting_key=eq.landing_page_enabled&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      }
    )

    if (!response.ok) {
      // Fallback: se não conseguir acessar, assume desabilitado por segurança
      return NextResponse.json({
        success: true,
        landingPageEnabled: false
      })
    }

    const settings = await response.json()
    let isEnabled = false

    if (Array.isArray(settings) && settings.length > 0) {
      const settingValue = settings[0].setting_value
      // Suporte a diferentes formatos de valor
      if (typeof settingValue === 'boolean') {
        isEnabled = settingValue
      } else if (typeof settingValue === 'string') {
        isEnabled = settingValue.toLowerCase() === 'true'
      }
    } else {
      // Se não existe a configuração, criar com valor padrão (habilitado)
      await fetch(`${supabaseUrl}/rest/v1/system_settings`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
        body: JSON.stringify({
          setting_key: "landing_page_enabled",
          setting_value: "true",
          category: "interface",
          description: "Controla se a landing page está ativa ou se deve mostrar login direto",
          is_public: false,
          requires_restart: false
        })
      })
      isEnabled = true
    }

    // Atualizar cache
    cachedStatus = {
      enabled: isEnabled,
      timestamp: Date.now()
    }

    return NextResponse.json({
      success: true,
      landingPageEnabled: isEnabled
    })

  } catch (error: any) {
    console.error("Erro ao verificar status da landing page:", error.message)
    
    // Em caso de erro, retorna desabilitado por segurança
    return NextResponse.json({
      success: true,
      landingPageEnabled: false
    })
  }
}

export async function POST(request: Request) {
  try {
    // Verificar se a landing page foi desabilitada completamente via variável de ambiente
    if (process.env.DISABLE_LANDING_PAGE === 'true') {
      return NextResponse.json({
        success: false,
        error: "Landing page está desabilitada via configuração do sistema e não pode ser alterada",
        disabled: true
      }, { status: 403 })
    }

    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: "Parâmetro 'enabled' deve ser boolean"
      }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: "Configuração do servidor incompleta"
      }, { status: 500 })
    }

    // Verificar se a configuração já existe
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?select=id&setting_key=eq.landing_page_enabled`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      }
    )

    const existing = await checkResponse.json()
    const settingExists = Array.isArray(existing) && existing.length > 0

    if (settingExists) {
      // Atualizar configuração existente
      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.landing_page_enabled`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Accept-Profile": "impaai",
            "Content-Profile": "impaai",
          },
          body: JSON.stringify({
            setting_value: enabled.toString(),
            updated_at: new Date().toISOString(),
          }),
        }
      )

      if (!updateResponse.ok) {
        throw new Error(`Erro ao atualizar configuração: ${updateResponse.status}`)
      }
    } else {
      // Criar nova configuração
      const createResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
        body: JSON.stringify({
          setting_key: "landing_page_enabled",
          setting_value: enabled.toString(),
          category: "interface",
          description: "Controla se a landing page está ativa ou se deve mostrar login direto",
          is_public: false,
          requires_restart: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      })

      if (!createResponse.ok) {
        throw new Error(`Erro ao criar configuração: ${createResponse.status}`)
      }
    }

    // Limpar cache para forçar atualização na próxima consulta
    cachedStatus = null

    return NextResponse.json({
      success: true,
      message: `Landing page ${enabled ? 'ativada' : 'desativada'} com sucesso!`,
      landingPageEnabled: enabled
    })

  } catch (error: any) {
    console.error("Erro ao atualizar status da landing page:", error.message)
    return NextResponse.json({
      success: false,
      error: `Erro ao atualizar configuração: ${error.message}`
    }, { status: 500 })
  }
} 