import type { Metadata } from "next"
import { Suspense } from "react"
import LandingPage from "./landing/page"
import ClientRedirect from "@/components/client-redirect"
import { getBaseUrl } from "@/lib/dynamic-url"

// Metadata otimizada para SEO e AIO com URL dinâmica
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl()
  
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

export default function HomePage() {
  return (
    <div>
      {/* Renderiza a landing page diretamente para SEO/AIO */}
      <LandingPage />
      
      {/* Componente client-side para redirecionamento de usuários logados */}
      <Suspense fallback={null}>
        <ClientRedirect />
      </Suspense>
    </div>
  )
}
