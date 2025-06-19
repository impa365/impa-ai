import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider, defaultTheme, type ThemeConfig } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

// Metadata mínima - será sobrescrita pelo DynamicTitle
export const metadata: Metadata = {
  description: "Sistema de gestão",
  generator: "v0.dev",
}

// Helper function to fetch theme server-side
async function getInitialTheme(): Promise<ThemeConfig | null> {
  try {
    // Usar apenas a função do servidor para evitar múltiplas instâncias
    const { getSupabaseServer } = await import("@/lib/supabase-config")
    const supabase = getSupabaseServer()

    // Attempt to load from system_themes
    const { data: themeData, error: themeError } = await supabase
      .from("system_themes")
      .select("*")
      .eq("is_active", true)
      .single()

    if (themeError && themeError.code !== "PGRST116") {
      // PGRST116: no rows found
      console.warn("Error loading theme from system_themes (server-side):", themeError.message)
    }

    if (themeData) {
      return {
        systemName: themeData.display_name || themeData.name || "Sistema",
        description: themeData.description || "Sistema de gestão",
        logoIcon: themeData.logo_icon || "🔧",
        primaryColor: themeData.colors?.primary || "#3b82f6",
        secondaryColor: themeData.colors?.secondary || "#10b981",
        accentColor: themeData.colors?.accent || "#8b5cf6",
        textColor: themeData.colors?.text,
        backgroundColor: themeData.colors?.background,
        fontFamily: themeData.fonts?.primary,
        borderRadius: themeData.borders?.radius,
        customCss: themeData.custom_css,
      }
    }

    // Fallback to system_settings if no active theme in system_themes
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "current_theme")
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      console.warn("Error loading theme from system_settings (server-side):", settingsError.message)
    }

    if (settingsData?.setting_value) {
      if (typeof settingsData.setting_value === "object") {
        return settingsData.setting_value as ThemeConfig
      }
    }

    console.warn("No theme found in database (server-side), will use default.")
    return null
  } catch (error) {
    console.error("Critical error fetching initial theme (server-side):", error)
    return null
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialTheme = await getInitialTheme()

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider serverFetchedTheme={initialTheme || defaultTheme}>{children}</ThemeProvider>
      </body>
    </html>
  )
}
