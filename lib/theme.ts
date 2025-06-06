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
    // Buscar o tema ativo (usando apenas o nome da tabela, schema já configurado no cliente)
    const { data, error } = await supabase.from("system_themes").select("*").eq("is_active", true).limit(1)

    if (error) {
      console.error("Error loading theme:", error)
      return defaultTheme
    }

    // Se não encontrar tema ativo, tenta buscar o tema padrão
    if (!data || data.length === 0) {
      const { data: defaultData, error: defaultError } = await supabase
        .from("system_themes")
        .select("*")
        .eq("is_default", true)
        .limit(1)

      if (defaultError || !defaultData || defaultData.length === 0) {
        console.log("No theme configuration found, using default theme")
        return defaultTheme
      }

      return mapThemeDataToConfig(defaultData[0])
    }

    // Usar o tema ativo encontrado
    return mapThemeDataToConfig(data[0])
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
  try {
    // Verificar se já existe um tema com o mesmo nome
    const themeName = theme.systemName.toLowerCase().replace(/\s+/g, "_")

    const { data: existingData } = await supabase.from("system_themes").select("id").eq("name", themeName).limit(1)

    const colors = {
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      accent: theme.accentColor,
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#1E293B",
      border: "#E2E8F0",
    }

    if (existingData && existingData.length > 0) {
      // Atualizar tema existente
      const { error } = await supabase
        .from("system_themes")
        .update({
          display_name: theme.systemName,
          description: theme.description,
          colors: colors,
          preview_image_url: theme.logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData[0].id)

      if (error) {
        console.error("Error updating theme:", error)
        return false
      }
    } else {
      // Criar novo tema
      const { error } = await supabase.from("system_themes").insert({
        name: themeName,
        display_name: theme.systemName,
        description: theme.description,
        colors: colors,
        preview_image_url: theme.logoUrl,
        is_default: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error creating theme:", error)
        return false
      }
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
