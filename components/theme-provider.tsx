"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

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

// Temas predefinidos
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

// Tema padrão
export const defaultTheme: ThemeConfig = {
  systemName: "Sistema",
  description: "Plataforma de gestão",
  logoIcon: "🔧",
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  accentColor: "#8b5cf6",
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

// Função SEGURA para carregar tema via API (SEM Supabase no cliente)
async function loadThemeFromApi(): Promise<ThemeConfig | null> {
  try {
    const response = await fetch("/api/config", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()

    // A API retorna { theme: ..., settings: ... } diretamente
    if (result.theme) {
      return result.theme
    }

    return null
  } catch (error) {
    return null
  }
}

// Função para salvar o tema no localStorage
export function saveThemeToLocalStorage(theme: ThemeConfig): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("impaai-theme", JSON.stringify(theme))
  } catch (error) {
    // Silencioso - não é crítico
  }
}

// Função para carregar o tema do localStorage
export function loadThemeFromLocalStorage(): ThemeConfig | null {
  if (typeof window === "undefined") return null

  try {
    const savedTheme = localStorage.getItem("impaai-theme")
    if (!savedTheme) return null

    const parsedTheme = JSON.parse(savedTheme)
    return parsedTheme
  } catch (error) {
    return null
  }
}

// Funções de compatibilidade (DEPRECATED)
export async function loadThemeFromDatabase(): Promise<ThemeConfig | null> {
  return await loadThemeFromApi()
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    saveThemeToLocalStorage(theme)
    return true
  } catch (error) {
    return false
  }
}

interface ThemeProviderProps {
  children: React.ReactNode
  serverFetchedTheme?: ThemeConfig | null
}

export function ThemeProvider({ children, serverFetchedTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(serverFetchedTheme || defaultTheme)
  const [isLoading, setIsLoading] = useState(false)

  const loadClientSideTheme = async () => {
    try {
      setIsLoading(true)

      // 1. Tentar carregar via API SEGURA
      let loadedTheme = await loadThemeFromApi()

      // 2. Fallback para localStorage
      if (!loadedTheme) {
        loadedTheme = loadThemeFromLocalStorage()
      }

      // 3. Fallback final para tema padrão
      if (!loadedTheme) {
        loadedTheme = defaultTheme
      }

      setTheme(loadedTheme)
      applyThemeColors(loadedTheme)
      saveThemeToLocalStorage(loadedTheme)
    } catch (error) {
      // Em caso de erro, usar tema padrão
      setTheme(defaultTheme)
      applyThemeColors(defaultTheme)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTheme = async (updates: Partial<ThemeConfig>) => {
    try {
      const newTheme = { ...theme, ...updates }

      setTheme(newTheme)
      applyThemeColors(newTheme)
      saveThemeToLocalStorage(newTheme)

      // TODO: Implementar API para salvar tema no servidor
    } catch (error) {
      // Silencioso - não é crítico
    }
  }

  // Carregar tema na inicialização
  useEffect(() => {
    if (!serverFetchedTheme || serverFetchedTheme === defaultTheme) {
      loadClientSideTheme()
    } else {
      applyThemeColors(theme)
    }
  }, [])

  // Aplicar cores sempre que o tema mudar
  useEffect(() => {
    applyThemeColors(theme)
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        updateTheme,
        loadTheme: loadClientSideTheme,
        isLoading,
      }}
    >
      <div className="min-h-screen">{children}</div>
    </ThemeContext.Provider>
  )
}
