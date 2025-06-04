"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/components/theme-provider"

interface RegisterFormProps {
  onBackToLogin: () => void
}

export default function RegisterForm({ onBackToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validações
    if (!formData.fullName.trim()) {
      setError("Nome completo é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setError("Email é obrigatório")
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Senhas não coincidem")
      setLoading(false)
      return
    }

    try {
      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", formData.email.trim())
        .single()

      if (existingUser) {
        setError("Este email já está cadastrado")
        setLoading(false)
        return
      }

      // Buscar configurações padrão do sistema
      const { data: defaultLimitSetting } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "default_whatsapp_connections_limit")
        .single()

      const defaultLimit = defaultLimitSetting?.setting_value || 2

      // Criar usuário
      const { data: newUser, error: userError } = await supabase
        .from("user_profiles")
        .insert([
          {
            full_name: formData.fullName.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(), // Garantir que não há espaços extras
            role: "user",
            status: "active",
          },
        ])
        .select()
        .single()

      if (userError) throw userError

      // Criar configurações do usuário
      const { error: settingsError } = await supabase.from("user_settings").insert([
        {
          user_id: newUser.id,
          whatsapp_connections_limit: defaultLimit,
        },
      ])

      if (settingsError) throw settingsError

      setSuccess(true)
      setTimeout(() => {
        onBackToLogin()
      }, 2000)
    } catch (error: any) {
      console.error("Erro ao criar conta:", error)
      if (error.code === "23505") {
        setError("Este email já está em uso")
      } else {
        setError("Erro ao criar conta. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✓</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Conta criada com sucesso!</h2>
            <p className="text-gray-600 mb-4">
              Sua conta foi criada. Você será redirecionado para o login em instantes.
            </p>
            <div className="w-8 h-8 mx-auto">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
          <p className="text-gray-600">Criar nova conta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Seu nome completo"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: theme.primaryColor }}
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={onBackToLogin}
              disabled={loading}
              className="gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
