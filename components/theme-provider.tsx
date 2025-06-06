"use client"

import { useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import {
  type ThemeConfig,
  ThemeContext,
  defaultTheme,
  loadThemeFromDatabase,
  saveThemeToDatabase,
  applyThemeColors,
} from "@/lib/theme"

// Re-export the useTheme hook from lib/theme
export { useTheme } from "@/lib/theme"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [isLoading, setIsLoading] = useState(true)

  const loadTheme = async () => {
    try {
      setIsLoading(true)
      const loadedTheme = await loadThemeFromDatabase()
      setTheme(loadedTheme || defaultTheme)
      applyThemeColors(loadedTheme || defaultTheme)
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
      await saveThemeToDatabase(newTheme)
    } catch (error) {
      console.error("Error updating theme:", error)
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
