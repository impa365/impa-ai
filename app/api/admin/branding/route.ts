import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuração do servidor incompleta",
        },
        { status: 500 },
      )
    }

    // Buscar tema ativo da tabela system_themes
    const response = await fetch(
      `${supabaseUrl}/rest/v1/system_themes?select=*&is_active=eq.true&order=updated_at.desc&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        theme: null,
      })
    }

    const themes = await response.json()

    if (!Array.isArray(themes) || themes.length === 0) {
      return NextResponse.json({
        success: true,
        theme: null,
      })
    }

    const activeTheme = themes[0]

    // Converter para formato esperado pelo frontend
    const theme = {
      systemName: activeTheme.display_name || "Sistema AI",
      description: activeTheme.description || "",
      logoIcon: activeTheme.logo_icon || "🤖",
      primaryColor: activeTheme.colors?.primary || "#3b82f6",
      secondaryColor: activeTheme.colors?.secondary || "#10b981",
      accentColor: activeTheme.colors?.accent || "#8b5cf6",
      brandingEnabled: true,
    }

    return NextResponse.json({
      success: true,
      theme,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      theme: null,
      error: error.message,
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuração do servidor incompleta",
        },
        { status: 500 },
      )
    }

    // Preparar dados do tema usando APENAS colunas que existem
    const themeData = {
      name: body.systemName?.toLowerCase().replace(/\s+/g, "_") || "custom_theme",
      display_name: body.systemName || "Custom Theme",
      description: body.description || "",
      colors: {
        primary: body.primaryColor || "#3b82f6",
        secondary: body.secondaryColor || "#10b981",
        accent: body.accentColor || "#8b5cf6",
        background: "#ffffff",
        text: "#1e293b",
      },
      fonts: {},
      borders: {},
      logo_icon: body.logoIcon || "🤖",
      is_default: true,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    // Primeiro, desativar todos os temas existentes
    const deactivateResponse = await fetch(`${supabaseUrl}/rest/v1/system_themes`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
      body: JSON.stringify({
        is_active: false,
        is_default: false,
        updated_at: new Date().toISOString(),
      }),
    })

    if (!deactivateResponse.ok) {
      console.warn("Aviso: Não foi possível desativar temas existentes")
    }

    // Verificar se já existe um tema com o mesmo nome
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/system_themes?name=eq.${themeData.name}&select=id`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    })

    const existingThemes = await checkResponse.json()
    const exists = Array.isArray(existingThemes) && existingThemes.length > 0

    if (exists) {
      // UPDATE se já existe
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/system_themes?name=eq.${themeData.name}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
        body: JSON.stringify(themeData),
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`Erro ao atualizar tema: ${updateResponse.status} - ${errorText}`)
      }
    } else {
      // INSERT se não existe
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/system_themes`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
        body: JSON.stringify({
          ...themeData,
          created_at: new Date().toISOString(),
        }),
      })

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text()
        throw new Error(`Erro ao inserir tema: ${insertResponse.status} - ${errorText}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tema salvo com sucesso!",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao salvar tema: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
