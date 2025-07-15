import { NextResponse } from "next/server"

// Cache simples para evitar consultas desnecessárias
let configCache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function GET() {
  try {
    // Verificar cache primeiro
    const now = Date.now()
    if (configCache && (now - configCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(configCache.data)
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor inválida" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Buscar apenas system_themes como fonte única de verdade
    // Priorizar: is_default=true AND is_active=true, depois apenas is_active=true
    const themeResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_themes?is_active=eq.true&order=is_default.desc,created_at.desc`, 
      { headers }
    )

    if (!themeResponse.ok) {
      return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 })
    }

    const themes = await themeResponse.json()
    
    if (!themes || themes.length === 0) {
      return NextResponse.json({ error: "Nenhum tema ativo encontrado" }, { status: 404 })
    }

    // Pegar o primeiro tema (que será o default se existir, senão o mais recente ativo)
    const activeTheme = themes[0]

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

    // Configurações fixas que não precisam vir do banco
    const settings = {
      allowPublicRegistration: false, // Por segurança, manter sempre false
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

    return NextResponse.json(apiResponse)
    
  } catch (error: any) {
    // Em caso de erro, retornar erro sem fallback hardcoded
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
