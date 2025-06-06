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
    // Por enquanto, vamos usar apenas localStorage para persistir o tema
    // Isso evita problemas com o banco de dados até que esteja configurado corretamente

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("impaai_theme")
      if (savedTheme) {
        try {
          const parsedTheme = JSON.parse(savedTheme)
          return {
            ...defaultTheme,
            ...parsedTheme,
          }
        } catch (e) {
          console.log("Error parsing saved theme, using default")
        }
      }
    }

    console.log("Using default theme configuration")
    return defaultTheme
  } catch (error) {
    console.error("Error loading theme:", error)
    return defaultTheme
  }
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    // Salvar no localStorage por enquanto
    if (typeof window !== "undefined") {
      localStorage.setItem("impaai_theme", JSON.stringify(theme))
      console.log("Theme saved to localStorage:", theme.systemName)
      return true
    }
    return false
  } catch (error) {
    console.error("Error saving theme:", error)
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

  // Apply colors to Tailwind CSS variables
  root.style.setProperty("--color-primary", theme.primaryColor)
  root.style.setProperty("--color-secondary", theme.secondaryColor)
  root.style.setProperty("--color-accent", theme.accentColor)

  // Set document title if system name is available
  if (theme.systemName && typeof document !== "undefined") {
    document.title = theme.systemName
  }

  // Apply favicon if available
  if (theme.faviconUrl && typeof document !== "undefined") {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (favicon) {
      favicon.href = theme.faviconUrl
    }
  }
}

// Theme presets for quick selection
export const themePresets = {
  default: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    primaryColor: "#0f172a",
    secondaryColor: "#f1f5f9",
    accentColor: "#3b82f6",
    logoIcon: "🤖",
    sidebarStyle: "default",
    brandingEnabled: true,
  },
  blue: {
    systemName: "Impa AI - Blue",
    description: "Tema azul para a plataforma",
    primaryColor: "#1e40af",
    secondaryColor: "#dbeafe",
    accentColor: "#3b82f6",
    logoIcon: "💙",
    sidebarStyle: "default",
    brandingEnabled: true,
  },
  green: {
    systemName: "Impa AI - Green",
    description: "Tema verde para a plataforma",
    primaryColor: "#166534",
    secondaryColor: "#dcfce7",
    accentColor: "#22c55e",
    logoIcon: "💚",
    sidebarStyle: "default",
    brandingEnabled: true,
  },
  purple: {
    systemName: "Impa AI - Purple",
    description: "Tema roxo para a plataforma",
    primaryColor: "#7c3aed",
    secondaryColor: "#ede9fe",
    accentColor: "#8b5cf6",
    logoIcon: "💜",
    sidebarStyle: "default",
    brandingEnabled: true,
  },
  dark: {
    systemName: "Impa AI - Dark",
    description: "Tema escuro para a plataforma",
    primaryColor: "#000000",
    secondaryColor: "#1f2937",
    accentColor: "#60a5fa",
    logoIcon: "🌙",
    sidebarStyle: "default",
    brandingEnabled: true,
  },
}

// Função para aplicar um preset
export function applyThemePreset(presetName: keyof typeof themePresets): ThemeConfig {
  const preset = themePresets[presetName]
  if (!preset) {
    console.warn(`Theme preset '${presetName}' not found, using default`)
    return defaultTheme
  }

  return {
    ...defaultTheme,
    ...preset,
  }
}

// Função para validar cores hexadecimais
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

// Função para gerar uma cor mais clara ou mais escura
export function adjustColorBrightness(color: string, amount: number): string {
  const usePound = color[0] === "#"
  const col = usePound ? color.slice(1) : color

  const num = Number.parseInt(col, 16)
  let r = (num >> 16) + amount
  let g = ((num >> 8) & 0x00ff) + amount
  let b = (num & 0x0000ff) + amount

  r = r > 255 ? 255 : r < 0 ? 0 : r
  g = g > 255 ? 255 : g < 0 ? 0 : g
  b = b > 255 ? 255 : b < 0 ? 0 : b

  return (usePound ? "#" : "") + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")
}
