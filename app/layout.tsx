import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider, defaultTheme } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

// Metadata mínima - será sobrescrita pelo DynamicTitle
export const metadata: Metadata = {
  description: "Sistema de gestão",
  generator: "v0.dev",
}

// Layout SIMPLES - sem chamadas de banco
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider serverFetchedTheme={defaultTheme}>{children}</ThemeProvider>
      </body>
    </html>
  )
}
