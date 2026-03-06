import { NextResponse } from "next/server"
import { queryOne, query, buildUpdate } from "@/lib/db"

export async function GET() {
  try {
    // Buscar tema ativo da tabela system_themes
    const activeTheme = await queryOne(
      `SELECT * FROM system_themes WHERE is_active = true ORDER BY updated_at DESC LIMIT 1`
    )

    if (!activeTheme) {
      return NextResponse.json({
        success: true,
        theme: null,
      })
    }

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

    // Preparar dados do tema usando APENAS colunas que existem
    const themeName = body.systemName?.toLowerCase().replace(/\s+/g, "_") || "custom_theme"
    const colors = JSON.stringify({
      primary: body.primaryColor || "#3b82f6",
      secondary: body.secondaryColor || "#10b981",
      accent: body.accentColor || "#8b5cf6",
      background: "#ffffff",
      text: "#1e293b",
    })
    const now = new Date().toISOString()

    // Primeiro, desativar todos os temas existentes
    await query(
      `UPDATE system_themes SET is_active = false, is_default = false, updated_at = $1`,
      [now]
    )

    // Verificar se já existe um tema com o mesmo nome
    const existing = await queryOne(
      `SELECT id FROM system_themes WHERE name = $1`,
      [themeName]
    )

    if (existing) {
      // UPDATE se já existe
      const upd = buildUpdate(
        "system_themes",
        {
          display_name: body.systemName || "Custom Theme",
          description: body.description || "",
          colors,
          fonts: JSON.stringify({}),
          borders: JSON.stringify({}),
          logo_icon: body.logoIcon || "🤖",
          is_default: true,
          is_active: true,
          updated_at: now,
        },
        { name: themeName }
      )
      await query(upd.text, upd.values)
    } else {
      // INSERT se não existe
      await query(
        `INSERT INTO system_themes (name, display_name, description, colors, fonts, borders, logo_icon, is_default, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          themeName,
          body.systemName || "Custom Theme",
          body.description || "",
          colors,
          JSON.stringify({}),
          JSON.stringify({}),
          body.logoIcon || "🤖",
          true,
          true,
          now,
          now,
        ]
      )
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
