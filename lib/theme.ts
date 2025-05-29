"use client"

import { createContext, useContext } from "react"
import { supabase } from "./supabase"

export interface ThemeConfig {
  systemName: string
  description: string
  logoEmoji: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  cardColor: string
  mutedColor: string
  destructiveColor: string
  ringColor: string
  logoUrl?: string
  faviconUrl?: string
}

export const defaultTheme: ThemeConfig = {
  systemName: "Luna AI",
  description: "Plataforma de construção de agentes de IA",
  logoEmoji: "🤖",
  primaryColor: "#0f172a",
  secondaryColor: "#f1f5f9",
  accentColor: "#3b82f6",
  backgroundColor: "#ffffff",
  textColor: "#0f172a",
  borderColor: "#e2e8f0",
  cardColor: "#ffffff",
  mutedColor: "#f8fafc",
  destructiveColor: "#ef4444",
  ringColor: "#3b82f6",
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
    const { data, error } = await supabase.from("global_theme_config").select("*").single()

    if (error) {
      console.error("Error loading theme:", error)
      return defaultTheme
    }

    return {
      systemName: data.system_name || defaultTheme.systemName,
      description: data.description || defaultTheme.description,
      logoEmoji: data.logo_emoji || defaultTheme.logoEmoji,
      primaryColor: data.primary_color || defaultTheme.primaryColor,
      secondaryColor: data.secondary_color || defaultTheme.secondaryColor,
      accentColor: data.accent_color || defaultTheme.accentColor,
      backgroundColor: data.background_color || defaultTheme.backgroundColor,
      textColor: data.text_color || defaultTheme.textColor,
      borderColor: data.border_color || defaultTheme.borderColor,
      cardColor: data.card_color || defaultTheme.cardColor,
      mutedColor: data.muted_color || defaultTheme.mutedColor,
      destructiveColor: data.destructive_color || defaultTheme.destructiveColor,
      ringColor: data.ring_color || defaultTheme.ringColor,
      logoUrl: data.logo_url,
      faviconUrl: data.favicon_url,
    }
  } catch (error) {
    console.error("Error loading theme from database:", error)
    return defaultTheme
  }
}

export async function saveThemeToDatabase(theme: ThemeConfig): Promise<boolean> {
  try {
    const { error } = await supabase.from("global_theme_config").upsert({
      id: 1,
      system_name: theme.systemName,
      description: theme.description,
      logo_emoji: theme.logoEmoji,
      primary_color: theme.primaryColor,
      secondary_color: theme.secondaryColor,
      accent_color: theme.accentColor,
      background_color: theme.backgroundColor,
      text_color: theme.textColor,
      border_color: theme.borderColor,
      card_color: theme.cardColor,
      muted_color: theme.mutedColor,
      destructive_color: theme.destructiveColor,
      ring_color: theme.ringColor,
      logo_url: theme.logoUrl,
      favicon_url: theme.faviconUrl,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving theme:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error saving theme to database:", error)
    return false
  }
}

export function applyThemeColors(theme: ThemeConfig) {
  if (typeof document === "undefined") return

  const root = document.documentElement

  // Apply CSS custom properties
  root.style.setProperty("--primary", theme.primaryColor)
  root.style.setProperty("--secondary", theme.secondaryColor)
  root.style.setProperty("--accent", theme.accentColor)
  root.style.setProperty("--background", theme.backgroundColor)
  root.style.setProperty("--foreground", theme.textColor)
  root.style.setProperty("--border", theme.borderColor)
  root.style.setProperty("--card", theme.cardColor)
  root.style.setProperty("--muted", theme.mutedColor)
  root.style.setProperty("--destructive", theme.destructiveColor)
  root.style.setProperty("--ring", theme.ringColor)
}

// Theme presets for quick selection
export const themePresets = {
  default: {
    systemName: "Luna AI",
    primaryColor: "#0f172a",
    secondaryColor: "#f1f5f9",
    accentColor: "#3b82f6",
    logoEmoji: "🤖",
  },
  blue: {
    systemName: "Luna AI",
    primaryColor: "#1e40af",
    secondaryColor: "#dbeafe",
    accentColor: "#3b82f6",
    logoEmoji: "💙",
  },
  green: {
    systemName: "Luna AI",
    primaryColor: "#166534",
    secondaryColor: "#dcfce7",
    accentColor: "#22c55e",
    logoEmoji: "💚",
  },
  purple: {
    systemName: "Luna AI",
    primaryColor: "#7c3aed",
    secondaryColor: "#ede9fe",
    accentColor: "#8b5cf6",
    logoEmoji: "💜",
  },
}
