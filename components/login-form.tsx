"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import { signIn } from "@/lib/auth" // Importa a função signIn manual
import { useTheme } from "@/components/theme-provider"
import RegisterForm from "./register-form"
import { supabase } from "@/lib/supabase"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showRegister, setShowRegister] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState(false)
  const [checkingRegistration, setCheckingRegistration] = useState(true)
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    // Verificar se o cadastro público está habilitado
    const checkRegistrationSetting = async () => {
      try {
        setCheckingRegistration(true)
        console.log("🔍 Verificando configuração de registro público...")

        // Buscar a configuração específica da tabela system_settings
        const { data, error } = await supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "allow_public_registration")
          .single()

        console.log("📊 Dados retornados:", data)
        console.log("❌ Erro (se houver):", error)

        if (error) {
          console.error("Erro ao buscar configuração:", error)
          // Se houver erro, assumir que o registro está desabilitado por segurança
          setAllowRegistration(false)
        } else if (data) {
          // Verificar o valor retornado - pode ser boolean, string ou number
          let isAllowed = false

          if (typeof data.setting_value === "boolean") {
            isAllowed = data.setting_value
          } else if (typeof data.setting_value === "string") {
            isAllowed = data.setting_value.toLowerCase() === "true" || data.setting_value === "1"
          } else if (typeof data.setting_value === "number") {
            isAllowed = data.setting_value === 1
          }

          console.log("✅ Registro público permitido:", isAllowed)
          setAllowRegistration(isAllowed)
        } else {
          console.log("⚠️ Configuração não encontrada, desabilitando registro")
          setAllowRegistration(false)
        }
      } catch (error) {
        console.error("💥 Erro inesperado ao verificar configuração:", error)
        setAllowRegistration(false)
      } finally {
        setCheckingRegistration(false)
      }
    }

    checkRegistrationSetting()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { user, error: authError } = await signIn(email, password) // Chama a função signIn manual

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user))

        if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {theme.logoIcon || "🤖"}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{theme.systemName}</CardTitle>
          <p className="text-gray-600">Entre na sua conta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: theme.primaryColor }}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Seção de registro - só aparece se permitido e não estiver verificando */}
          {!checkingRegistration && allowRegistration && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Não tem uma conta?</p>
              <Button variant="outline" onClick={() => setShowRegister(true)} className="w-full" disabled={loading}>
                Criar Conta
              </Button>
            </div>
          )}

          {/* Mensagem de carregamento */}
          {checkingRegistration && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Verificando configurações...</p>
            </div>
          )}

          {/* Debug info - só em desenvolvimento */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <p>Debug: Registration allowed = {allowRegistration.toString()}</p>
              <p>Debug: Checking = {checkingRegistration.toString()}</p>
              <p>Debug: Show register button = {(!checkingRegistration && allowRegistration).toString()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Named export para compatibilidade
export { LoginForm }
export default LoginForm
