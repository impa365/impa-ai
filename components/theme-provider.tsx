'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { createContext, useContext } from 'react'

interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  borderRadius: number
  brandingEnabled: boolean,
}

const defaultTheme: ThemeConfig = {
  primaryColor: '#0070f3',
  secondaryColor: '#3291ff',
  borderRadius: 5,
  brandingEnabled: true,
}

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

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
