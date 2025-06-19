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

// Helper function to fetch theme server-side via API (SEGURO)
async function getInitialTheme(): Promise<ThemeConfig | null> {
  try {
    // Usar a API interna - NUNCA acessar Supabase diretamente
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/theme`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn("Erro ao carregar tema via API, usando padrão")
      return null
    }

    const themeData = await response.json()
    return themeData as ThemeConfig
  } catch (error) {
    console.error("Erro ao buscar tema inicial:", error)
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
