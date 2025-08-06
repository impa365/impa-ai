import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider, defaultTheme } from "@/components/theme-provider"
import { getBaseUrl } from "@/lib/dynamic-url"

const inter = Inter({ subsets: ["latin"] })

// Metadata otimizada para SEO e AIO com URL dinâmica
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl()
  
  return {
    title: {
      default: "Sistema de IA - Plataforma Enterprise de Agentes Inteligentes",
      template: "%s | Sistema de IA"
    },
    description: "Plataforma enterprise para criação e gerenciamento de agentes de IA conversacionais com integração nativa ao WhatsApp. Arquitetura escalável, APIs robustas e tecnologias de ponta.",
    keywords: [
      "IA conversacional",
      "WhatsApp Business", 
      "Agentes inteligentes",
      "Automação",
      "Chatbot",
      "Evolution API",
      "OpenAI",
      "n8n",
      "Enterprise"
    ],
    authors: [{ name: "IMPA AI Team" }],
    creator: "IMPA AI",
    publisher: "IMPA AI",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: baseUrl,
      title: "Sistema de IA - Plataforma Enterprise de Agentes Inteligentes",
      description: "Plataforma enterprise para criação e gerenciamento de agentes de IA conversacionais com integração nativa ao WhatsApp.",
      siteName: "Sistema de IA",
      images: [
        {
          url: `${baseUrl}/placeholder-logo.png`,
          width: 1200,
          height: 630,
          alt: "Sistema de IA - Plataforma Enterprise",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Sistema de IA - Plataforma Enterprise de Agentes Inteligentes",
      description: "Plataforma enterprise para criação e gerenciamento de agentes de IA conversacionais com integração nativa ao WhatsApp.",
      images: [`${baseUrl}/placeholder-logo.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "seu-google-verification-code",
      yandex: "seu-yandex-verification-code",
      yahoo: "seu-yahoo-verification-code",
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Meta tags para AIO (AI Optimization) */}
        <meta name="ai-optimization" content="enabled" />
        <meta name="ai-content-type" content="enterprise-platform" />
        <meta name="ai-target-audience" content="business,developers,enterprise" />
        <meta name="ai-features" content="whatsapp-integration,conversational-ai,automation" />
        
        {/* Meta tags para SEO */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sistema de IA" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
