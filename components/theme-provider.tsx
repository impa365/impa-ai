"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

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
  logoUrl?: string
  faviconUrl?: string
  sidebarStyle?: string
  brandingEnabled?: boolean
}

// Tema padrão exportado
export const defaultTheme: ThemeConfig = {
  systemName: "Sistema AI",
  description: "Tema padrão azul da plataforma",
  logoIcon: "🤖",
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  accentColor: "#8b5cf6",
  brandingEnabled: true,
}

export const themePresets: Record<string, ThemeConfig> = {
  default: defaultTheme,
  purple: {
    systemName: "Purple Theme",
    description: "Tema roxo elegante",
    logoIcon: "💜",
    primaryColor: "#8b5cf6",
    secondaryColor: "#06b6d4",
    accentColor: "#f59e0b",
    brandingEnabled: true,
  },
  green: {
    systemName: "Green Theme",
    description: "Tema verde natural",
    logoIcon: "🌿",
    primaryColor: "#10b981",
    secondaryColor: "#3b82f6",
    accentColor: "#f59e0b",
    brandingEnabled: true,
  },
  orange: {
    systemName: "Orange Theme",
    description: "Tema laranja vibrante",
    logoIcon: "🔥",
    primaryColor: "#f59e0b",
    secondaryColor: "#ef4444",
    accentColor: "#8b5cf6",
    brandingEnabled: true,
  },
}

interface ThemeContextType {
  theme: ThemeConfig
  updateTheme: (newTheme: ThemeConfig) => Promise<void>
  loadTheme: () => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [isLoading, setIsLoading] = useState(false)

  // Função para aplicar tema no DOM
  const applyThemeToDOM = (themeConfig: ThemeConfig) => {
    if (typeof document === "undefined") return

    const root = document.documentElement
    root.style.setProperty("--primary-color", themeConfig.primaryColor)
    root.style.setProperty("--secondary-color", themeConfig.secondaryColor)
    root.style.setProperty("--accent-color", themeConfig.accentColor)

    if (themeConfig.textColor) {
      root.style.setProperty("--text-color", themeConfig.textColor)
    }

    if (themeConfig.backgroundColor) {
      root.style.setProperty("--background-color", themeConfig.backgroundColor)
    }

    // Atualizar título da página
    document.title = themeConfig.systemName

    // Aplicar CSS customizado se existir
    if (themeConfig.customCss) {
      let customStyleElement = document.getElementById("custom-theme-css")
      if (!customStyleElement) {
        customStyleElement = document.createElement("style")
        customStyleElement.id = "custom-theme-css"
        document.head.appendChild(customStyleElement)
      }
      customStyleElement.textContent = themeConfig.customCss
    }
  }

  // Carregar tema do servidor
  const loadTheme = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/branding")
      if (response.ok) {
        const data = await response.json()
        if (data.theme) {
          setTheme(data.theme)
          applyThemeToDOM(data.theme)
        } else {
          setTheme(defaultTheme)
          applyThemeToDOM(defaultTheme)
        }
      } else {
        setTheme(defaultTheme)
        applyThemeToDOM(defaultTheme)
      }
    } catch (error) {
      // Usar tema padrão em caso de erro
      setTheme(defaultTheme)
      applyThemeToDOM(defaultTheme)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar tema na inicialização
  useEffect(() => {
    loadTheme()
  }, [])

  // Aplicar tema sempre que mudar
  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme])

  const updateTheme = async (newTheme: ThemeConfig) => {
    setTheme(newTheme)
    applyThemeToDOM(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, loadTheme, isLoading }}>
      <div className="min-h-screen">{children}</div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Funções auxiliares para compatibilidade
export function applyThemeColors(theme: ThemeConfig): void {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.style.setProperty("--primary-color", theme.primaryColor)
  root.style.setProperty("--secondary-color", theme.secondaryColor)
  root.style.setProperty("--accent-color", theme.accentColor)
}

export function saveThemeToLocalStorage(theme: ThemeConfig): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("impaai-theme", JSON.stringify(theme))
  } catch (error) {
    // Silencioso
  }
}

export function loadThemeFromLocalStorage(): ThemeConfig | null {
  if (typeof window === "undefined") return null
  try {
    const savedTheme = localStorage.getItem("impaai-theme")
    return savedTheme ? JSON.parse(savedTheme) : null
  } catch (error) {
    return null
  }
}

// Funções deprecated para compatibilidade
export async function loadThemeFromDatabase(): Promise<ThemeConfig | null> {
  return null
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  return true
}
