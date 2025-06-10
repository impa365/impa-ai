"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { supabase } from "@/lib/supabase"

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
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🤖",
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
    accentColor: "#8b5cf6",
  },
  purple: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🔮",
    primaryColor: "#8b5cf6",
    secondaryColor: "#ec4899",
    accentColor: "#3b82f6",
  },
  green: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🌱",
    primaryColor: "#10b981",
    secondaryColor: "#3b82f6",
    accentColor: "#f59e0b",
  },
  orange: {
    systemName: "Impa AI",
    description: "Plataforma de construção de agentes de IA",
    logoIcon: "🔥",
    primaryColor: "#f97316",
    secondaryColor: "#8b5cf6",
    accentColor: "#10b981",
  },
  dark: {
    systemName: "Impa AI",
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

// Função para verificar se a tabela system_themes tem a estrutura correta
async function checkSystemThemesStructure(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("system_themes").select("logo_icon").limit(1)

    if (error) {
      console.log("Tabela system_themes não existe ou tem problemas de estrutura:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.log("Erro ao verificar estrutura da tabela system_themes:", error)
    return false
  }
}

// Função para carregar o tema do banco de dados
export async function loadThemeFromDatabase(): Promise<ThemeConfig | null> {
  try {
    // Verificar se a estrutura da tabela está correta
    const hasCorrectStructure = await checkSystemThemesStructure()

    if (!hasCorrectStructure) {
      console.log("Estrutura da tabela system_themes incorreta, usando fallback")
      return await loadThemeFromSystemSettings()
    }

    // Tentar carregar da tabela system_themes
    const { data, error } = await supabase.from("system_themes").select("*").eq("is_active", true).single()

    if (error && error.code === "PGRST116") {
      console.log("Nenhum tema ativo encontrado em system_themes, tentando system_settings")
      return await loadThemeFromSystemSettings()
    }

    if (error) {
      console.log("Erro ao carregar tema de system_themes:", error.message)
      return await loadThemeFromSystemSettings()
    }

    if (!data) {
      console.log("Nenhum tema ativo encontrado, usando fallback")
      return await loadThemeFromSystemSettings()
    }

    // Mapear os dados do banco para o formato ThemeConfig
    const theme: ThemeConfig = {
      systemName: data.display_name || data.name || defaultTheme.systemName,
      description: data.description || defaultTheme.description,
      logoIcon: data.logo_icon || defaultTheme.logoIcon,
      primaryColor: data.colors?.primary || defaultTheme.primaryColor,
      secondaryColor: data.colors?.secondary || defaultTheme.secondaryColor,
      accentColor: data.colors?.accent || defaultTheme.accentColor,
      textColor: data.colors?.text,
      backgroundColor: data.colors?.background,
      fontFamily: data.fonts?.primary,
      borderRadius: data.borders?.radius,
      customCss: data.custom_css,
    }

    console.log("Tema carregado do banco:", theme)
    return theme
  } catch (error) {
    console.log("Erro ao carregar tema do banco, usando fallback:", error)
    return await loadThemeFromSystemSettings()
  }
}

// Função fallback para carregar tema das configurações do sistema
async function loadThemeFromSystemSettings(): Promise<ThemeConfig | null> {
  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "current_theme")
      .single()

    if (!settingsError && settingsData?.setting_value) {
      // Se encontrar configuração de tema como JSON, usar diretamente
      if (typeof settingsData.setting_value === "object") {
        console.log("Tema carregado das configurações do sistema")
        return settingsData.setting_value as ThemeConfig
      }
      // Se for string, tentar usar como preset
      const presetName = settingsData.setting_value as string
      if (themePresets[presetName]) {
        console.log(`Usando preset de tema: ${presetName}`)
        return themePresets[presetName]
      }
    }

    console.log("Nenhum tema encontrado nas configurações, usando tema padrão")
    return null
  } catch (error) {
    console.log("Erro ao carregar tema das configurações:", error)
    return null
  }
}

// Função para salvar o tema no banco de dados
export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    // Verificar se a estrutura da tabela está correta
    const hasCorrectStructure = await checkSystemThemesStructure()

    if (!hasCorrectStructure) {
      console.log("Estrutura da tabela system_themes incorreta, usando fallback para system_settings")
      return await saveThemeAsSystemSetting(theme)
    }

    // Verificar se já existe um tema ativo
    const { data: existingTheme } = await supabase.from("system_themes").select("id").eq("is_active", true).single()

    // Preparar os dados para salvar
    const themeData = {
      name: theme.systemName.toLowerCase().replace(/\s+/g, "_"),
      display_name: theme.systemName,
      description: theme.description || "Tema personalizado",
      colors: {
        primary: theme.primaryColor,
        secondary: theme.secondaryColor,
        accent: theme.accentColor,
        text: theme.textColor,
        background: theme.backgroundColor,
      },
      fonts: {
        primary: theme.fontFamily,
      },
      borders: {
        radius: theme.borderRadius,
      },
      custom_css: theme.customCss,
      is_default: false,
      is_active: true,
      logo_icon: theme.logoIcon,
    }

    if (existingTheme) {
      // Atualizar tema existente
      const { error } = await supabase.from("system_themes").update(themeData).eq("id", existingTheme.id)

      if (error) {
        console.error("Erro ao atualizar tema:", error)
        return await saveThemeAsSystemSetting(theme)
      }
    } else {
      // Criar novo tema
      const { error } = await supabase.from("system_themes").insert(themeData)

      if (error) {
        console.error("Erro ao criar tema:", error)
        return await saveThemeAsSystemSetting(theme)
      }
    }

    console.log("Tema salvo no banco com sucesso")
    return true
  } catch (error) {
    console.error("Erro ao salvar tema no banco:", error)
    return await saveThemeAsSystemSetting(theme)
  }
}

// Função fallback para salvar tema nas configurações do sistema
async function saveThemeAsSystemSetting(theme: ThemeConfig): Promise<boolean> {
  try {
    // Verificar se já existe uma configuração de tema
    const { data: existingSetting } = await supabase
      .from("system_settings")
      .select("id")
      .eq("setting_key", "current_theme")
      .single()

    const settingData = {
      setting_key: "current_theme",
      setting_value: theme,
      category: "appearance",
      description: "Configurações do tema atual",
      is_public: true,
    }

    if (existingSetting) {
      // Atualizar configuração existente
      const { error } = await supabase.from("system_settings").update(settingData).eq("id", existingSetting.id)

      if (error) {
        console.error("Erro ao atualizar tema nas configurações:", error)
        saveThemeToLocalStorage(theme)
        return false
      }
    } else {
      // Criar nova configuração
      const { error } = await supabase.from("system_settings").insert(settingData)

      if (error) {
        console.error("Erro ao inserir tema nas configurações:", error)
        saveThemeToLocalStorage(theme)
        return false
      }
    }

    console.log("Tema salvo nas configurações do sistema")
    return true
  } catch (error) {
    console.error("Erro ao salvar tema nas configurações:", error)
    saveThemeToLocalStorage(theme)
    return false
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

// Função para salvar o tema no localStorage
export function saveThemeToLocalStorage(theme: ThemeConfig): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("theme", JSON.stringify(theme))
    console.log("Tema salvo no localStorage")
  } catch (error) {
    console.error("Erro ao salvar tema no localStorage:", error)
  }
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [isLoading, setIsLoading] = useState(true)

  const loadTheme = async () => {
    try {
      setIsLoading(true)

      // Tentar carregar do banco primeiro
      let loadedTheme = await loadThemeFromDatabase()

      // Se não conseguir do banco, tentar localStorage
      if (!loadedTheme) {
        loadedTheme = loadThemeFromLocalStorage()
      }

      // Se ainda não tiver tema, usar o padrão
      const finalTheme = loadedTheme || defaultTheme

      setTheme(finalTheme)
      applyThemeColors(finalTheme)

      console.log("Tema carregado:", finalTheme)
    } catch (error) {
      console.error("Error loading theme:", error)
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

      // Tentar salvar no banco, se falhar salva no localStorage
      const saved = await saveThemeToDatabase(newTheme)
      if (!saved) {
        saveThemeToLocalStorage(newTheme)
      }

      console.log("Tema atualizado:", newTheme)
    } catch (error) {
      console.error("Error updating theme:", error)
      // Fallback para localStorage
      saveThemeToLocalStorage({ ...theme, ...updates })
    }
  }

  useEffect(() => {
    loadTheme()
  }, [])

  // Apply theme colors whenever theme changes
  useEffect(() => {
    if (!isLoading) {
      applyThemeColors(theme)
    }
  }, [theme, isLoading])

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, loadTheme }}>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ThemeContext.Provider>
  )
}
