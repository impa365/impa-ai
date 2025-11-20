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
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, User } from "lucide-react"
import { publicApi } from "@/lib/api-client"

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
    whatsapp_limit: null as number | null,
    agents_limit: null as number | null,
    can_access_agents: true,
    can_access_connections: true,
    hide_agents_menu: false,
    hide_connections_menu: false,
    can_view_api_credentials: false,
  })

  // Buscar valores padrão das configurações do sistema via API
  useEffect(() => {
    const loadDefaultLimits = async () => {
      if (!open) return

      setLoadingDefaults(true)
      try {
        console.log("🔄 Buscando limites padrão via API...")
        const response = await publicApi.getSystemSettings()

        if (response.error) {
          console.error("❌ Erro ao carregar configurações:", response.error)
          // Usar valores padrão em caso de erro
          setFormData((prev) => ({
            ...prev,
            whatsapp_limit: 1,
            agents_limit: 2,
          }))
        } else {
          const settings = response.data?.settings || {}
          const whatsappLimit = settings.default_whatsapp_connections_limit || 1
          const agentsLimit = settings.default_agents_limit || 2

          console.log("✅ Limites padrão carregados via API:", { whatsappLimit, agentsLimit })

          // Se não há usuário sendo editado, usar os valores padrão
          if (!user) {
            setFormData((prev) => ({
              ...prev,
              whatsapp_limit: whatsappLimit,
              agents_limit: agentsLimit,
            }))
          }
        }
      } catch (error) {
        console.error("❌ Erro ao carregar limites padrão:", error)
        setError("Erro ao carregar configurações padrão do sistema")
        // Usar valores padrão em caso de erro
        setFormData((prev) => ({
          ...prev,
          whatsapp_limit: 1,
          agents_limit: 2,
        }))
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
          console.log("🔄 Buscando dados do usuário via API:", user.id)

          const response = await publicApi.getUser(user.id)

          if (response.error) {
            console.error("❌ Erro ao buscar usuário:", response.error)
            throw new Error(response.error)
          }

          const userData = response.data?.user
          if (!userData) {
            throw new Error("Dados do usuário não encontrados")
          }

          console.log("✅ Dados do usuário carregados via API")

          setFormData({
            full_name: userData.full_name || "",
            email: userData.email || "",
            password: "",
            role: userData.role || "user",
            status: userData.status || "active",
            whatsapp_limit: userData.connections_limit || userData.whatsapp_connections_limit || 1,
            agents_limit: userData.agents_limit || 2,
            can_access_agents: userData.can_access_agents ?? true,
            can_access_connections: userData.can_access_connections ?? true,
            hide_agents_menu: userData.hide_agents_menu ?? false,
            hide_connections_menu: userData.hide_connections_menu ?? false,
            can_view_api_credentials: userData.can_view_api_credentials ?? false,
          })
        } catch (error: any) {
          console.error("❌ Erro ao buscar dados do usuário:", error.message)
          setError("Erro ao carregar dados do usuário")

          // Usar dados básicos do usuário como fallback
          setFormData({
            full_name: user.full_name || "",
            email: user.email || "",
            password: "",
            role: user.role || "user",
            status: user.status || "active",
            whatsapp_limit: user.connections_limit || 1,
            agents_limit: user.agents_limit || 2,
            can_access_agents: user.can_access_agents ?? true,
            can_access_connections: user.can_access_connections ?? true,
            hide_agents_menu: user.hide_agents_menu ?? false,
            hide_connections_menu: user.hide_connections_menu ?? false,
            can_view_api_credentials: user.can_view_api_credentials ?? false,
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
        can_access_agents: true,
        can_access_connections: true,
        hide_agents_menu: false,
        hide_connections_menu: false,
        can_view_api_credentials: false,
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
      const userData: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status,
        connections_limit: formData.whatsapp_limit,
        agents_limit: formData.agents_limit,
        can_access_agents: formData.can_access_agents,
        can_access_connections: formData.can_access_connections,
        hide_agents_menu: formData.hide_agents_menu,
        hide_connections_menu: formData.hide_connections_menu,
        can_view_api_credentials: formData.can_view_api_credentials,
      }

      // Adicionar senha apenas se fornecida
      if (formData.password.trim()) {
        userData.password = formData.password.trim()
      }

      let response
      if (user) {
        // Atualizar usuário existente
        console.log("🔄 Atualizando usuário via API:", user.id)
        response = await publicApi.updateUser(user.id, userData)
      } else {
        // Criar novo usuário
        console.log("🔄 Criando novo usuário via API")
        response = await publicApi.createUser(userData)
      }

      if (response.error) {
        console.error("❌ Erro ao salvar usuário:", response.error)
        setError(response.error)
        return
      }

      console.log("✅ Usuário salvo com sucesso via API!")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("❌ Erro ao salvar usuário:", error)
      setError("Erro ao salvar usuário: " + (error.message || "Erro desconhecido"))
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

            <div className="space-y-3 pt-2 border-t border-border">
              <Label className="text-foreground font-semibold">Permissões de Acesso</Label>
              
              <div className="space-y-3">
                {/* Agentes Permission */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_access_agents"
                      checked={formData.can_access_agents}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          can_access_agents: checked as boolean,
                          hide_agents_menu: checked ? false : formData.hide_agents_menu,
                        })
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="can_access_agents" className="text-sm font-medium cursor-pointer">
                      Pode acessar Agentes IA
                    </Label>
                  </div>
                  {!formData.can_access_agents && (
                    <div className="ml-6 flex items-center space-x-2">
                      <Checkbox
                        id="hide_agents_menu"
                        checked={formData.hide_agents_menu}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hide_agents_menu: checked as boolean })
                        }
                        disabled={loading}
                      />
                      <Label htmlFor="hide_agents_menu" className="text-sm text-muted-foreground cursor-pointer">
                        Ocultar Agentes do menu
                      </Label>
                    </div>
                  )}
                </div>

                {/* Connections Permission */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_access_connections"
                      checked={formData.can_access_connections}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          can_access_connections: checked as boolean,
                          hide_connections_menu: checked ? false : formData.hide_connections_menu,
                        })
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="can_access_connections" className="text-sm font-medium cursor-pointer">
                      Pode acessar Conexões WhatsApp
                    </Label>
                  </div>
                  {!formData.can_access_connections && (
                    <div className="ml-6 flex items-center space-x-2">
                      <Checkbox
                        id="hide_connections_menu"
                        checked={formData.hide_connections_menu}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hide_connections_menu: checked as boolean })
                        }
                        disabled={loading}
                      />
                      <Label htmlFor="hide_connections_menu" className="text-sm text-muted-foreground cursor-pointer">
                        Ocultar Conexões do menu
                      </Label>
                    </div>
                  )}
                </div>

                {/* API Credentials Permission */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_view_api_credentials"
                      checked={formData.can_view_api_credentials}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, can_view_api_credentials: checked as boolean })
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="can_view_api_credentials" className="text-sm font-medium cursor-pointer">
                      Pode visualizar credenciais da API (URL e API Key)
                    </Label>
                  </div>
                  <p className="ml-6 text-xs text-muted-foreground">
                    Permite visualizar URL da API e API Key das próprias instâncias WhatsApp
                  </p>
                </div>
              </div>
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
