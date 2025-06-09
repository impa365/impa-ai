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
import { getDefaultWhatsAppLimit, getDefaultAgentsLimit } from "@/lib/system-settings"

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: any
  onSuccess: () => void
}

export default function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [loadingDefaults, setLoadingDefaults] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user",
    status: "active",
    whatsapp_limit: null as number | null, // Inicializar como null
    agents_limit: null as number | null, // Inicializar como null
  })

  // Buscar valores padrão das configurações do sistema SEMPRE
  useEffect(() => {
    const loadDefaultLimits = async () => {
      if (!open) return

      setLoadingDefaults(true)
      try {
        console.log("🔄 Buscando limites padrão do sistema...")
        const whatsappLimit = await getDefaultWhatsAppLimit()
        const agentsLimit = await getDefaultAgentsLimit()

        console.log("✅ Limites padrão carregados:", { whatsappLimit, agentsLimit })

        // Se não há usuário sendo editado, usar os valores padrão
        if (!user) {
          setFormData((prev) => ({
            ...prev,
            whatsapp_limit: whatsappLimit,
            agents_limit: agentsLimit,
          }))
        }
      } catch (error) {
        console.error("❌ Erro ao carregar limites padrão:", error)
        setError("Erro ao carregar configurações padrão do sistema")
      } finally {
        setLoadingDefaults(false)
      }
    }

    loadDefaultLimits()
  }, [open, user])

  useEffect(() => {
    const fetchUserData = async () => {
      if (user && open) {
        setLoadingData(true)
        try {
          console.log("🔄 Buscando dados do usuário:", user.id)

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
            console.error("⚠️ Erro ao buscar configurações do usuário:", settingsErr)
          }

          // Obter limites padrão do sistema como fallback
          const defaultWhatsAppLimit = await getDefaultWhatsAppLimit()
          const defaultAgentsLimit = await getDefaultAgentsLimit()

          console.log("📊 Dados do usuário:", {
            userProfileLimits: {
              connections_limit: userData.connections_limit,
              agents_limit: userData.agents_limit,
            },
            userSettingsLimits: {
              whatsapp_connections_limit: settingsData?.whatsapp_connections_limit,
              agents_limit: settingsData?.agents_limit,
            },
            systemDefaults: {
              whatsappLimit: defaultWhatsAppLimit,
              agentsLimit: defaultAgentsLimit,
            },
          })

          // Definir valores com prioridade:
          // 1. Valor do usuário na tabela user_profiles
          // 2. Valor do usuário na tabela user_settings
          // 3. Valor padrão do sistema
          const whatsappLimitValue =
            userData.connections_limit !== undefined && userData.connections_limit !== null
              ? userData.connections_limit
              : settingsData?.whatsapp_connections_limit !== undefined &&
                  settingsData?.whatsapp_connections_limit !== null
                ? settingsData.whatsapp_connections_limit
                : defaultWhatsAppLimit

          const agentsLimitValue =
            userData.agents_limit !== undefined && userData.agents_limit !== null
              ? userData.agents_limit
              : settingsData?.agents_limit !== undefined && settingsData?.agents_limit !== null
                ? settingsData.agents_limit
                : defaultAgentsLimit

          console.log("✅ Valores finais definidos:", {
            whatsappLimit: whatsappLimitValue,
            agentsLimit: agentsLimitValue,
          })

          setFormData({
            full_name: userData.full_name || "",
            email: userData.email || "",
            password: "",
            role: userData.role || "user",
            status: userData.status || "active",
            whatsapp_limit: whatsappLimitValue,
            agents_limit: agentsLimitValue,
          })
        } catch (error) {
          console.error("❌ Erro ao buscar dados do usuário:", error)

          // Obter limites padrão do sistema como fallback
          const defaultWhatsAppLimit = await getDefaultWhatsAppLimit()
          const defaultAgentsLimit = await getDefaultAgentsLimit()

          setFormData({
            full_name: user.full_name || "",
            email: user.email || "",
            password: "",
            role: user.role || "user",
            status: user.status || "active",
            whatsapp_limit: user.connections_limit ?? defaultWhatsAppLimit,
            agents_limit: user.agents_limit ?? defaultAgentsLimit,
          })
        } finally {
          setLoadingData(false)
        }
      } else if (!user && open && !loadingDefaults) {
        // Novo usuário - valores padrão já foram carregados no useEffect anterior
        console.log("👤 Novo usuário - usando valores padrão já carregados")
      }
    }

    if (open && !loadingDefaults) {
      fetchUserData()
    } else if (!open) {
      setError("")
      // Reset form data when modal closes
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "user",
        status: "active",
        whatsapp_limit: null,
        agents_limit: null,
      })
    }
  }, [user, open, loadingDefaults])

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError("Nome e email são obrigatórios")
      return
    }

    if (formData.whatsapp_limit === null || formData.agents_limit === null) {
      setError("Erro: Limites não foram carregados corretamente")
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
          // Salvar limites diretamente na tabela user_profiles
          connections_limit: formData.whatsapp_limit,
          agents_limit: formData.agents_limit,
        }

        // Adicionar senha apenas se fornecida
        if (formData.password.trim()) {
          updateData.password = formData.password.trim()
        }

        console.log("🔄 Atualizando usuário:", user.id, updateData)
        const { error: profileError } = await supabase.from("user_profiles").update(updateData).eq("id", user.id)

        if (profileError) {
          console.error("❌ Erro ao atualizar perfil:", profileError)
          throw profileError
        }
      } else {
        // Criar novo usuário
        console.log("🔄 Criando novo usuário")
        const { data: newUser, error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(),
            role: formData.role,
            status: formData.status,
            // Salvar limites diretamente na tabela user_profiles
            connections_limit: formData.whatsapp_limit,
            agents_limit: formData.agents_limit,
          })
          .select()
          .single()

        if (profileError) {
          console.error("❌ Erro ao criar usuário:", profileError)
          throw profileError
        }

        if (!newUser) {
          throw new Error("Falha ao criar perfil do usuário. Nenhum dado retornado.")
        }

        console.log("✅ Novo usuário criado:", newUser.id)
        userId = newUser.id
      }

      // Também tentar salvar na user_settings como backup (se a tabela existir)
      if (userId) {
        try {
          const { data: existingSettings } = await supabase
            .from("user_settings")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle()

          if (existingSettings) {
            // Atualizar configurações existentes
            await supabase
              .from("user_settings")
              .update({
                whatsapp_connections_limit: formData.whatsapp_limit,
                agents_limit: formData.agents_limit,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId)
          } else {
            // Inserir novas configurações
            await supabase.from("user_settings").insert({
              user_id: userId,
              whatsapp_connections_limit: formData.whatsapp_limit,
              agents_limit: formData.agents_limit,
            })
          }
        } catch (settingsError) {
          console.warn("⚠️ Tabela user_settings não disponível, usando apenas user_profiles")
        }
      }

      console.log("✅ Usuário salvo com sucesso!")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("❌ Erro ao salvar usuário:", error)

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

  // Verificar se ainda está carregando dados essenciais
  const isLoadingEssentialData =
    loadingDefaults || loadingData || formData.whatsapp_limit === null || formData.agents_limit === null

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

        {isLoadingEssentialData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">
              {loadingDefaults ? "Carregando configurações do sistema..." : "Carregando dados do usuário..."}
            </span>
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
                value={formData.whatsapp_limit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsapp_limit: Number.parseInt(e.target.value) || 0,
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
                value={formData.agents_limit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    agents_limit: Number.parseInt(e.target.value) || 0,
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
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading || isLoadingEssentialData}
            className="text-foreground"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || isLoadingEssentialData}
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
