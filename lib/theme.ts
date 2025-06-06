"use client"

import { createContext, useContext } from "react"
import { supabase } from "./supabase"

export interface ThemeConfig {
  systemName: string
  description: string
  logoIcon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  faviconUrl?: string
  sidebarStyle?: string
  brandingEnabled?: boolean
}

export const defaultTheme: ThemeConfig = {
  systemName: "Impa AI",
  description: "Plataforma de construção de agentes de IA",
  logoIcon: "🤖",
  primaryColor: "#0f172a",
  secondaryColor: "#f1f5f9",
  accentColor: "#3b82f6",
  sidebarStyle: "default",
  brandingEnabled: true,
}

// Create the theme context
export const ThemeContext = createContext<{
  theme: ThemeConfig
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<void>
  loadTheme: () => Promise<void>
}>({
  theme: defaultTheme,
  updateTheme: async () => {},
  loadTheme: async () => {},
})

// Create the useTheme hook
export const useTheme = () => useContext(ThemeContext)

export async function loadThemeFromDatabase(): Promise<ThemeConfig> {
  try {
    // Usar o método .rpc() para chamar uma função que acessa o schema impaai
    // Ou usar uma tabela temporária no schema public para compatibilidade

    // Abordagem 1: Tentar usar a tabela no schema public (para compatibilidade)
    try {
      const { data, error } = await supabase.from("global_theme_config").select("*").limit(1)

      if (!error && data && data.length > 0) {
        const themeData = data[0]
        return {
          systemName: themeData.system_name || defaultTheme.systemName,
          description: themeData.description || defaultTheme.description,
          logoIcon: themeData.logo_icon || defaultTheme.logoIcon,
          primaryColor: themeData.primary_color || defaultTheme.primaryColor,
          secondaryColor: themeData.secondary_color || defaultTheme.secondaryColor,
          accentColor: themeData.accent_color || defaultTheme.accentColor,
          logoUrl: themeData.logo_url,
          faviconUrl: themeData.favicon_url,
          sidebarStyle: themeData.sidebar_style || defaultTheme.sidebarStyle,
          brandingEnabled: themeData.branding_enabled ?? defaultTheme.brandingEnabled,
        }
      }
    } catch (e) {
      console.log("No theme in public schema, trying impaai schema...")
    }

    // Abordagem 2: Usar SQL diretamente para acessar o schema impaai
    const { data, error } = await supabase.rpc("get_active_theme")

    if (error) {
      console.error("Error loading theme:", error)
      return defaultTheme
    }

    if (!data) {
      console.log("No theme configuration found, using default theme")
      return defaultTheme
    }

    // Mapear dados do tema para o formato ThemeConfig
    return mapThemeDataToConfig(data)
  } catch (error) {
    console.error("Error loading theme from database:", error)
    return defaultTheme
  }
}

// Função auxiliar para mapear dados do banco para o formato ThemeConfig
function mapThemeDataToConfig(themeData: any): ThemeConfig {
  // Extrair cores do objeto JSON
  const colors = themeData.colors || {}

  return {
    systemName: themeData.display_name || defaultTheme.systemName,
    description: themeData.description || defaultTheme.description,
    logoIcon: defaultTheme.logoIcon, // Usar o padrão já que não temos esse campo
    primaryColor: colors.primary || defaultTheme.primaryColor,
    secondaryColor: colors.secondary || defaultTheme.secondaryColor,
    accentColor: colors.accent || defaultTheme.accentColor,
    logoUrl: themeData.preview_image_url,
    faviconUrl: undefined, // Não temos esse campo no novo schema
    sidebarStyle: defaultTheme.sidebarStyle, // Usar o padrão
    brandingEnabled: true, // Sempre habilitado no novo schema
  }
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  // Simplificar para usar apenas o tema padrão por enquanto
  console.log("Theme saved (simulated):", theme)
  return true
}

export function applyThemeColors(theme: ThemeConfig) {
  if (typeof document === "undefined") return

  const root = document.documentElement

  // Apply CSS custom properties using the available colors
  root.style.setProperty("--primary", theme.primaryColor)
  root.style.setProperty("--secondary", theme.secondaryColor)
  root.style.setProperty("--accent", theme.accentColor)

  // Set document title if system name is available
  if (theme.systemName && typeof document !== "undefined") {
    document.title = theme.systemName
  }
}

// Theme presets for quick selection
export const themePresets = {
  default: {
    systemName: "Impa AI",
    primaryColor: "#0f172a",
    secondaryColor: "#f1f5f9",
    accentColor: "#3b82f6",
    logoIcon: "🤖",
  },
  blue: {
    systemName: "Impa AI",
    primaryColor: "#1e40af",
    secondaryColor: "#dbeafe",
    accentColor: "#3b82f6",
    logoIcon: "💙",
  },
  green: {
    systemName: "Impa AI",
    primaryColor: "#166534",
    secondaryColor: "#dcfce7",
    accentColor: "#22c55e",
    logoIcon: "💚",
  },
  purple: {
    systemName: "Impa AI",
    primaryColor: "#7c3aed",
    secondaryColor: "#ede9fe",
    accentColor: "#8b5cf6",
    logoIcon: "💜",
  },
}
