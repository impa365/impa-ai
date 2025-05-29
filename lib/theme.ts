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
  systemName: "Luna AI",
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
    // First, try to get the first available theme configuration
    const { data, error } = await supabase.from("global_theme_config").select("*").limit(1)

    if (error) {
      console.error("Error loading theme:", error)
      return defaultTheme
    }

    // If no data found, return default theme
    if (!data || data.length === 0) {
      console.log("No theme configuration found, using default theme")
      return defaultTheme
    }

    // Use the first row found
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
  } catch (error) {
    console.error("Error loading theme from database:", error)
    return defaultTheme
  }
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    // First, check if any theme configuration exists
    const { data: existingData } = await supabase.from("global_theme_config").select("id").limit(1)

    let themeId: string

    if (existingData && existingData.length > 0) {
      // Use existing ID
      themeId = existingData[0].id
    } else {
      // Generate new ID
      themeId = "550e8400-e29b-41d4-a716-446655440000"
    }

    const { error } = await supabase.from("global_theme_config").upsert({
      id: themeId,
      system_name: theme.systemName,
      description: theme.description,
      logo_icon: theme.logoIcon,
      primary_color: theme.primaryColor,
      secondary_color: theme.secondaryColor,
      accent_color: theme.accentColor,
      logo_url: theme.logoUrl,
      favicon_url: theme.faviconUrl,
      sidebar_style: theme.sidebarStyle,
      branding_enabled: theme.brandingEnabled,
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
    systemName: "Luna AI",
    primaryColor: "#0f172a",
    secondaryColor: "#f1f5f9",
    accentColor: "#3b82f6",
    logoIcon: "🤖",
  },
  blue: {
    systemName: "Luna AI",
    primaryColor: "#1e40af",
    secondaryColor: "#dbeafe",
    accentColor: "#3b82f6",
    logoIcon: "💙",
  },
  green: {
    systemName: "Luna AI",
    primaryColor: "#166534",
    secondaryColor: "#dcfce7",
    accentColor: "#22c55e",
    logoIcon: "💚",
  },
  purple: {
    systemName: "Luna AI",
    primaryColor: "#7c3aed",
    secondaryColor: "#ede9fe",
    accentColor: "#8b5cf6",
    logoIcon: "💜",
  },
}
