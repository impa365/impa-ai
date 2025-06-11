import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Impa AI", // Adicione um título padrão
  description: "Sistema de gestão de agentes IA",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          // disableTransitionOnChange // Considere adicionar se tiver problemas com transições de tema
        >
          {/* Seu DynamicTitle e outros componentes podem vir aqui se necessário */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
