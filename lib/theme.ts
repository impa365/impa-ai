"use client"

import { createContext, useContext } from "react"
import { supabase } from "./supabase"

export interface ThemeConfig {
  id?: string
  systemName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoIcon: string
  sidebarStyle: "light" | "dark"
  brandingEnabled: boolean
}

export const defaultTheme: ThemeConfig = {
  systemName: "Impa AI",
  primaryColor: "#2563eb", // blue-600
  secondaryColor: "#10b981", // green-500
  accentColor: "#8b5cf6", // purple-500
  logoIcon: "🤖",
  sidebarStyle: "light",
  brandingEnabled: true,
}

export const ThemeContext = createContext<{
  theme: ThemeConfig
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<void>
  loadTheme: () => Promise<void>
}>({
  theme: defaultTheme,
  updateTheme: async () => {},
  loadTheme: async () => {},
})

export const useTheme = () => useContext(ThemeContext)

// Função para aplicar cores CSS customizadas
export const applyThemeColors = (theme: ThemeConfig) => {
  const root = document.documentElement
  root.style.setProperty("--primary-color", theme.primaryColor)
  root.style.setProperty("--secondary-color", theme.secondaryColor)
  root.style.setProperty("--accent-color", theme.accentColor)
}

// Função para carregar tema do banco de dados
export const loadThemeFromDatabase = async (): Promise<ThemeConfig> => {
  try {
    const { data, error } = await supabase
      .from("global_theme_config")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.log("Usando tema padrão")
      return defaultTheme
    }

    return {
      id: data.id,
      systemName: data.system_name,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      accentColor: data.accent_color,
      logoIcon: data.logo_icon,
      sidebarStyle: data.sidebar_style as "light" | "dark",
      brandingEnabled: data.branding_enabled,
    }
  } catch (error) {
    console.error("Erro ao carregar tema:", error)
    return defaultTheme
  }
}

// Função para salvar tema no banco de dados
export const saveThemeToDatabase = async (theme: Partial<ThemeConfig>): Promise<void> => {
  try {
    // Primeiro, verificar se já existe uma configuração
    const { data: existing } = await supabase
      .from("global_theme_config")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const themeData = {
      system_name: theme.systemName,
      primary_color: theme.primaryColor,
      secondary_color: theme.secondaryColor,
      accent_color: theme.accentColor,
      logo_icon: theme.logoIcon,
      sidebar_style: theme.sidebarStyle,
      branding_enabled: theme.brandingEnabled,
    }

    if (existing) {
      // Atualizar configuração existente
      const { error } = await supabase.from("global_theme_config").update(themeData).eq("id", existing.id)

      if (error) throw error
    } else {
      // Criar nova configuração
      const { error } = await supabase.from("global_theme_config").insert([themeData])

      if (error) throw error
    }
  } catch (error) {
    console.error("Erro ao salvar tema:", error)
    throw error
  }
}

// Predefinições de temas
export const themePresets = {
  blue: {
    systemName: "Impa AI",
    primaryColor: "#2563eb",
    secondaryColor: "#10b981",
    accentColor: "#8b5cf6",
    logoIcon: "🤖",
  },
  green: {
    systemName: "Impa AI",
    primaryColor: "#059669",
    secondaryColor: "#2563eb",
    accentColor: "#f59e0b",
    logoIcon: "🌱",
  },
  purple: {
    systemName: "Impa AI",
    primaryColor: "#7c3aed",
    secondaryColor: "#ec4899",
    accentColor: "#06b6d4",
    logoIcon: "💜",
  },
  orange: {
    systemName: "Impa AI",
    primaryColor: "#ea580c",
    secondaryColor: "#dc2626",
    accentColor: "#7c2d12",
    logoIcon: "🔥",
  },
}
