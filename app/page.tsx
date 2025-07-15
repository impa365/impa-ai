"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DynamicTitle from "@/components/dynamic-title"
import { getCurrentUser } from "@/lib/auth"
import { useSystemName } from "@/hooks/use-system-config"

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { systemName, isLoading: isLoadingSystemName } = useSystemName()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = getCurrentUser()
        if (user) {
          // Se usuário logado, redirecionar para dashboard apropriado
          if (user.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/dashboard")
          }
        } else {
          // Se não logado, mostrar landing page
          router.push("/landing")
        }
      } catch (error) {
        console.error("Error checking user:", error)
        // Em caso de erro, mostrar landing page
        router.push("/landing")
      }
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <>
        <DynamicTitle />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-8"></div>
            <p className="text-white text-xl">
              Carregando {systemName || "sistema"}...
            </p>
          </div>
        </div>
      </>
    )
  }

  // Esta página não deveria ser renderizada, pois sempre redireciona
  return (
    <>
      <DynamicTitle />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-pulse text-white text-xl">Redirecionando...</div>
        </div>
      </div>
    </>
  )
}
