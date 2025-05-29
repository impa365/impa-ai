"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import {
  ThemeContext,
  type ThemeConfig,
  defaultTheme,
  loadThemeFromDatabase,
  saveThemeToDatabase,
  applyThemeColors,
} from "@/lib/theme"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<ThemeConfig>(defaultTheme)

  const updateTheme = React.useCallback(
    async (updates: Partial<ThemeConfig>) => {
      const newTheme = { ...theme, ...updates }
      setTheme(newTheme)
      applyThemeColors(newTheme)
      await saveThemeToDatabase(newTheme)
    },
    [theme],
  )

  const loadTheme = React.useCallback(async () => {
    try {
      const loadedTheme = await loadThemeFromDatabase()
      setTheme(loadedTheme)
      applyThemeColors(loadedTheme)
    } catch (error) {
      console.error("Erro ao carregar tema:", error)
      setTheme(defaultTheme)
      applyThemeColors(defaultTheme)
    }
  }, [])

  React.useEffect(() => {
    loadTheme()
  }, [loadTheme])

  const contextValue = React.useMemo(
    () => ({
      theme,
      updateTheme,
      loadTheme,
    }),
    [theme, updateTheme, loadTheme],
  )

  return (
    <NextThemesProvider {...props}>
      <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
    </NextThemesProvider>
  )
}

// Export the useTheme hook from lib/theme
export { useTheme } from "@/lib/theme"
