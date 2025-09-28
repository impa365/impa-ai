"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface EmbedPageProps {
  params: {
    path: string[]
  }
}

function EmbedDynamicContent({ params }: EmbedPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Construir caminho a partir dos parâmetros
    const pathSegments = params.path || []
    const targetPath = '/' + pathSegments.join('/')
    
    // Obter query parameters
    const query = searchParams.toString()
    
    // Construir URL final
    const targetUrl = query ? `${targetPath}?${query}` : targetPath
    
    console.log('🎯 [EMBED-DYNAMIC] Redirecionando para:', targetUrl)
    console.log('📍 Path segments:', pathSegments)
    console.log('🔗 Query params:', query)
    
    // Redirecionar para a página desejada
    router.replace(targetUrl)
  }, [router, params.path, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando Painel</h2>
        <p className="text-gray-500">Preparando interface para incorporação...</p>
      </div>
    </div>
  )
}

export default function EmbedDynamicPage({ params }: EmbedPageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando</h2>
          <p className="text-gray-500">Preparando redirecionamento...</p>
        </div>
      </div>
    }>
      <EmbedDynamicContent params={params} />
    </Suspense>
  )
} 