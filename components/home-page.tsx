"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import LoginForm from "@/components/login-form"
import DynamicTitle from "@/components/dynamic-title"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { theme, isLoading: themeLoading } = useTheme()
  const router = useRouter()

  useEffect(() => {
    // Verificar se há usuário logado
    const checkUser = () => {
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)

          // Redirecionar baseado no role
          if (parsedUser.role === "admin") {
            router.push("/admin")
            return
          } else {
            router.push("/dashboard")
            return
          }
        }
      } catch (error) {
        console.error("Erro ao verificar usuário:", error)
        localStorage.removeItem("user")
      }

      setIsLoading(false)
    }

    // Só verificar usuário após o tema estar carregado
    if (!themeLoading) {
      checkUser()
    }
  }, [themeLoading, router])

  // Mostrar loading enquanto carrega tema ou verifica usuário
  if (themeLoading || isLoading) {
    return (
      <>
        <DynamicTitle />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </>
    )
  }

  // Se há usuário, não mostrar login (redirecionamento já aconteceu)
  if (user) {
    return (
      <>
        <DynamicTitle />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        </div>
      </>
    )
  }

  // Mostrar formulário de login
  return (
    <>
      <DynamicTitle />
      <LoginForm />
    </>
  )
}
