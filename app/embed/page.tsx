"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function EmbedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Obter todos os parâmetros da URL
    const path = searchParams.get('path') || '/admin'
    const query = searchParams.toString()
    
    // Construir URL de destino
    let targetUrl = path
    if (query && !query.includes('path=')) {
      targetUrl += `?${query}`
    } else if (query) {
      // Remover o parâmetro path e manter os outros
      const newParams = new URLSearchParams(query)
      newParams.delete('path')
      const remainingQuery = newParams.toString()
      if (remainingQuery) {
        targetUrl += `?${remainingQuery}`
      }
    }

    console.log('🎯 [EMBED] Redirecionando para:', targetUrl)
    
    // Redirecionar para a página desejada
    router.replace(targetUrl)
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando Painel</h2>
        <p className="text-gray-500">Redirecionando para o painel administrativo...</p>
      </div>
    </div>
  )
} 