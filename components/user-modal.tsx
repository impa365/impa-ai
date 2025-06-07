"use client"

import { useState, useEffect } from "react"
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

const DEFAULT_WHATSAPP_LIMIT = 1
const DEFAULT_AGENTS_LIMIT = 5

export default function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user",
    status: "active",
    whatsapp_limit: DEFAULT_WHATSAPP_LIMIT,
    agents_limit: DEFAULT_AGENTS_LIMIT,
  })

  useEffect(() => {
    const fetchUserData = async () => {
      if (user && open) {
        setLoadingData(true)
        try {
          const { data: userData, error: userError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (userError) throw userError

          const { data: settingsData } = await supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", user.id)
            .single()

          setFormData({
            full_name: userData.full_name || "",
            email: userData.email || "",
            role: userData.role || "user",
            status: userData.status || "active",
            whatsapp_limit: settingsData?.whatsapp_connections_limit || DEFAULT_WHATSAPP_LIMIT,
            agents_limit: settingsData?.agents_limit || DEFAULT_AGENTS_LIMIT,
          })
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
          setFormData({
            full_name: user.full_name || "",
            email: user.email || "",
            role: user.role || "user",
            status: user.status || "active",
            whatsapp_limit: user.whatsapp_connections_limit || DEFAULT_WHATSAPP_LIMIT,
            agents_limit: user.agents_limit || DEFAULT_AGENTS_LIMIT,
          })
        } finally {
          setLoadingData(false)
        }
      } else if (!user && open) {
        setFormData({
          full_name: "",
          email: "",
          role: "user",
          status: "active",
          whatsapp_limit: DEFAULT_WHATSAPP_LIMIT,
          agents_limit: DEFAULT_AGENTS_LIMIT,
        })
      }
    }

    if (open) {
      fetchUserData()
    } else {
      setError("")
    }
  }, [user, open])

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError("Nome e email são obrigatórios")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido")
      return
    }

    setLoading(true)
    setError("")

    try {
      let emailCheckQuery = supabase.from("user_profiles").select("id").eq("email", formData.email.trim())

      if (user) {
        emailCheckQuery = emailCheckQuery.neq("id", user.id)
      }

      const { data: existingUserWithEmail, error: emailCheckError } = await emailCheckQuery.maybeSingle()

      if (emailCheckError) {
        console.error("Erro ao verificar email:", emailCheckError)
        throw new Error("Erro ao verificar duplicidade de email.")
      }

      if (existingUserWithEmail) {
        setError("Este email já está em uso por outro usuário.")
        setLoading(false)
        return
      }

      let newUser

      if (user) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            role: formData.role,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (profileError) throw profileError

        const { error: settingsError } = await supabase.from("user_settings").upsert(
          {
            user_id: user ? user.id : newUser ? newUser.id : undefined,
            whatsapp_connections_limit: formData.whatsapp_limit,
            agents_limit: formData.agents_limit,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        if (settingsError) throw settingsError
      } else {
        const { data: newUserResult, error: profileError } = await supabase
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

        newUser = newUserResult

        if (profileError) throw profileError
        if (!newUser) throw new Error("Falha ao criar perfil do usuário.")

        const { error: settingsError } = await supabase.from("user_settings").insert([
          {
            user_id: newUser.id,
            whatsapp_connections_limit: formData.whatsapp_limit,
            agents_limit: formData.agents_limit,
          },
        ])

        if (settingsError) throw settingsError
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error)
      if (error.message !== "Este email já está em uso por outro usuário." && error.code !== "23505") {
        setError("Erro ao salvar usuário: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <User className="w-5 h-5" />
            {user ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {user
              ? `Editando: ${formData.full_name || formData.email || user.full_name || user.email}`
              : "Preencha os dados do novo usuário"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
          </Alert>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Carregando dados do usuário...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-foreground">
                Nome Completo *
              </Label>
              <Input
                id="fullName"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome completo do usuário"
                disabled={loading}
                className="text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-foreground">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={loading}
                className="text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role" className="text-foreground">
                  Função
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-foreground">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="text-foreground">
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
              <Label htmlFor="whatsappLimit" className="text-foreground">
                Limite de Conexões WhatsApp
              </Label>
              <Input
                id="whatsappLimit"
                type="number"
                value={formData.whatsapp_limit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsapp_limit: Number.parseInt(e.target.value) || DEFAULT_WHATSAPP_LIMIT,
                  })
                }
                min="0"
                max="100"
                disabled={loading}
                className="text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="agentsLimit" className="text-foreground">
                Limite de Agentes IA
              </Label>
              <Input
                id="agentsLimit"
                type="number"
                value={formData.agents_limit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    agents_limit: Number.parseInt(e.target.value) || DEFAULT_AGENTS_LIMIT,
                  })
                }
                min="0"
                max="100"
                disabled={loading}
                className="text-foreground"
              />
            </div>

            {user && (
              <div className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <strong className="text-blue-800 dark:text-blue-200">Dica:</strong>
                <span className="text-blue-700 dark:text-blue-300">
                  {" "}
                  Para alterar a senha deste usuário, use o botão específico "Alterar Senha" na lista de usuários.
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading || loadingData} className="text-foreground">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || loadingData}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
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
