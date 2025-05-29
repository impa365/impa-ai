"use client"

import { createContext, useContext } from "react"
import { createClient } from "./supabase"

export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  systemName: string
  description: string
  logoEmoji: string
}

export const defaultTheme: ThemeConfig = {
  primaryColor: "#0070f3",
  secondaryColor: "#1e293b",
  accentColor: "#10b981",
  backgroundColor: "#ffffff",
  textColor: "#1e293b",
  systemName: "Luna AI",
  description: "Plataforma de construção de agentes de IA",
  logoEmoji: "🌙",
}

export const ThemeContext = createContext<{
  theme: ThemeConfig
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<void>
  loadTheme: () => Promise<void>
}>({
  theme: defaultTheme,
  updateTheme: async () => {},
  loadTheme: async () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export async function loadThemeFromDatabase(): Promise<ThemeConfig> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("global_theme_config").select("*").single()

    if (error) {
      console.error("Erro ao carregar tema:", error)
      return defaultTheme
    }

    if (!data) {
      return defaultTheme
    }

    return {
      primaryColor: data.primary_color || defaultTheme.primaryColor,
      secondaryColor: data.secondary_color || defaultTheme.secondaryColor,
      accentColor: data.accent_color || defaultTheme.accentColor,
      backgroundColor: data.background_color || defaultTheme.backgroundColor,
      textColor: data.text_color || defaultTheme.textColor,
      systemName: data.system_name || defaultTheme.systemName,
      description: data.description || defaultTheme.description,
      logoEmoji: data.logo_emoji || defaultTheme.logoEmoji,
    }
  } catch (error) {
    console.error("Erro ao carregar tema:", error)
    return defaultTheme
  }
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("global_theme_config").upsert({
      id: 1, // Usando um ID fixo para o tema global
      primary_color: theme.primaryColor,
      secondary_color: theme.secondaryColor,
      accent_color: theme.accentColor,
      background_color: theme.backgroundColor,
      text_color: theme.textColor,
      system_name: theme.systemName,
      description: theme.description,
      logo_emoji: theme.logoEmoji,
    })

    if (error) {
      console.error("Erro ao salvar tema:", error)
    }
  } catch (error) {
    console.error("Erro ao salvar tema:", error)
  }
}

export function applyThemeColors(theme: ThemeConfig): void {
  if (typeof document === "undefined") return

  document.documentElement.style.setProperty("--primary-color", theme.primaryColor)
  document.documentElement.style.setProperty("--secondary-color", theme.secondaryColor)
  document.documentElement.style.setProperty("--accent-color", theme.accentColor)
  document.documentElement.style.setProperty("--background-color", theme.backgroundColor)
  document.documentElement.style.setProperty("--text-color", theme.textColor)
}
