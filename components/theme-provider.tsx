"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { publicApi } from "@/lib/api-client"

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
  theme: ThemeConfig | null
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<void>
  loadTheme: () => Promise<void>
  isLoading: boolean
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

// Temas predefinidos - usando nomes genéricos para white label
export const themePresets: Record<string, ThemeConfig> = {
  blue: {
    systemName: "Sistema",
    description: "Plataforma de gestão",
    logoIcon: "🤖",
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
    accentColor: "#8b5cf6",
  },
  purple: {
    systemName: "Sistema",
    description: "Plataforma de gestão",
    logoIcon: "🔮",
    primaryColor: "#8b5cf6",
    secondaryColor: "#ec4899",
    accentColor: "#3b82f6",
  },
  green: {
    systemName: "Sistema",
    description: "Plataforma de gestão",
    logoIcon: "🌱",
    primaryColor: "#10b981",
    secondaryColor: "#3b82f6",
    accentColor: "#f59e0b",
  },
  orange: {
    systemName: "Sistema",
    description: "Plataforma de gestão",
    logoIcon: "🔥",
    primaryColor: "#f97316",
    secondaryColor: "#8b5cf6",
    accentColor: "#10b981",
  },
  dark: {
    systemName: "Sistema",
    description: "Plataforma de gestão",
    logoIcon: "⚡",
    primaryColor: "#6366f1",
    secondaryColor: "#ec4899",
    accentColor: "#f97316",
    backgroundColor: "#1e293b",
    textColor: "#f8fafc",
  },
}

// Tema padrão genérico
export const defaultTheme: ThemeConfig = {
  systemName: "Sistema",
  description: "Plataforma de gestão",
  logoIcon: "🔧",
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  accentColor: "#8b5cf6",
}

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
  } else {
    root.style.removeProperty("--text-color")
  }

  if (theme.backgroundColor) {
    root.style.setProperty("--background-color", theme.backgroundColor)
  } else {
    root.style.removeProperty("--background-color")
  }

  if (theme.fontFamily) {
    root.style.setProperty("--font-family", theme.fontFamily)
  } else {
    root.style.removeProperty("--font-family")
  }

  if (theme.borderRadius) {
    root.style.setProperty("--border-radius", theme.borderRadius)
  } else {
    root.style.removeProperty("--border-radius")
  }

  // Aplicar CSS customizado se existir
  let customStyleElement = document.getElementById("custom-theme-css")
  if (theme.customCss) {
    if (!customStyleElement) {
      customStyleElement = document.createElement("style")
      customStyleElement.id = "custom-theme-css"
      document.head.appendChild(customStyleElement)
    }
    customStyleElement.textContent = theme.customCss
  } else if (customStyleElement) {
    customStyleElement.textContent = ""
  }
}

// Função para carregar tema via API
async function loadThemeFromApi(): Promise<ThemeConfig | null> {
  try {
    console.log("🎨 Loading theme from API...")
    const result = await publicApi.getConfig()

    if (result.error) {
      console.error("❌ Error loading theme from API:", result.error)
      return null
    }

    if (result.data?.theme) {
      console.log("✅ Theme loaded from API:", result.data.theme.systemName)
      return result.data.theme
    }

    return null
  } catch (error) {
    console.error("💥 Critical error loading theme from API:", error)
    return null
  }
}

// Função para salvar o tema no localStorage
export function saveThemeToLocalStorage(theme: ThemeConfig): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("theme", JSON.stringify(theme))
  } catch (error) {
    console.error("Erro ao salvar tema no localStorage:", error)
  }
}

// Função para carregar o tema do localStorage
export function loadThemeFromLocalStorage(): ThemeConfig | null {
  if (typeof window === "undefined") return null

  try {
    const savedTheme = localStorage.getItem("theme")
    if (!savedTheme) return null

    const parsedTheme = JSON.parse(savedTheme)
    return parsedTheme
  } catch (error) {
    console.error("Erro ao carregar tema do localStorage:", error)
    return null
  }
}

// Função para invalidar cache
export function invalidateThemeCache(): void {
  // Implementação futura se necessário
}

// Funções de carregamento e salvamento no banco (mantidas para compatibilidade)
export async function loadThemeFromDatabase(): Promise<ThemeConfig | null> {
  return await loadThemeFromApi()
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    // TODO: Implementar API endpoint para salvar tema
    // const result = await authApi.saveTheme(theme)

    // Por enquanto, salvar apenas no localStorage
    saveThemeToLocalStorage(theme)
    return true
  } catch (error) {
    console.error("Erro ao salvar tema:", error)
    return false
  }
}

interface ThemeProviderProps {
  children: React.ReactNode
  serverFetchedTheme?: ThemeConfig | null
}

export function ThemeProvider({ children, serverFetchedTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig | null>(serverFetchedTheme || null)
  const [isLoading, setIsLoading] = useState(!serverFetchedTheme)

  const loadClientSideTheme = async () => {
    try {
      setIsLoading(true)

      // Tentar carregar via API
      let loadedTheme = await loadThemeFromApi()

      // Fallback para localStorage
      if (!loadedTheme) {
        loadedTheme = loadThemeFromLocalStorage()
      }

      // Fallback final para tema padrão
      if (!loadedTheme) {
        console.warn("Client: Using default theme")
        loadedTheme = defaultTheme
      }

      setTheme(loadedTheme)
      applyThemeColors(loadedTheme)

      // Salvar no localStorage para cache
      saveThemeToLocalStorage(loadedTheme)
    } catch (error) {
      console.error("Client: Error loading theme, using default:", error)
      setTheme(defaultTheme)
      applyThemeColors(defaultTheme)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTheme = async (updates: Partial<ThemeConfig>) => {
    try {
      if (!theme) return

      const newTheme = { ...theme, ...updates }

      setTheme(newTheme)
      applyThemeColors(newTheme)
      saveThemeToLocalStorage(newTheme)

      // TODO: Implementar API para salvar tema
      // await authApi.updateTheme(newTheme)
    } catch (error) {
      console.error("Error updating theme:", error)
    }
  }

  useEffect(() => {
    if (serverFetchedTheme) {
      // Se tema foi fornecido pelo servidor, aplicar imediatamente
      setTheme(serverFetchedTheme)
      applyThemeColors(serverFetchedTheme)
      saveThemeToLocalStorage(serverFetchedTheme)
      setIsLoading(false)
    } else {
      // Caso contrário, carregar do cliente
      loadClientSideTheme()
    }
  }, [serverFetchedTheme])

  // Aplicar cores sempre que o tema mudar
  useEffect(() => {
    if (theme && !isLoading) {
      applyThemeColors(theme)
    }
  }, [theme, isLoading])

  if (isLoading && !theme) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const currentTheme = theme || defaultTheme

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        updateTheme,
        loadTheme: loadClientSideTheme,
        isLoading,
      }}
    >
      <div className="min-h-screen">{children}</div>
    </ThemeContext.Provider>
  )
}
