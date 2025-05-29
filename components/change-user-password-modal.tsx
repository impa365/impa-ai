"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Key, Eye, EyeOff, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ChangeUserPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: any
  onSuccess: () => void
}

export default function ChangeUserPasswordModal({ open, onOpenChange, user, onSuccess }: ChangeUserPasswordModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({
      newPassword: password,
      confirmPassword: password,
    })
  }

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres"
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "A senha deve conter pelo menos uma letra minúscula"
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "A senha deve conter pelo menos uma letra maiúscula"
    }
    if (!/(?=.*\d)/.test(password)) {
      return "A senha deve conter pelo menos um número"
    }
    return null
  }

  const handleSave = async () => {
    if (!formData.newPassword.trim()) {
      setError("Nova senha é obrigatória")
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Senhas não coincidem")
      return
    }

    const passwordError = validatePassword(formData.newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Aqui você implementaria a lógica real de alteração de senha
      // Por enquanto, vamos simular um delay e sucesso
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simular atualização no banco (em um cenário real, você usaria uma função de admin)
      // const { error } = await supabase.auth.admin.updateUserById(user.id, { password: formData.newPassword })

      setSuccess("Senha alterada com sucesso!")

      // Log da ação administrativa
      await supabase.from("admin_logs").insert([
        {
          admin_id: "current_admin_id", // Você pegaria do contexto atual
          action: "password_change",
          target_user_id: user.id,
          details: `Senha alterada para usuário ${user.email}`,
          timestamp: new Date().toISOString(),
        },
      ])

      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        setFormData({ newPassword: "", confirmPassword: "" })
        setSuccess("")
      }, 2000)
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error)
      setError("Erro ao alterar senha")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    setSuccess("")
    setFormData({ newPassword: "", confirmPassword: "" })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Alterar Senha do Usuário
          </DialogTitle>
          <DialogDescription>
            Alterando senha para: <strong>{user?.full_name}</strong> ({user?.email})
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Digite a nova senha"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-8 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={generateRandomPassword}
                disabled={loading}
                title="Gerar senha aleatória"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres, com maiúscula, minúscula e número</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirme a nova senha"
              disabled={loading}
            />
          </div>

          {formData.newPassword && (
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${formData.newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className={formData.newPassword.length >= 8 ? "text-green-600" : "text-gray-500"}>
                  Pelo menos 8 caracteres
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${/(?=.*[a-z])/.test(formData.newPassword) ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className={/(?=.*[a-z])/.test(formData.newPassword) ? "text-green-600" : "text-gray-500"}>
                  Letra minúscula
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${/(?=.*[A-Z])/.test(formData.newPassword) ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className={/(?=.*[A-Z])/.test(formData.newPassword) ? "text-green-600" : "text-gray-500"}>
                  Letra maiúscula
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${/(?=.*\d)/.test(formData.newPassword) ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className={/(?=.*\d)/.test(formData.newPassword) ? "text-green-600" : "text-gray-500"}>
                  Pelo menos um número
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Alterando...
              </>
            ) : (
              "Alterar Senha"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
