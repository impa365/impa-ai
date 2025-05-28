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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: any
  onSuccess: () => void
}

export default function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    role: user?.role || "user",
    status: user?.status || "active",
    whatsapp_limit: user?.whatsapp_connections_limit || 2,
  })

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError("Nome e email são obrigatórios")
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido")
      return
    }

    setLoading(true)
    setError("")

    try {
      if (user) {
        // Editar usuário existente
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            role: formData.role,
            status: formData.status,
          })
          .eq("id", user.id)

        if (profileError) throw profileError

        // Atualizar configurações do usuário
        const { error: settingsError } = await supabase.from("user_settings").upsert({
          user_id: user.id,
          whatsapp_connections_limit: formData.whatsapp_limit,
        })

        if (settingsError) throw settingsError
      } else {
        // Criar novo usuário
        const { data: newUser, error: profileError } = await supabase
          .from("user_profiles")
          .insert([
            {
              full_name: formData.full_name.trim(),
              email: formData.email.trim(),
              role: formData.role,
              status: formData.status,
            },
          ])
          .select()
          .single()

        if (profileError) throw profileError

        // Criar configurações do usuário
        const { error: settingsError } = await supabase.from("user_settings").insert([
          {
            user_id: newUser.id,
            whatsapp_connections_limit: formData.whatsapp_limit,
          },
        ])

        if (settingsError) throw settingsError
      }

      onSuccess()
      onOpenChange(false)
      setFormData({
        full_name: "",
        email: "",
        role: "user",
        status: "active",
        whatsapp_limit: 2,
      })
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error)
      if (error.code === "23505") {
        setError("Este email já está em uso")
      } else {
        setError("Erro ao salvar usuário")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    setFormData({
      full_name: user?.full_name || "",
      email: user?.email || "",
      role: user?.role || "user",
      status: user?.status || "active",
      whatsapp_limit: user?.whatsapp_connections_limit || 2,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {user ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription>
            {user ? "Altere as informações do usuário" : "Preencha os dados do novo usuário"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Nome completo do usuário"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="hibernated">Hibernado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="whatsappLimit">Limite de Conexões WhatsApp</Label>
            <Input
              id="whatsappLimit"
              type="number"
              value={formData.whatsapp_limit}
              onChange={(e) => setFormData({ ...formData, whatsapp_limit: Number.parseInt(e.target.value) || 2 })}
              min="1"
              max="10"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : user ? (
              "Salvar Alterações"
            ) : (
              "Criar Usuário"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
