"use client"

import { createContext, useContext } from "react"

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
    // Por enquanto, sempre retornar o tema padrão
    // Isso evita problemas de permissão até que o usuário esteja logado
    console.log("Using default theme (database access disabled for now)")
    return defaultTheme
  } catch (error) {
    console.error("Error loading theme from database:", error)
    return defaultTheme
  }
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    // Por enquanto, apenas simular o salvamento
    console.log("Theme save simulated (database access disabled for now)")
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
