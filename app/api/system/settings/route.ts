import { NextResponse } from "next/server"
import { queryMany, query } from '@/lib/db'

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

    // Buscar TODAS as configurações necessárias (públicas + admin settings)
    console.log("🔄 Fazendo requisição para system_settings...")

    const data = await queryMany<any>(
      `SELECT setting_key, setting_value FROM system_settings
       WHERE setting_key IN ($1, $2, $3, $4, $5, $6, $7) OR is_public = true`,
      [
        'footer_text',
        'system_name',
        'app_name',
        'allow_public_registration',
        'default_whatsapp_connections_limit',
        'default_agents_limit',
        'landing_page_enabled'
      ]
    )

    console.log("✅ Dados recebidos:", data)
    console.log("Tamanho:", data.length)

    // Converter array de configurações em objeto
    const settings: any = {}
    if (data.length > 0) {
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

  console.log("🔄 Fazendo update para:", setting_key)
  console.log("📝 Body do update:", { setting_value: settingValue })

  await query(
    "UPDATE system_settings SET setting_value = $1, updated_at = $2 WHERE setting_key = $3",
    [settingValue, new Date().toISOString(), setting_key]
  )

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
      // Tratamento consistente de tipos para JSONB
      let settingValue
      if (typeof value === 'boolean') {
        settingValue = value
        console.log(`   ✅ Boolean direto: ${settingValue}`)
      } else if (typeof value === 'number') {
        settingValue = value
        console.log(`   ✅ Number direto: ${settingValue}`)
      } else if (typeof value === 'string') {
        settingValue = JSON.stringify(value)
        console.log(`   ✅ String stringified: ${settingValue}`)
      } else {
        settingValue = JSON.stringify(value)
        console.log(`   ✅ Object/Array stringified: ${settingValue}`)
      }

      // LOG ESPECIAL para allow_public_registration
      if (key === 'allow_public_registration') {
        console.log(`🚨🚨🚨 ATENÇÃO: allow_public_registration`)
        console.log(`   Valor original do frontend:`, value)
        console.log(`   Tipo original:`, typeof value)
        console.log(`   Valor que será enviado ao DB:`, settingValue)
        console.log(`   Tipo que será enviado:`, typeof settingValue)
      }

      const { rowCount } = await query(
        "UPDATE system_settings SET setting_value = $1, updated_at = $2 WHERE setting_key = $3",
        [settingValue, new Date().toISOString(), key]
      )

      if (rowCount > 0) {
        updates.push(`${key}: atualizado`)
        console.log(`✅ ${key}: sucesso`)
      } else {
        console.warn(`⚠️ ${key}: nenhuma linha atualizada (setting_key não encontrada)`)
        errors.push(`${key}: não encontrada`)
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
