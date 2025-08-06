import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider, defaultTheme } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

// Metadata otimizada para SEO e AIO
export const metadata: Metadata = {
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
    "Enterprise",
    "Inteligência Artificial",
    "Automação de Atendimento",
    "WhatsApp API"
  ],
  authors: [{ name: "Comunidade IMPA" }],
  creator: "IMPA AI",
  publisher: "IMPA AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://seu-dominio.com'),
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
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://seu-dominio.com",
    title: "Sistema de IA - Plataforma Enterprise de Agentes Inteligentes",
    description: "Plataforma enterprise para criação e gerenciamento de agentes de IA conversacionais com integração nativa ao WhatsApp.",
    siteName: "Sistema de IA",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sistema de IA - Plataforma Enterprise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de IA - Plataforma Enterprise",
    description: "Plataforma enterprise para criação e gerenciamento de agentes de IA conversacionais.",
    images: ["/images/twitter-image.png"],
  },
  alternates: {
    canonical: "https://seu-dominio.com",
  },
  verification: {
    google: "seu-google-verification-code",
    yandex: "seu-yandex-verification-code", 
    yahoo: "seu-yahoo-verification-code",
  },
  other: {
    "google-site-verification": "seu-google-verification-code",
    "msvalidate.01": "seu-bing-verification-code",
    "yandex-verification": "seu-yandex-verification-code",
  }
}

// Layout SIMPLES - sem chamadas de banco
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Meta tags adicionais para AIO */}
        <meta name="ai-optimization" content="enabled" />
        <meta name="ai-description" content="Plataforma enterprise para criação e gerenciamento de agentes de IA conversacionais com integração nativa ao WhatsApp. Sistema completo com arquitetura escalável, APIs robustas e tecnologias de ponta para automação de atendimento." />
        <meta name="ai-keywords" content="IA conversacional, WhatsApp Business, Agentes inteligentes, Automação, Chatbot, Evolution API, OpenAI, n8n, Enterprise, Inteligência Artificial" />
        <meta name="ai-category" content="Software, Tecnologia, IA, Automação" />
        <meta name="ai-target-audience" content="Empresas, Desenvolvedores, Profissionais de Marketing, Agências" />
        
        {/* Schema.org para melhor AIO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Sistema de IA",
              "description": "Plataforma enterprise para criação e gerenciamento de agentes de IA conversacionais",
              "url": "https://seu-dominio.com",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL"
              },
              "author": {
                "@type": "Organization",
                "name": "Comunidade IMPA"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider serverFetchedTheme={defaultTheme}>{children}</ThemeProvider>
      </body>
    </html>
  )
}
