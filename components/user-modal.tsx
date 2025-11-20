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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Mail, Lock, Shield, Settings, Eye, EyeOff, Bot, MessageSquare, Key } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden p-0">
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-lg shadow-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user ? "Editar Usuário" : "Novo Usuário"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {user
                    ? `Gerenciar informações e permissões de ${formData.full_name || formData.email || user.email}`
                    : "Configure as informações e permissões do novo usuário"}
                </DialogDescription>
              </div>
              {user && (
                <Badge variant={formData.status === 'active' ? 'default' : 'secondary'} className="h-6">
                  {formData.status === 'active' ? 'Ativo' : formData.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 pt-4">
            <Alert variant="destructive" className="border-red-200 dark:border-red-800">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Content Section */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoadingEssentialData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {loadingDefaults ? "Carregando configurações do sistema..." : "Carregando dados do usuário..."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Informações Básicas</span>
                </div>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      Nome Completo
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Ex: João da Silva"
                      disabled={loading}
                      className="h-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="usuario@empresa.com"
                      disabled={loading}
                      className="h-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Senha
                      {!user && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={user ? "Deixe em branco para manter a senha atual" : "Mínimo 6 caracteres"}
                        disabled={loading}
                        className="h-10 pr-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {user && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                        <span className="text-blue-600 mt-0.5">ℹ</span>
                        Deixe o campo vazio para manter a senha atual do usuário
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Account Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Configurações da Conta</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Função
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            <span>Usuário</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Administrador</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-10 border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">✓ Ativo</SelectItem>
                        <SelectItem value="inactive">○ Inativo</SelectItem>
                        <SelectItem value="suspended">⊘ Suspenso</SelectItem>
                        <SelectItem value="hibernated">⏸ Hibernado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Resource Limits Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>Limites de Recursos</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsappLimit" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                      Conexões WhatsApp
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
                      className="h-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agentsLimit" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-purple-600" />
                      Agentes IA
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
                      className="h-10 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Permissões de Acesso</span>
                </div>

                <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  {/* Agents Permission */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
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
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div className="flex-1">
                        <Label htmlFor="can_access_agents" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          <Bot className="w-4 h-4 text-purple-600" />
                          Acessar Agentes IA
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Permite criar e gerenciar agentes de inteligência artificial
                        </p>
                      </div>
                    </div>
                    {!formData.can_access_agents && (
                      <div className="ml-9 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="hide_agents_menu"
                            checked={formData.hide_agents_menu}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, hide_agents_menu: checked as boolean })
                            }
                            disabled={loading}
                          />
                          <Label htmlFor="hide_agents_menu" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                            Ocultar menu de Agentes
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-700" />

                  {/* Connections Permission */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
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
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div className="flex-1">
                        <Label htmlFor="can_access_connections" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          Acessar Conexões WhatsApp
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Permite conectar e gerenciar instâncias do WhatsApp
                        </p>
                      </div>
                    </div>
                    {!formData.can_access_connections && (
                      <div className="ml-9 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="hide_connections_menu"
                            checked={formData.hide_connections_menu}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, hide_connections_menu: checked as boolean })
                            }
                            disabled={loading}
                          />
                          <Label htmlFor="hide_connections_menu" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                            Ocultar menu de Conexões
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-700" />

                  {/* API Credentials Permission */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="can_view_api_credentials"
                        checked={formData.can_view_api_credentials}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, can_view_api_credentials: checked as boolean })
                        }
                        disabled={loading}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div className="flex-1">
                        <Label htmlFor="can_view_api_credentials" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          <Key className="w-4 h-4 text-amber-600" />
                          Visualizar Credenciais da API
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Permite ver URL da API e API Key das próprias instâncias WhatsApp
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading || isLoadingEssentialData}
              className="h-10 px-6 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || isLoadingEssentialData}
              className="h-10 px-6 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : user ? (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Criar Usuário
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
