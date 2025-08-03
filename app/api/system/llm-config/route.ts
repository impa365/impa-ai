import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 API: /api/system/llm-config chamada")

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

    console.log("🔍 Buscando configurações de provedores LLM...")
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?select=setting_key,setting_value&setting_key=in.(available_llm_providers,default_model)`,
      { headers }
    )

    if (!settingsResponse.ok) {
      throw new Error("Erro ao buscar configurações do banco de dados")
    }

    let llmConfig = {
      available_providers: [] as string[],
      default_models: {} as Record<string, string>
    }

    const settings = await settingsResponse.json()
    console.log("🔍 [DEBUG] Resposta completa do Supabase:", JSON.stringify(settings, null, 2))
    
    if (!Array.isArray(settings)) {
      throw new Error("Resposta inesperada do banco de dados")
    }
    
    settings.forEach((setting: any) => {
      console.log("🔍 [DEBUG] Processando setting:", setting.setting_key)
      console.log("🔍 [DEBUG] Valor bruto:", setting.setting_value)
      console.log("🔍 [DEBUG] Tipo do valor:", typeof setting.setting_value)
      
        switch (setting.setting_key) {
          case 'available_llm_providers':
          console.log("🔍 [DEBUG] Processando available_llm_providers...")
          
          // Se já for um array, usar diretamente
          if (Array.isArray(setting.setting_value)) {
            llmConfig.available_providers = setting.setting_value
            console.log("✅ [DEBUG] Providers já parseados:", setting.setting_value)
          } 
          // Se for string, verificar se é JSON ou lista separada por vírgulas
          else if (typeof setting.setting_value === 'string') {
            try {
              // Tentar fazer parse como JSON primeiro
              const providers = JSON.parse(setting.setting_value)
              if (!Array.isArray(providers)) throw new Error("available_llm_providers não é array")
              llmConfig.available_providers = providers
              console.log("✅ [DEBUG] Providers parseados como JSON:", providers)
            } catch (jsonError) {
              // Se falhar o parse JSON, tratar como string separada por vírgulas
              const providers = setting.setting_value.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
              llmConfig.available_providers = providers
              console.log("✅ [DEBUG] Providers parseados como CSV:", providers)
            }
          } else {
            throw new Error("available_llm_providers em formato inválido")
          }
            break
          
          case 'default_model':
          console.log("🔍 [DEBUG] Processando default_model...")
          
          // Se já for um objeto, usar diretamente
          if (typeof setting.setting_value === 'object' && setting.setting_value !== null && !Array.isArray(setting.setting_value)) {
            llmConfig.default_models = setting.setting_value
            console.log("✅ [DEBUG] Models já parseados:", setting.setting_value)
          } 
          // Se for string, fazer parse
          else if (typeof setting.setting_value === 'string') {
            const modelsData = JSON.parse(setting.setting_value)
            if (typeof modelsData !== 'object' || modelsData === null) throw new Error("default_model não é objeto")
            llmConfig.default_models = modelsData
            console.log("✅ [DEBUG] Models parseados de string:", modelsData)
          } else {
            throw new Error("default_model em formato inválido")
          }
            break
      }
    })

    if (!llmConfig.available_providers.length || !Object.keys(llmConfig.default_models).length) {
      throw new Error("Configuração incompleta no banco de dados")
    }

    console.log("✅ Configurações LLM carregadas:", llmConfig)
    return NextResponse.json({
      success: true,
      config: llmConfig,
    })
  } catch (error: any) {
    console.error("❌ Erro na API system/llm-config:", error.message)
    console.error("❌ Stack trace completo:", error.stack)
    return NextResponse.json({
      success: false,
      error: error.message || "Erro desconhecido ao buscar configurações LLM"
    }, { status: 500 })
  }
} 