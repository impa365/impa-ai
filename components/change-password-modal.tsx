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
import { changePassword } from "@/lib/auth"

interface ChangePasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: any
  onSuccess: () => void
}

export default function ChangePasswordModal({ open, onOpenChange, user, onSuccess }: ChangePasswordModalProps) {
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

  const handleSave = async () => {
    if (!formData.newPassword.trim()) {
      setError("Nova senha é obrigatória")
      return
    }

    if (formData.newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Senhas não coincidem")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Como admin, usar changePassword direto (não precisa da senha atual)
      const result = await changePassword(user.id, "", formData.newPassword)

      if (!result.success) {
        throw new Error(result.error || "Erro ao alterar senha")
      }

      setSuccess(`Senha alterada com sucesso para ${user.full_name}!`)
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        setFormData({ newPassword: "", confirmPassword: "" })
        setSuccess("")
      }, 2000)
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error)
      setError("Erro ao alterar senha: " + error.message)
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Key className="w-5 h-5" />
            Alterar Senha do Usuário
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Alterando senha para: <strong className="text-foreground">{user?.full_name}</strong> ({user?.email})
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="newPassword" className="text-foreground">
              Nova Senha *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Digite a nova senha"
                disabled={loading}
                className="text-foreground"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-8 top-0 h-full px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2 text-muted-foreground hover:text-foreground"
                onClick={generateRandomPassword}
                disabled={loading}
                title="Gerar senha aleatória"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-foreground">
              Confirmar Nova Senha *
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirme a nova senha"
              disabled={loading}
              className="text-foreground"
            />
          </div>

          <div className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <strong className="text-blue-800 dark:text-blue-200">🔐 Segurança:</strong>
            <span className="text-blue-700 dark:text-blue-300">
              {" "}
              As senhas são criptografadas automaticamente usando bcrypt antes de serem salvas no banco de dados.
            </span>
            <br />
            <strong className="text-blue-800 dark:text-blue-200">Importante:</strong>
            <span className="text-blue-700 dark:text-blue-300">
              {" "}
              Comunique a nova senha ao usuário por um canal seguro.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading} className="text-foreground">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || success !== ""}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
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
