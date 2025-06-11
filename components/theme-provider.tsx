"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps as NextThemesProviderProps } from "next-themes" // Renomeado para evitar conflito
import { supabase } from "@/lib/supabase"
import { checkDatabaseHealth } from "@/lib/system-check" // Importa o novo verificador
import { AlertTriangle, Loader2 } from "lucide-react" // Ícones para feedback

// Definição do tipo ThemeConfig (permanece a mesma)
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

// Context para o tema (permanece o mesmo)
interface ThemeContextType {
  theme: ThemeConfig | null
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<void>
  loadTheme: () => Promise<void> // Renomeado para initializeAppAndLoadTheme para clareza
  isLoading: boolean
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Hook para usar o contexto do tema (permanece o mesmo)
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Temas predefinidos (permanecem os mesmos)
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
// Cache global (permanece o mesmo)
let themeCache: ThemeConfig | null = null
let themeCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Tema padrão genérico (permanece o mesmo)
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
    const { error } = await supabase.from("system_themes").select("logo_icon").limit(1)
    if (error) {
      console.warn("Tabela system_themes pode não existir ou ter problemas de estrutura:", error.message)
      return false
    }
    return true
  } catch (error) {
    console.error("Erro ao verificar estrutura da tabela system_themes:", error)
    return false
  }
}

// Função otimizada para carregar tema com cache
export async function loadThemeFromDatabase(): Promise<ThemeConfig | null> {
  const now = Date.now()
  if (themeCache && now - themeCacheTime < CACHE_DURATION) {
    return themeCache
  }

  try {
    const hasCorrectStructure = await checkSystemThemesStructure()
    if (!hasCorrectStructure) {
      const fallbackTheme = await loadThemeFromSystemSettings()
      if (fallbackTheme) {
        themeCache = fallbackTheme
        themeCacheTime = now
      }
      return fallbackTheme
    }

    const { data, error } = await supabase.from("system_themes").select("*").eq("is_active", true).single()
    if (error && error.code === "PGRST116") {
      /* No rows found */
    } else if (error) {
      console.log("Erro ao carregar tema de system_themes:", error.message)
      // Não retorna fallback aqui diretamente, deixa o initializeAppAndLoadTheme decidir
      return null
    }

    if (!data) {
      // Tenta carregar das configurações do sistema como fallback se nada for encontrado em system_themes
      const fallbackTheme = await loadThemeFromSystemSettings()
      if (fallbackTheme) {
        themeCache = fallbackTheme
        themeCacheTime = now
        return fallbackTheme
      }
      return null
    }

    const themeConfig: ThemeConfig = {
      systemName: data.display_name || data.name || "Sistema",
      description: data.description || "Sistema de gestão",
      logoIcon: data.logo_icon || "🔧",
      primaryColor: data.colors?.primary || "#3b82f6",
      secondaryColor: data.colors?.secondary || "#10b981",
      accentColor: data.colors?.accent || "#8b5cf6",
      textColor: data.colors?.text,
      backgroundColor: data.colors?.background,
      fontFamily: data.fonts?.primary,
      borderRadius: data.borders?.radius,
      customCss: data.custom_css,
    }
    themeCache = themeConfig
    themeCacheTime = now
    return themeConfig
  } catch (error) {
    console.log("Erro ao carregar tema do banco, usando fallback:", error)
    const fallbackTheme = await loadThemeFromSystemSettings()
    if (fallbackTheme) {
      themeCache = fallbackTheme
      themeCacheTime = now
    }
    return fallbackTheme
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
      if (typeof settingsData.setting_value === "object") {
        return settingsData.setting_value as ThemeConfig
      }
      const presetName = settingsData.setting_value as string
      if (themePresets[presetName]) {
        return themePresets[presetName]
      }
    }
    return null
  } catch (error) {
    console.log("Erro ao carregar tema das configurações do sistema:", error)
    return null
  }
}

// Função para invalidar cache
export function invalidateThemeCache(): void {
  themeCache = null
  themeCacheTime = 0
}

// Função para salvar o tema no banco de dados
export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  invalidateThemeCache()
  try {
    const hasCorrectStructure = await checkSystemThemesStructure()
    if (!hasCorrectStructure) return await saveThemeAsSystemSetting(theme)

    const { data: existingTheme } = await supabase.from("system_themes").select("id").eq("is_active", true).single()
    const themeData = {
      /* ... seu objeto themeData ... */
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
      fonts: { primary: theme.fontFamily },
      borders: { radius: theme.borderRadius },
      custom_css: theme.customCss,
      is_default: false,
      is_active: true,
      logo_icon: theme.logoIcon,
    }

    if (existingTheme) {
      const { error } = await supabase.from("system_themes").update(themeData).eq("id", existingTheme.id)
      if (error) {
        console.error("Erro ao atualizar tema:", error)
        return await saveThemeAsSystemSetting(theme)
      }
    } else {
      const { error } = await supabase.from("system_themes").insert(themeData)
      if (error) {
        console.error("Erro ao criar tema:", error)
        return await saveThemeAsSystemSetting(theme)
      }
    }
    return true
  } catch (error) {
    console.error("Erro ao salvar tema no banco:", error)
    return await saveThemeAsSystemSetting(theme)
  }
}

// Função fallback para salvar tema nas configurações do sistema
async function saveThemeAsSystemSetting(theme: ThemeConfig): Promise<boolean> {
  try {
    const { data: existingSetting } = await supabase
      .from("system_settings")
      .select("id")
      .eq("setting_key", "current_theme")
      .single()
    const settingData = {
      /* ... seu objeto settingData ... */
      setting_key: "current_theme",
      setting_value: theme, // Salva o objeto de tema inteiro
      category: "appearance",
      description: "Configurações do tema atual da plataforma",
      is_public: true, // Permite que seja lido pelo cliente se necessário
    }
    if (existingSetting) {
      const { error } = await supabase.from("system_settings").update(settingData).eq("id", existingSetting.id)
      if (error) {
        console.error("Erro ao atualizar tema nas configurações:", error)
        saveThemeToLocalStorage(theme)
        return false
      }
    } else {
      const { error } = await supabase.from("system_settings").insert(settingData)
      if (error) {
        console.error("Erro ao inserir tema nas configurações:", error)
        saveThemeToLocalStorage(theme)
        return false
      }
    }
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
    return savedTheme ? JSON.parse(savedTheme) : null
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
  } catch (error) {
    console.error("Erro ao salvar tema no localStorage:", error)
  }
}

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  // Props renomeado
  const [theme, setTheme] = useState<ThemeConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  const initializeAppAndLoadTheme = async () => {
    console.log("ThemeProvider: Starting initialization...")
    setIsLoading(true)
    setInitializationError(null)

    try {
      const health = await checkDatabaseHealth()
      console.log("ThemeProvider: Database health check result:", health)

      if (!health.canConnect || !health.essentialTablesExist) {
        setInitializationError(health.message)
        setIsLoading(false)
        console.error("ThemeProvider: Initialization failed due to database health check.", health.message)
        return
      }

      // Se a saúde do banco está OK, prossiga para carregar o tema
      let loadedTheme = await loadThemeFromDatabase()
      if (!loadedTheme) {
        loadedTheme = loadThemeFromLocalStorage()
      }

      if (loadedTheme) {
        setTheme(loadedTheme)
        applyThemeColors(loadedTheme)
        console.log("ThemeProvider: Theme loaded successfully.", loadedTheme)
      } else {
        console.warn("ThemeProvider: No theme loaded from database or localStorage. Applying default theme.")
        setTheme(defaultTheme)
        applyThemeColors(defaultTheme)
      }
    } catch (error: any) {
      console.error("ThemeProvider: Critical error during app initialization and theme loading.", error)
      setInitializationError(
        `An unexpected error occurred during initialization: ${error.message}. Check console for details.`,
      )
    } finally {
      setIsLoading(false)
      console.log("ThemeProvider: Initialization finished.")
    }
  }

  const updateTheme = async (updates: Partial<ThemeConfig>) => {
    try {
      if (!theme) {
        console.warn("ThemeProvider: updateTheme called but no current theme exists.")
        return
      }
      const newTheme = { ...theme, ...updates }
      setTheme(newTheme)
      applyThemeColors(newTheme)
      const saved = await saveThemeToDatabase(newTheme)
      if (!saved) {
        saveThemeToLocalStorage(newTheme)
      }
      console.log("ThemeProvider: Theme updated.", newTheme)
    } catch (error: any) {
      console.error("ThemeProvider: Error updating theme.", error)
      if (theme) {
        saveThemeToLocalStorage({ ...theme, ...updates }) // Fallback
      }
    }
  }

  useEffect(() => {
    initializeAppAndLoadTheme()
  }, [])

  useEffect(() => {
    if (theme && !isLoading && !initializationError) {
      applyThemeColors(theme)
    }
  }, [theme, isLoading, initializationError])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-4" />
        <p className="text-lg font-medium text-gray-700">Inicializando Aplicação...</p>
        <p className="text-sm text-gray-500">Verificando configurações e conexão com o banco de dados.</p>
      </div>
    )
  }

  if (initializationError) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-red-700 mb-3">Falha na Inicialização da Aplicação</h1>
        <p className="text-md text-red-600 mb-4">Não foi possível iniciar a aplicação devido ao seguinte erro:</p>
        <pre className="text-sm text-red-700 bg-red-100 p-4 rounded-md shadow w-full max-w-2xl overflow-x-auto text-left whitespace-pre-wrap break-words">
          {initializationError}
        </pre>
        <div className="mt-6 text-gray-700 text-sm text-left max-w-2xl w-full space-y-2">
          <p>
            <strong>Possíveis causas e soluções:</strong>
          </p>
          <ul className="list-disc list-inside pl-4">
            <li>
              Verifique se as variáveis de ambiente <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> estão corretamente configuradas no seu ambiente de deploy
              (Portainer).
            </li>
            <li>Confirme se a URL do Supabase está correta e acessível pela sua aplicação.</li>
            <li>
              Certifique-se de que o banco de dados Supabase possui todas as tabelas e o esquema necessário (
              <code>impaai</code>). Execute os scripts SQL de setup se necessário.
            </li>
            <li>
              Verifique os logs do container da aplicação no Portainer para mensagens de erro detalhadas (procure por
              "DEBUG Supabase" ou "CRITICAL ERROR").
            </li>
          </ul>
        </div>
      </div>
    )
  }

  if (!theme) {
    // Este estado não deveria ser alcançado se a lógica acima estiver correta e o defaultTheme for aplicado.
    // Mas é um fallback para o caso de `theme` ser `null` sem `initializationError`.
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="animate-spin h-10 w-10 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-600">Carregando configuração de tema...</p>
        <p className="text-sm text-gray-500">
          Se esta mensagem persistir, pode haver um problema na configuração do tema padrão.
        </p>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, loadTheme: initializeAppAndLoadTheme, isLoading }}>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ThemeContext.Provider>
  )
}
