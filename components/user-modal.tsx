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
    password: "",
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

          // Buscar configurações do usuário
          let settingsData = null
          try {
            const { data, error: settingsError } = await supabase
              .from("user_settings")
              .select("*")
              .eq("user_id", user.id)
              .single()

            if (!settingsError) {
              settingsData = data
            }
          } catch (settingsErr) {
            console.error("Erro ao buscar configurações do usuário:", settingsErr)
          }

          setFormData({
            full_name: userData.full_name || "",
            email: userData.email || "",
            password: "",
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
            password: "",
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
          password: "",
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

    // Validação de senha para novos usuários
    if (!user && !formData.password.trim()) {
      setError("Senha é obrigatória para novos usuários")
      return
    }

    if (!user && formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
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
      // Verificar se o email já existe (exceto para o usuário atual)
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

      let userId = user?.id

      // Processar usuário existente ou novo
      if (user) {
        // Atualizar usuário existente
        const updateData = {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          status: formData.status,
          updated_at: new Date().toISOString(),
        }

        // Adicionar senha apenas se fornecida
        if (formData.password.trim()) {
          updateData.password = formData.password.trim()
        }

        console.log("Atualizando usuário:", user.id, updateData)
        const { error: profileError } = await supabase.from("user_profiles").update(updateData).eq("id", user.id)

        if (profileError) {
          console.error("Erro ao atualizar perfil:", profileError)
          throw profileError
        }
      } else {
        // Criar novo usuário
        console.log("Criando novo usuário")
        const { data: newUser, error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(),
            role: formData.role,
            status: formData.status,
          })
          .select()
          .single()

        if (profileError) {
          console.error("Erro ao criar usuário:", profileError)
          throw profileError
        }

        if (!newUser) {
          throw new Error("Falha ao criar perfil do usuário. Nenhum dado retornado.")
        }

        console.log("Novo usuário criado:", newUser.id)
        userId = newUser.id
      }

      // Agora vamos tentar atualizar as configurações do usuário
      // Mas não vamos falhar se isso não funcionar
      if (userId) {
        try {
          // Primeiro, verificar se a tabela user_settings existe
          const { error: tableCheckError } = await supabase
            .from("user_settings")
            .select("count(*)")
            .limit(1)
            .throwOnError()

          if (tableCheckError) {
            console.warn("A tabela user_settings pode não existir:", tableCheckError)
            // Não vamos falhar aqui, apenas logar o aviso
          } else {
            // A tabela existe, vamos tentar inserir/atualizar
            // Primeiro verificar se já existe um registro para este usuário
            const { data: existingSettings } = await supabase
              .from("user_settings")
              .select("user_id")
              .eq("user_id", userId)
              .maybeSingle()

            if (existingSettings) {
              // Atualizar configurações existentes
              const { error: updateError } = await supabase
                .from("user_settings")
                .update({
                  whatsapp_connections_limit: formData.whatsapp_limit,
                  agents_limit: formData.agents_limit,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId)

              if (updateError) {
                console.warn("Erro ao atualizar configurações:", updateError)
                // Não vamos falhar aqui, apenas logar o aviso
              }
            } else {
              // Inserir novas configurações
              const { error: insertError } = await supabase.from("user_settings").insert({
                user_id: userId,
                whatsapp_connections_limit: formData.whatsapp_limit,
                agents_limit: formData.agents_limit,
              })

              if (insertError) {
                console.warn("Erro ao inserir configurações:", insertError)
                // Não vamos falhar aqui, apenas logar o aviso
              }
            }
          }
        } catch (settingsError) {
          console.warn("Erro ao processar configurações do usuário:", settingsError)
          // Não vamos falhar aqui, apenas logar o aviso
        }
      }

      console.log("Usuário salvo com sucesso!")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error)

      // Melhorar o tratamento de erro para mostrar mensagens mais detalhadas
      let errorMessage = "Erro ao salvar usuário"

      if (error.message) {
        errorMessage += ": " + error.message
      } else if (error.code) {
        errorMessage += ` (código ${error.code})`
      }

      if (error.details) {
        errorMessage += " - " + error.details
      }

      setError(errorMessage)
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

            <div>
              <Label htmlFor="password" className="text-foreground">
                Senha {!user && "*"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={user ? "Deixe em branco para manter a senha atual" : "Senha do usuário"}
                disabled={loading}
                className="text-foreground"
              />
              {!user && <p className="text-xs text-muted-foreground mt-1">Mínimo de 6 caracteres</p>}
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
                  Deixe o campo senha em branco para manter a senha atual do usuário.
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
