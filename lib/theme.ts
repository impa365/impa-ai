"use client"

import { createContext, useContext } from "react"

// Definição do tipo ThemeConfig
export interface ThemeConfig {
  systemName: string
  description?: string
  logoIcon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor?: string
  backgroundColor?: string
  fontFamily?: string
  borderRadius?: string
  customCss?: string
}

// Context para o tema
interface ThemeContextType {
  theme: ThemeConfig
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<void>
  loadTheme: () => Promise<void>
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Hook para usar o contexto do tema
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Temas predefinidos
export const themePresets: Record<string, ThemeConfig> = {
  blue: {
    systemName: "Sistema AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🤖",
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
    accentColor: "#8b5cf6",
  },
  purple: {
    systemName: "Sistema AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🔮",
    primaryColor: "#8b5cf6",
    secondaryColor: "#ec4899",
    accentColor: "#3b82f6",
  },
  green: {
    systemName: "Sistema AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🌱",
    primaryColor: "#10b981",
    secondaryColor: "#3b82f6",
    accentColor: "#f59e0b",
  },
  orange: {
    systemName: "Sistema AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🔥",
    primaryColor: "#f97316",
    secondaryColor: "#8b5cf6",
    accentColor: "#10b981",
  },
  dark: {
    systemName: "Sistema AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "⚡",
    primaryColor: "#6366f1",
    secondaryColor: "#ec4899",
    accentColor: "#f97316",
    backgroundColor: "#1e293b",
    textColor: "#f8fafc",
  },
}

// Tema padrão
export const defaultTheme: ThemeConfig = themePresets.blue

// Função para validar se uma cor é um código hexadecimal válido
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{3}){1,2}$/.test(color)
}

// Função para ajustar o brilho de uma cor
export function adjustColorBrightness(color: string, percent: number): string {
  if (!isValidHexColor(color)) return color

  const num = Number.parseInt(color.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt

  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  )
}

// Função para aplicar um preset de tema
export function applyThemePreset(presetName: string): ThemeConfig {
  return themePresets[presetName] || defaultTheme
}

// Função para aplicar as cores do tema no CSS
export function applyThemeColors(theme: ThemeConfig): void {
  if (typeof document === "undefined") return

  const root = document.documentElement

  // Aplicar cores CSS customizadas
  root.style.setProperty("--primary-color", theme.primaryColor)
  root.style.setProperty("--secondary-color", theme.secondaryColor)
  root.style.setProperty("--accent-color", theme.accentColor)

  if (theme.textColor) {
    root.style.setProperty("--text-color", theme.textColor)
  }

  if (theme.backgroundColor) {
    root.style.setProperty("--background-color", theme.backgroundColor)
  }

  if (theme.fontFamily) {
    root.style.setProperty("--font-family", theme.fontFamily)
  }

  if (theme.borderRadius) {
    root.style.setProperty("--border-radius", theme.borderRadius)
  }

  // Aplicar CSS customizado se existir
  if (theme.customCss) {
    let customStyleElement = document.getElementById("custom-theme-css")
    if (!customStyleElement) {
      customStyleElement = document.createElement("style")
      customStyleElement.id = "custom-theme-css"
      document.head.appendChild(customStyleElement)
    }
    customStyleElement.textContent = theme.customCss
  }
}

// Funções de banco de dados movidas para lib/theme-server.ts
// Use loadThemeFromDatabase/saveThemeToDatabase de "@/lib/theme-server"

// Função para carregar o tema do localStorage
export function loadThemeFromLocalStorage(): ThemeConfig | null {
  if (typeof window === "undefined") return null

  try {
    const savedTheme = localStorage.getItem("theme")
    if (!savedTheme) return null

    const parsedTheme = JSON.parse(savedTheme)
    return parsedTheme
  } catch (error) {
    console.error("❌ Erro ao carregar tema do localStorage:", error)
    return null
  }
}

// Função para salvar o tema no localStorage
export function saveThemeToLocalStorage(theme: ThemeConfig): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("theme", JSON.stringify(theme))
  } catch (error) {
    console.error("❌ Erro ao salvar tema no localStorage:", error)
  }
}
