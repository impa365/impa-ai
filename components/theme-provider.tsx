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

// Tema padrão genérico
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

// ✅ SEGURO: Carregar tema via API interna (NUNCA acessa Supabase diretamente)
async function loadThemeFromApi(): Promise<ThemeConfig | null> {
  try {
    const response = await fetch("/api/theme", {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return null
    }

    const themeData = await response.json()
    return themeData as ThemeConfig
  } catch (error) {
    console.error("Erro ao carregar tema via API:", error)
    return null
  }
}

// Função para salvar o tema no localStorage
export function saveThemeToLocalStorage(theme: ThemeConfig): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("impaai-theme", JSON.stringify(theme))
  } catch (error) {
    console.error("Erro ao salvar tema no localStorage:", error)
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
    console.error("Erro ao carregar tema do localStorage:", error)
    return null
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

      // ✅ SEGURO: Carregar via API interna
      let loadedTheme = await loadThemeFromApi()

      // Fallback para localStorage
      if (!loadedTheme) {
        loadedTheme = loadThemeFromLocalStorage()
      }

      // Fallback final para tema padrão
      if (!loadedTheme) {
        loadedTheme = defaultTheme
      }

      setTheme(loadedTheme)
      applyThemeColors(loadedTheme)
      saveThemeToLocalStorage(loadedTheme)
    } catch (error) {
      console.error("Erro ao carregar tema, usando padrão:", error)
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
    } catch (error) {
      console.error("Erro ao atualizar tema:", error)
    }
  }

  useEffect(() => {
    if (serverFetchedTheme) {
      setTheme(serverFetchedTheme)
      applyThemeColors(serverFetchedTheme)
      saveThemeToLocalStorage(serverFetchedTheme)
      setIsLoading(false)
    } else {
      loadClientSideTheme()
    }
  }, [serverFetchedTheme])

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
