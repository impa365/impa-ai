"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Eye, EyeOff } from "lucide-react"
import { signIn } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { theme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { user, error: authError } = await signIn(email, password)

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

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {theme.logoIcon === "🤖" ? (
                <Bot className="w-7 h-7" />
              ) : (
                <span className="text-2xl">{theme.logoIcon}</span>
              )}
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

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Contas de teste:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                <strong>Admin:</strong> admin@impa365.com / impa@senha2025
              </div>
              <div>
                <strong>Usuário:</strong> lorranimpa@gmail.com / impa@senha2025
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
