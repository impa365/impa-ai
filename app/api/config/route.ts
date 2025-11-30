import { NextResponse } from "next/server"

// Cache simples para evitar consultas desnecessárias
let configCache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 30 * 1000 // 30 segundos (sincronizado com /api/system/settings)

export async function GET() {
  console.log("=== /api/config - Iniciando requisição ===")
  
  try {
    // Verificar cache primeiro
    const now = Date.now()
    if (configCache && (now - configCache.timestamp) < CACHE_TTL) {
      console.log("✅ Cache válido encontrado, retornando dados em cache")
      return NextResponse.json(configCache.data)
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    console.log("📋 Verificando variáveis de ambiente:")
    console.log("SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "❌ NÃO ENCONTRADA")
    console.log("SUPABASE_ANON_KEY:", supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "❌ NÃO ENCONTRADA")

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ ERRO: Variáveis de ambiente não configuradas!")
      return NextResponse.json({ error: "Configuração do servidor inválida" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    console.log("🔄 Fazendo requisição para system_themes...")
    console.log("URL:", `${supabaseUrl}/rest/v1/system_themes?is_active=eq.true&order=is_default.desc,created_at.desc`)

    // Buscar apenas system_themes como fonte única de verdade
    // Priorizar: is_default=true AND is_active=true, depois apenas is_active=true
    const themeResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_themes?is_active=eq.true&order=is_default.desc,created_at.desc`, 
      { headers }
    )

    console.log("📡 Resposta da requisição system_themes:")
    console.log("Status:", themeResponse.status)
    console.log("StatusText:", themeResponse.statusText)
    console.log("OK:", themeResponse.ok)

    if (!themeResponse.ok) {
      const errorText = await themeResponse.text()
      console.error("❌ ERRO na requisição system_themes:")
      console.error("Body:", errorText)
      return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 })
    }

    const themes = await themeResponse.json()
    console.log("✅ Temas encontrados:", themes.length)
    console.log("Primeiro tema:", themes[0] ? themes[0].name : "Nenhum")
    
    if (!themes || themes.length === 0) {
      console.error("❌ ERRO: Nenhum tema ativo encontrado no banco")
      return NextResponse.json({ error: "Nenhum tema ativo encontrado" }, { status: 404 })
    }

    // Pegar o primeiro tema (que será o default se existir, senão o mais recente ativo)
    const activeTheme = themes[0]
    console.log("🎨 Tema ativo selecionado:", activeTheme.name)

    const themeData = {
      systemName: activeTheme.display_name || activeTheme.name,
      description: activeTheme.description || "Sistema de gestão",
      logoIcon: activeTheme.logo_icon || "🤖",
      primaryColor: activeTheme.colors?.primary || "#3b82f6",
      secondaryColor: activeTheme.colors?.secondary || "#10b981",
      accentColor: activeTheme.colors?.accent || "#8b5cf6",
      textColor: activeTheme.colors?.text,
      backgroundColor: activeTheme.colors?.background,
      fontFamily: activeTheme.fonts?.primary,
      borderRadius: activeTheme.borders?.radius,
      customCss: activeTheme.custom_css,
    }

    console.log("🔄 Fazendo requisição para system_settings...")
    // Buscar configuração de cadastro público do banco de dados
    // Usar rpc/function do Supabase para contornar RLS
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/is_public_registration_allowed`, 
      { 
        method: 'POST',
        headers 
      }
    )

    console.log("📡 Resposta da requisição system_settings:")
    console.log("Status:", settingsResponse.status)
    console.log("StatusText:", settingsResponse.statusText)
    console.log("OK:", settingsResponse.ok)

    let allowPublicRegistration = false // Padrão seguro
    if (settingsResponse.ok) {
      const result = await settingsResponse.json()
      console.log("✅ Settings result:", result)
      // A função retorna boolean direto
      allowPublicRegistration = result === true
      console.log("🔧 Allow public registration:", allowPublicRegistration)
    } else {
      const errorText = await settingsResponse.text()
      console.error("⚠️ AVISO: Erro ao buscar settings (continuando com padrão):")
      console.error("Body:", errorText)
    }

    const settings = {
      allowPublicRegistration: allowPublicRegistration,
    }

    const apiResponse = {
      theme: themeData,
      settings: settings,
    }

    // Atualizar cache
    configCache = {
      data: apiResponse,
      timestamp: now
    }

    console.log("✅ /api/config - Sucesso! Retornando dados")
    return NextResponse.json(apiResponse)
    
  } catch (error: any) {
    console.error("💥 ERRO FATAL em /api/config:")
    console.error("Tipo:", error.constructor.name)
    console.error("Mensagem:", error.message)
    console.error("Stack:", error.stack)
    
    // Em caso de erro, retornar erro sem fallback hardcoded
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
