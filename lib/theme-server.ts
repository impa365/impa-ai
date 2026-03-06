// Server-only theme functions (uses pg, cannot be imported in client components)
import { queryOne, query as dbQuery } from "@/lib/db"
import type { ThemeConfig } from "@/lib/theme"
import { defaultTheme } from "@/lib/theme"

// Função para carregar o tema do banco de dados (para uso no servidor)
export async function loadThemeFromDatabase(): Promise<ThemeConfig | null> {
  try {
    console.log("🎨 Loading theme from database...")

    const data = await queryOne<any>(
      `SELECT * FROM system_themes WHERE is_active = true LIMIT 1`
    )

    if (!data) {
      console.log("ℹ️ Nenhum tema ativo encontrado, usando tema padrão")
      return null
    }

    // Mapear os dados do banco para o formato ThemeConfig
    const theme: ThemeConfig = {
      systemName: data.display_name || defaultTheme.systemName,
      description: data.description || defaultTheme.description,
      logoIcon: data.logo_icon || defaultTheme.logoIcon,
      primaryColor: data.colors?.primary || defaultTheme.primaryColor,
      secondaryColor: data.colors?.secondary || defaultTheme.secondaryColor,
      accentColor: data.colors?.accent || defaultTheme.accentColor,
      textColor: data.colors?.text,
      backgroundColor: data.colors?.background,
      fontFamily: data.fonts?.primary,
      borderRadius: data.borders?.radius,
      customCss: data.custom_css,
    }

    console.log("✅ Theme loaded successfully:", theme.systemName)
    return theme
  } catch (error) {
    console.error("❌ Erro ao carregar tema do banco:", error)
    return null
  }
}

// Função para salvar o tema no banco de dados (para uso no servidor)
export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    console.log("💾 Saving theme to database:", theme.systemName)

    // Verificar se já existe um tema ativo
    const existingTheme = await queryOne<{ id: string }>(
      `SELECT id FROM system_themes WHERE is_active = true LIMIT 1`
    )

    // Preparar os dados para salvar
    const themeData = {
      name: theme.systemName.toLowerCase().replace(/\s+/g, "_"),
      display_name: theme.systemName,
      description: theme.description || "Tema personalizado",
      colors: JSON.stringify({
        primary: theme.primaryColor,
        secondary: theme.secondaryColor,
        accent: theme.accentColor,
        text: theme.textColor,
        background: theme.backgroundColor,
      }),
      fonts: JSON.stringify({
        primary: theme.fontFamily,
      }),
      borders: JSON.stringify({
        radius: theme.borderRadius,
      }),
      custom_css: theme.customCss,
      is_default: false,
      is_active: true,
      logo_icon: theme.logoIcon,
    }

    if (existingTheme) {
      // Atualizar tema existente
      await dbQuery(
        `UPDATE system_themes
         SET name = $1, display_name = $2, description = $3, colors = $4, fonts = $5,
             borders = $6, custom_css = $7, is_default = $8, is_active = $9, logo_icon = $10
         WHERE id = $11`,
        [
          themeData.name, themeData.display_name, themeData.description,
          themeData.colors, themeData.fonts, themeData.borders,
          themeData.custom_css, themeData.is_default, themeData.is_active,
          themeData.logo_icon, existingTheme.id
        ]
      )
    } else {
      // Criar novo tema
      await dbQuery(
        `INSERT INTO system_themes (name, display_name, description, colors, fonts, borders, custom_css, is_default, is_active, logo_icon)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          themeData.name, themeData.display_name, themeData.description,
          themeData.colors, themeData.fonts, themeData.borders,
          themeData.custom_css, themeData.is_default, themeData.is_active,
          themeData.logo_icon
        ]
      )
    }

    console.log("✅ Theme saved successfully")
    return true
  } catch (error) {
    console.error("❌ Erro ao salvar tema no banco:", error)
    return false
  }
}
