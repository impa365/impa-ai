import { NextResponse } from "next/server"

// Cache simples em memória para otimização
let cachedSettings: { settings: any; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 segundos

export async function GET() {
  console.log("=== /api/system/settings - Iniciando requisição ===")
  
  try {
    // Verificar cache primeiro para performance máxima
    if (cachedSettings && Date.now() - cachedSettings.timestamp < CACHE_DURATION) {
      console.log("✅ Cache válido encontrado, retornando dados em cache")
      return NextResponse.json({
        success: true,
        settings: cachedSettings.settings
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    console.log("📋 Verificando variáveis de ambiente:")
    console.log("SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "❌ NÃO ENCONTRADA")
    console.log("SUPABASE_ANON_KEY:", supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "❌ NÃO ENCONTRADA")

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ ERRO: Variáveis de ambiente não configuradas!")
      return NextResponse.json({
        success: false,
        error: "Configuração do banco não encontrada"
      }, { status: 500 })
    }

    // Buscar TODAS as configurações necessárias (públicas + admin settings)
    const queryUrl = `${supabaseUrl}/rest/v1/system_settings?select=setting_key,setting_value&or=(setting_key.eq.footer_text,setting_key.eq.system_name,setting_key.eq.app_name,setting_key.eq.allow_public_registration,setting_key.eq.default_whatsapp_connections_limit,setting_key.eq.default_agents_limit,setting_key.eq.landing_page_enabled,is_public.eq.true)`
    
    console.log("🔄 Fazendo requisição para system_settings...")
    console.log("URL:", queryUrl)

    // Buscar apenas configurações públicas ou específicas necessárias
    const response = await fetch(queryUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'impaai',
          'Content-Profile': 'impaai'
        }
      }
    )

    console.log("📡 Resposta da requisição system_settings:")
    console.log("Status:", response.status)
    console.log("StatusText:", response.statusText)
    console.log("OK:", response.ok)
    console.log("Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ ERRO na requisição system_settings:")
      console.error("Status:", response.status)
      console.error("Body:", errorText)
      throw new Error(`Erro na consulta: ${response.status}`)
    }

    const data = await response.json()
    console.log("✅ Dados recebidos:", data)
    console.log("Tipo:", typeof data)
    console.log("É array:", Array.isArray(data))
    console.log("Tamanho:", data.length)

    // Converter array de configurações em objeto
    const settings: any = {}
    if (Array.isArray(data) && data.length > 0) {
      console.log("🔄 Processando configurações...")
      data.forEach((setting: any, index: number) => {
        console.log(`Setting ${index}:`, setting)
        try {
          const value = setting.setting_value
          // Se já é boolean, manter como boolean
          if (typeof value === 'boolean') {
            settings[setting.setting_key] = value
            console.log(`✅ ${setting.setting_key}: boolean direto`)
          } else if (typeof value === 'string') {
            // Para strings, tentar parse JSON
            try {
              settings[setting.setting_key] = JSON.parse(value)
              console.log(`✅ ${setting.setting_key}: JSON parsed`)
            } catch {
              // Se parse falhar, tratar strings especiais boolean
              if (value.toLowerCase() === 'true') {
                settings[setting.setting_key] = true
              } else if (value.toLowerCase() === 'false') {
                settings[setting.setting_key] = false
              } else {
                settings[setting.setting_key] = value
              }
              console.log(`📝 ${setting.setting_key}: string convertida`)
            }
          } else {
            // Outros tipos (number, object, etc)
            settings[setting.setting_key] = value
            console.log(`📝 ${setting.setting_key}: valor direto`)
          }
        } catch {
          settings[setting.setting_key] = setting.setting_value
          console.log(`⚠️ ${setting.setting_key}: erro no parse, usando valor direto`)
        }
      })
    } else {
      console.log("⚠️ Nenhuma configuração encontrada ou dados inválidos")
    }

    console.log("🎯 Settings finais:", settings)
    
    // LOG ESPECIAL para allow_public_registration
    if ('allow_public_registration' in settings) {
      console.log("🚨🚨🚨 [GET] allow_public_registration no settings final:")
      console.log("   Valor:", settings.allow_public_registration)
      console.log("   Tipo:", typeof settings.allow_public_registration)
      console.log("   Boolean():", Boolean(settings.allow_public_registration))
    } else {
      console.log("⚠️ [GET] allow_public_registration NÃO está presente nos settings!")
    }

    // Atualizar cache
    cachedSettings = {
      settings,
      timestamp: Date.now()
    }

    console.log("✅ /api/system/settings - Sucesso! Retornando dados")
    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error: any) {
    console.error("💥 ERRO FATAL em /api/system/settings:")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
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
  console.log("=== /api/system/settings POST - Iniciando requisição ===")
  
  try {
    const body = await request.json()
    console.log("📝 Body recebido:", body)
    
    // Verificar se é uma configuração individual ou múltiplas
    if (body.setting_key && body.setting_value !== undefined) {
      console.log("🔧 Configuração individual detectada")
      // Configuração individual (usado pela landing page)
      return await updateSingleSetting(body.setting_key, body.setting_value)
    } else {
      console.log("🔧 Múltiplas configurações detectadas")
      // Múltiplas configurações (usado pelo admin panel)
      return await updateMultipleSettings(body)
    }

  } catch (error: any) {
    console.error("💥 ERRO FATAL em /api/system/settings POST:")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}

// Função para atualizar uma configuração individual
async function updateSingleSetting(setting_key: string, setting_value: any) {
  console.log(`🔧 updateSingleSetting: ${setting_key} = ${setting_value}`)
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  console.log("📋 Verificando variáveis de ambiente para update:")
  console.log("SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "❌ NÃO ENCONTRADA")
  console.log("SUPABASE_ANON_KEY:", supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "❌ NÃO ENCONTRADA")

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: Variáveis de ambiente para update não configuradas!")
    return NextResponse.json({
      success: false,
      error: "Configuração do banco não encontrada"
    }, { status: 500 })
  }

  const updateUrl = `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.${setting_key}`
  
  // Para booleans, salvar como boolean real (JSONB aceita)
  // Para outros tipos, manter como estão (JSONB é flexível)
  let settingValue
  if (typeof setting_value === 'boolean') {
    // Boolean direto - JSONB aceita nativamente
    settingValue = setting_value
  } else if (typeof setting_value === 'number') {
    // Number direto - JSONB aceita nativamente
    settingValue = setting_value
  } else if (typeof setting_value === 'string') {
    // String: manter como JSON string
    settingValue = JSON.stringify(setting_value)
  } else {
    // Objetos e arrays: stringify
    settingValue = JSON.stringify(setting_value)
  }
  
  const updateBody = {
    setting_value: settingValue,
    updated_at: new Date().toISOString()
  }

  console.log("🔄 Fazendo update para:", updateUrl)
  console.log("📝 Body do update:", updateBody)

  // Atualizar configuração
  const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'impaai',
        'Content-Profile': 'impaai',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updateBody)
    }
  )

  console.log("📡 Resposta do update:")
  console.log("Status:", response.status)
  console.log("StatusText:", response.statusText)
  console.log("OK:", response.ok)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("❌ ERRO no update:")
    console.error("Body:", errorText)
    throw new Error(`Erro ao atualizar: ${response.status}`)
  }

  // Limpar cache
  cachedSettings = null
  console.log("🗑️ Cache limpo")

  console.log("✅ updateSingleSetting - Sucesso!")
  return NextResponse.json({
    success: true,
    message: "Configuração atualizada com sucesso"
  })
}

// Função para atualizar múltiplas configurações
async function updateMultipleSettings(settings: any) {
  console.log("🔧 updateMultipleSettings:", settings)
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  console.log("📋 Verificando variáveis de ambiente para updates múltiplos:")
  console.log("SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "❌ NÃO ENCONTRADA")
  console.log("SUPABASE_ANON_KEY:", supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "❌ NÃO ENCONTRADA")

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: Variáveis de ambiente para updates múltiplos não configuradas!")
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

    console.log(`🔄 Processando: ${key} = ${value}`)
    console.log(`   Tipo recebido:`, typeof value)
    console.log(`   Valor bruto:`, JSON.stringify(value))

    try {
      const updateUrl = `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.${key}`
      
      // Tratamento consistente de tipos para JSONB
      let settingValue
      if (typeof value === 'boolean') {
        // Boolean direto - JSONB aceita nativamente
        settingValue = value
        console.log(`   ✅ Boolean direto: ${settingValue}`)
      } else if (typeof value === 'number') {
        // Number direto - JSONB aceita nativamente
        settingValue = value
        console.log(`   ✅ Number direto: ${settingValue}`)
      } else if (typeof value === 'string') {
        // String: manter como JSON string
        settingValue = JSON.stringify(value)
        console.log(`   ✅ String stringified: ${settingValue}`)
      } else {
        // Objetos e arrays: stringify
        settingValue = JSON.stringify(value)
        console.log(`   ✅ Object/Array stringified: ${settingValue}`)
      }
      
      const updateBody = {
        setting_value: settingValue,
        updated_at: new Date().toISOString()
      }

      console.log(`📡 Update URL: ${updateUrl}`)
      console.log(`📝 Update Body:`, JSON.stringify(updateBody, null, 2))
      
      // LOG ESPECIAL para allow_public_registration
      if (key === 'allow_public_registration') {
        console.log(`🚨🚨🚨 ATENÇÃO: allow_public_registration`)
        console.log(`   Valor original do frontend:`, value)
        console.log(`   Tipo original:`, typeof value)
        console.log(`   Valor que será enviado ao DB:`, settingValue)
        console.log(`   Tipo que será enviado:`, typeof settingValue)
      }

      const response = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Accept-Profile': 'impaai',
            'Content-Profile': 'impaai',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(updateBody)
        }
      )

      console.log(`📡 Resposta para ${key}:`, response.status, response.statusText)

      if (response.ok) {
        updates.push(`${key}: atualizado`)
        console.log(`✅ ${key}: sucesso`)
      } else {
        const errorText = await response.text()
        console.error(`❌ ${key}: erro ${response.status}`)
        console.error(`Body:`, errorText)
        errors.push(`${key}: erro ${response.status}`)
      }
    } catch (error: any) {
      console.error(`💥 ${key}: erro de conexão`, error)
      errors.push(`${key}: erro de conexão`)
    }
  }

  // Limpar cache
  cachedSettings = null
  console.log("🗑️ Cache limpo após updates múltiplos")

  const result = {
    success: errors.length === 0,
    message: `Configurações processadas. ${updates.length} atualizadas, ${errors.length} erros.`,
    updates,
    errors
  }

  console.log("✅ updateMultipleSettings - Resultado final:", result)

  return NextResponse.json(result)
}
