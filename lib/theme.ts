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
    const { data, error } = await supabase.from("global_theme_config").select("*").single()

    if (error) {
      console.error("Error loading theme:", error)
      return defaultTheme
    }

    if (!data) {
      return defaultTheme
    }

    return {
      systemName: data.system_name || defaultTheme.systemName,
      description: data.description || defaultTheme.description,
      logoIcon: data.logo_icon || defaultTheme.logoIcon,
      primaryColor: data.primary_color || defaultTheme.primaryColor,
      secondaryColor: data.secondary_color || defaultTheme.secondaryColor,
      accentColor: data.accent_color || defaultTheme.accentColor,
      logoUrl: data.logo_url,
      faviconUrl: data.favicon_url,
      sidebarStyle: data.sidebar_style || defaultTheme.sidebarStyle,
      brandingEnabled: data.branding_enabled ?? defaultTheme.brandingEnabled,
    }
  } catch (error) {
    console.error("Error loading theme from database:", error)
    return defaultTheme
  }
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    const { error } = await supabase.from("global_theme_config").upsert({
      id: "550e8400-e29b-41d4-a716-446655440000", // Using a fixed UUID for the global theme
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
