import type { Metadata } from "next"
import { Suspense } from "react"
import LandingPage from "./landing/page"
import ClientRedirect from "@/components/client-redirect"

// Metadata otimizada para SEO e AIO
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sistema de IA - Plataforma Enterprise de Agentes Inteligentes",
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
    authors: [{ name: "Comunidade IMPA" }],
    creator: "IMPA AI",
    publisher: "IMPA AI",
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
  }
}

export default function HomePage() {
  return (
    <>
      {/* Renderização Server-Side da Landing Page para SEO/AIO */}
      <LandingPage />
      
      {/* Redirecionamento Client-Side apenas para usuários logados */}
      <Suspense fallback={null}>
        <ClientRedirect />
      </Suspense>
    </>
  )
}
