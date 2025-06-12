import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script" // Importar o componente Script
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Impa AI",
  description: "Sistema de gestão de agentes IA",
  generator: "v0.dev",
}

// Função para obter as variáveis de ambiente no servidor
const getRuntimeConfig = () => {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const runtimeConfig = getRuntimeConfig()

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Script para injetar as variáveis de ambiente em window */}
        <Script
          id="runtime-env-vars"
          strategy="beforeInteractive" // Carregar antes de qualquer código interativo do Next.js
          dangerouslySetInnerHTML={{
            __html: `window.__RUNTIME_CONFIG__ = ${JSON.stringify(
              runtimeConfig,
            )}; console.log('🌍 Runtime config injetado:', window.__RUNTIME_CONFIG__);`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
