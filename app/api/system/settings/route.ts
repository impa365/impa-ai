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
          'Content-Type': 'application/json',
          'Accept-Profile': 'impaai',
          'Content-Profile': 'impaai'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Erro na consulta: ${response.status}`)
    }

    const data = await response.json()

    // Converter array de configurações em objeto
    const settings: any = {}
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((setting: any) => {
        try {
          // Tentar fazer parse do JSON, se falhar usar o valor direto
          settings[setting.setting_key] = JSON.parse(setting.setting_value)
        } catch {
          settings[setting.setting_key] = setting.setting_value
        }
      })
    }

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
    
    // Em caso de erro real de conexão, retornar settings vazio mas success true
    // para não quebrar a aplicação
    return NextResponse.json({
      success: true,
      settings: {},
      error: "Erro ao conectar com o banco de dados"
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Verificar se é uma configuração individual ou múltiplas
    if (body.setting_key && body.setting_value !== undefined) {
      // Configuração individual (usado pela landing page)
      return await updateSingleSetting(body.setting_key, body.setting_value)
    } else {
      // Múltiplas configurações (usado pelo admin panel)
      return await updateMultipleSettings(body)
    }

  } catch (error) {
    console.error("Erro ao processar configurações:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}

// Função para atualizar uma configuração individual
async function updateSingleSetting(setting_key: string, setting_value: any) {
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
        'Accept-Profile': 'impaai',
        'Content-Profile': 'impaai',
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

  // Limpar cache
  cachedSettings = null

  return NextResponse.json({
    success: true,
    message: "Configuração atualizada com sucesso"
  })
}

// Função para atualizar múltiplas configurações
async function updateMultipleSettings(settings: any) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      success: false,
      error: "Configuração do banco não encontrada"
    }, { status: 500 })
  }

  const updates = []
  const errors = []

  // Processar cada configuração
  for (const [key, value] of Object.entries(settings)) {
    // Pular chaves que não são configurações
    if (key === 'success' || key === 'settings') continue

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.${key}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Accept-Profile': 'impaai',
            'Content-Profile': 'impaai',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            setting_value: JSON.stringify(value),
            updated_at: new Date().toISOString()
          })
        }
      )

      if (response.ok) {
        updates.push(`${key}: atualizado`)
      } else {
        errors.push(`${key}: erro ${response.status}`)
      }
    } catch (error) {
      errors.push(`${key}: erro de conexão`)
    }
  }

  // Limpar cache
  cachedSettings = null

  return NextResponse.json({
    success: errors.length === 0,
    message: `Configurações processadas. ${updates.length} atualizadas, ${errors.length} erros.`,
    updates,
    errors
  })
}
