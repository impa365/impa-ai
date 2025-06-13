import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { RuntimeConfigProvider } from "@/components/runtime-config-provider" // Já importado

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Impa AI - Plataforma de Construção de Agentes",
  description: "Plataforma completa para criação e gerenciamento de agentes de IA",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RuntimeConfigProvider>{children}</RuntimeConfigProvider> {/* Já em uso */}
        </ThemeProvider>
      </body>
    </html>
  )
}
