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
    // Usar explicitamente o schema impaai e a tabela system_themes
    const { data, error } = await supabase.from("impaai.system_themes").select("*").eq("is_default", true).limit(1)

    if (error) {
      console.error("Error loading theme:", error)
      return defaultTheme
    }

    // Se não encontrar tema padrão, tenta qualquer tema ativo
    if (!data || data.length === 0) {
      const { data: activeTheme, error: activeError } = await supabase
        .from("impaai.system_themes")
        .select("*")
        .eq("is_active", true)
        .limit(1)

      if (activeError || !activeTheme || activeTheme.length === 0) {
        console.log("No theme configuration found, using default theme")
        return defaultTheme
      }

      return mapThemeFromDatabase(activeTheme[0])
    }

    return mapThemeFromDatabase(data[0])
  } catch (error) {
    console.error("Error loading theme from database:", error)
    return defaultTheme
  }
}

// Função auxiliar para mapear os campos do banco para o formato ThemeConfig
function mapThemeFromDatabase(themeData: any): ThemeConfig {
  // Extrair cores do JSON
  const colors = themeData.colors || {}

  return {
    systemName: themeData.display_name || defaultTheme.systemName,
    description: themeData.description || defaultTheme.description,
    logoIcon: defaultTheme.logoIcon, // Usar o padrão já que não temos esse campo
    primaryColor: colors.primary || defaultTheme.primaryColor,
    secondaryColor: colors.secondary || defaultTheme.secondaryColor,
    accentColor: colors.accent || defaultTheme.accentColor,
    logoUrl: themeData.preview_image_url,
    faviconUrl: undefined,
    sidebarStyle: defaultTheme.sidebarStyle,
    brandingEnabled: true,
  }
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    // Verificar se existe um tema padrão
    const { data: existingData } = await supabase
      .from("impaai.system_themes")
      .select("id")
      .eq("is_default", true)
      .limit(1)

    let themeId: string

    if (existingData && existingData.length > 0) {
      // Usar ID existente
      themeId = existingData[0].id
    } else {
      // Gerar novo ID
      themeId = crypto.randomUUID()
    }

    // Preparar objeto de cores
    const colors = {
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      accent: theme.accentColor,
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#1E293B",
      border: "#E2E8F0",
    }

    // Salvar no banco
    const { error } = await supabase.from("impaai.system_themes").upsert({
      id: themeId,
      name: "custom",
      display_name: theme.systemName,
      description: theme.description,
      colors: colors,
      preview_image_url: theme.logoUrl,
      is_default: true,
      is_active: true,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving theme:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error saving theme to database:", error)
    return false
  }
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
