"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type ThemeConfig,
  defaultTheme,
  applyThemeColors,
  loadThemeFromDatabase,
  saveThemeToDatabase,
} from "@/lib/theme"

const ThemeContext = createContext<{
  theme: ThemeConfig
  updateTheme: (updates: Partial<ThemeConfig>) => Promise<void>
  loadTheme: () => Promise<void>
}>({
  theme: defaultTheme,
  updateTheme: async () => {},
  loadTheme: async () => {},
})

export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [loading, setLoading] = useState(true)

  // Função para carregar tema do banco
  const loadTheme = async () => {
    try {
      const loadedTheme = await loadThemeFromDatabase()
      setTheme(loadedTheme)
      applyThemeColors(loadedTheme)
    } catch (error) {
      console.error("Erro ao carregar tema:", error)
      applyThemeColors(defaultTheme)
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar tema
  const updateTheme = async (updates: Partial<ThemeConfig>) => {
    try {
      const newTheme = { ...theme, ...updates }

      // Salvar no banco de dados
      await saveThemeToDatabase(newTheme)

      // Atualizar estado local
      setTheme(newTheme)
      applyThemeColors(newTheme)
    } catch (error) {
      console.error("Erro ao atualizar tema:", error)
      throw error
    }
  }

  // Carregar tema na inicialização
  useEffect(() => {
    loadTheme()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <ThemeContext.Provider value={{ theme, updateTheme, loadTheme }}>{children}</ThemeContext.Provider>
}
