"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default function ClientRedirect() {
  const router = useRouter()

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
        }
        // Se não logado, permanece na landing page (não faz nada)
      } catch (error) {
        console.error("Error checking user:", error)
        // Em caso de erro, permanece na landing page
      }
    }

    // Delay pequeno para não interferir com o carregamento inicial
    const timer = setTimeout(checkUser, 100)
    return () => clearTimeout(timer)
  }, [router])

  // Componente invisível - não renderiza nada
  return null
} 