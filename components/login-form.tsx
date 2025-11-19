"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import RegisterForm from "./register-form"
import { publicApi } from "@/lib/api-client"

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
    // Verificar se o cadastro público está habilitado usando a API
    const checkRegistrationSetting = async () => {
      try {
        setCheckingRegistration(true)

        // Usar a API pública ao invés de acessar Supabase diretamente
        const { data, error } = await publicApi.getConfig()

        if (error) {
          // Se houver erro, assumir que o registro está desabilitado por segurança
          setAllowRegistration(false)
        } else if (data && data.settings) {
          // Verifique se data E data.settings existem
          // Certifique-se de que está comparando com booleano true
          const isAllowed = data.settings.allowPublicRegistration === true
          setAllowRegistration(isAllowed)
        } else if (data && !data.settings) {
          setAllowRegistration(false)
        } else {
          setAllowRegistration(false)
        }
      } catch (error: any) {
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
      // Usar a API de login ao invés de função manual
      const { data, error: loginError } = await publicApi.login(email, password)

      if (loginError) {
        setError(loginError)
        setLoading(false)
        return
      }

      if (data?.user) {
        // Salvar dados do usuário no localStorage
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("isAuthenticated", "true")

        // Redirecionar baseado no role do usuário
        if (data.user.role === "super_admin") {
          router.push("/super-admin")
        } else if (data.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      } else {
        setError("Dados de login inválidos")
      }
    } catch (error: any) {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />
  }

  return (
    <Card className="w-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-500/20 border-red-500/30 text-red-100">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 pl-12 h-12 focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white text-sm font-medium">
              Senha
            </Label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/10 border border-white/20 text-white placeholder-gray-400 pl-12 pr-12 h-12 focus:bg-white/20 focus:border-blue-400 transition-all duration-200"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        {/* Seção de registro - só aparece se permitido e não estiver verificando */}
        {!checkingRegistration && allowRegistration && (
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-300">Não tem uma conta?</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setShowRegister(true)} 
              className="w-full mt-4 h-12 border border-white/30 text-white hover:bg-white/10 hover:border-white/50 hover:text-white rounded-xl transition-all duration-200 bg-transparent" 
              disabled={loading}
            >
              Criar Conta Gratuita
            </Button>
          </div>
        )}

        {/* Mensagem de carregamento */}
        {checkingRegistration && (
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Verificando configurações...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Named export para compatibilidade
export { LoginForm }
export default LoginForm
