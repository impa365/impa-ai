"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download,
  Settings,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ChevronDown,
  Palette,
  Plug,
  Upload,
  ImageIcon,
  User,
  Eye,
  EyeOff,
  QrCode,
  Users,
  Bot,
  Smartphone,
  Activity,
  Key,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { useTheme } from "@/components/theme-provider"
import { themePresets, type ThemeConfig } from "@/lib/theme"
import Image from "next/image"
import { publicApi } from "@/lib/api-client"

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  // const [loading, setLoading] = useState(false); // Not used, initial state was already false
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "dashboard"
  const settingsSubTab = searchParams.get("subtab") || "profile"

  const [usersData, setUsersData] = useState<any[]>([])
  const [agentsData, setAgentsData] = useState<any[]>([])
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeAgents: 0,
    totalRevenue: 0,
    dailyMessages: 0,
  })

  const { theme, updateTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const [integrations, setIntegrations] = useState<any[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false)
  const [integrationForm, setIntegrationForm] = useState({
    evolutionApiUrl: "",
    evolutionApiKey: "",
    n8nFlowUrl: "",
    n8nApiKey: "",
  })

  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null)
  const [deleteUserModal, setDeleteUserModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [whatsappConnections, setWhatsappConnections] = useState<any[]>([])
  const [systemLimits, setSystemLimits] = useState({
    defaultLimit: 2,
  })

  const [adminProfileForm, setAdminProfileForm] = useState({
    full_name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showAdminPasswords, setShowAdminPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [savingAdminProfile, setSavingAdminProfile] = useState(false)
  const [adminProfileMessage, setAdminProfileMessage] = useState("")

  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState<any>(false)
  const [selectedWhatsAppConnection, setSelectedWhatsAppConnection] = useState<any>(null)

  const updateURL = (tab: string, subtab?: string) => {
    const params = new URLSearchParams()
    params.set("tab", tab)
    if (subtab) params.set("subtab", subtab)
    router.push(`/admin?${params.toString()}`)
  }

  const loadData = async () => {
    try {
      console.log("🔄 Carregando dados do dashboard admin...")

      // Buscar todos os dados via API
      const result = await publicApi.getAdminDashboard()

      if (result.error) {
        console.error("❌ Erro ao carregar dados:", result.error)
        return
      }

      const data = result.data

      // Atualizar estados com os dados recebidos
      setUsersData(data.users || [])
      setAgentsData(data.agents || [])
      setWhatsappConnections(data.whatsappConnections || [])
      setIntegrations(data.integrations || [])
      setSystemLimits(data.systemLimits || { defaultLimit: 2 })

      // Calcular métricas
      setMetrics({
        totalUsers: data.users?.length || 0,
        activeAgents: data.agents?.filter((agent: any) => agent.status === "active").length || 0,
        totalRevenue: 0,
        dailyMessages: 0,
      })

      console.log("✅ Dados carregados com sucesso")
    } catch (error) {
      console.error("💥 Erro ao carregar dados:", error)
    }
  }

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role !== "admin") {
      router.push("/dashboard")
      return
    }
    setUser(currentUser)

    // Carregar dados via API
    loadData()

    // Configurar perfil do admin
    setAdminProfileForm({
      full_name: currentUser.full_name || "",
      email: currentUser.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }, [router])

  const fetchUsers = async () => {
    try {
      const result = await publicApi.getUsers()
      if (result.error) {
        console.error("Erro ao buscar usuários:", result.error)
        return
      }
      setUsersData(result.data)
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  const fetchWhatsAppConnections = async () => {
    try {
      const result = await publicApi.getWhatsappConnections()
      if (result.error) {
        console.error("Erro ao buscar conexões WhatsApp:", result.error)
        return
      }
      setWhatsappConnections(result.data)
    } catch (error) {
      console.error("Erro ao buscar conexões WhatsApp:", error)
    }
  }

  const fetchIntegrations = async () => {
    try {
      const result = await publicApi.getIntegrations()
      if (result.error) {
        console.error("Erro ao buscar integrações:", result.error)
        return
      }
      setIntegrations(result.data)
    } catch (error) {
      console.error("Erro ao buscar integrações:", error)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setSaving(true)
    try {
      // Deletar usuário via API segura
      const response = await fetch(`/api/admin/users?id=${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao deletar usuário")
      }
      
      await fetchUsers()
      setDeleteUserModal(false)
      setUserToDelete(null)
      setSaveMessage("Usuário deletado com sucesso!")
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      setSaveMessage("Erro ao deletar usuário")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

  const handleUpdateAdminProfile = async () => {
    setSavingAdminProfile(true)
    setAdminProfileMessage("")
    try {
      // Validations...
      if (!adminProfileForm.full_name.trim()) {
        setAdminProfileMessage("Nome é obrigatório")
        return
      }
      if (!adminProfileForm.email.trim()) {
        setAdminProfileMessage("Email é obrigatório")
        return
      }
      if (adminProfileForm.newPassword && adminProfileForm.newPassword !== adminProfileForm.confirmPassword) {
        setAdminProfileMessage("Senhas não coincidem")
        return
      }
      if (adminProfileForm.newPassword && !adminProfileForm.currentPassword) {
        setAdminProfileMessage("Senha atual é obrigatória para alterar a senha")
        return
      }

      // Atualizar perfil via API segura
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          full_name: adminProfileForm.full_name.trim(),
          email: adminProfileForm.email.trim(),
        }),
        })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar perfil")
      }

      const updatedUser = {
        ...user,
        full_name: adminProfileForm.full_name.trim(),
        email: adminProfileForm.email.trim(),
      }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setAdminProfileMessage("Perfil atualizado com sucesso!")
      setAdminProfileForm({ ...adminProfileForm, currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      setAdminProfileMessage("Erro ao atualizar perfil")
    } finally {
      setSavingAdminProfile(false)
      setTimeout(() => setAdminProfileMessage(""), 3000)
    }
  }

  const handleDisconnectWhatsAppConnection = async (connection: any) => {
    try {
      // Atualização otimista - atualizar imediatamente no estado local
      setWhatsappConnections(prev => 
        prev.map(conn => 
          conn.id === connection.id 
            ? { ...conn, status: "disconnected" }
            : conn
        )
      );

      const res = await fetch(`/api/whatsapp/disconnect/${encodeURIComponent(connection.instance_name)}`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        await fetchWhatsAppConnections()
        setSaveMessage("Conexão desconectada com sucesso!")
      } else {
        // Reverter mudança otimista em caso de erro
        setWhatsappConnections(prev => 
          prev.map(conn => 
            conn.id === connection.id 
              ? { ...conn, status: connection.status }
              : conn
          )
        );
        throw new Error(result.error || "Falha ao desconectar instância")
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error)
      // Reverter mudança otimista em caso de erro
      setWhatsappConnections(prev => 
        prev.map(conn => 
          conn.id === connection.id 
            ? { ...conn, status: connection.status }
            : conn
        )
      );
      setSaveMessage("Erro ao desconectar conexão")
    } finally {
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

  const handleIntegrationSave = async (type: string) => {
    setSaving(true)
    try {
      let configData = {}
      if (type === "evolution_api") {
        configData = { apiUrl: integrationForm.evolutionApiUrl, apiKey: integrationForm.evolutionApiKey }
      } else if (type === "n8n") {
        configData = { flowUrl: integrationForm.n8nFlowUrl, apiKey: integrationForm.n8nApiKey || null }
      }
      const existing = integrations.find((int) => int.type === type)
      // Salvar via API segura
      const response = await fetch('/api/admin/integrations', {
        method: existing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(existing ? {
          id: existing.id,
          config: configData,
          is_active: true,
        } : {
          name: type === "evolution_api" ? "Evolution API" : "n8n",
          type,
          config: configData,
          is_active: true,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar integração")
      }
      await fetchIntegrations()
      setIntegrationModalOpen(false)
      setSaveMessage("Integração salva com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar integração:", error)
      setSaveMessage("Erro ao salvar integração")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

  // Render functions (renderDashboard, renderUsers, etc.) use states like usersData, agentsData
  // These functions are quite long, so I'll assume their internal JSX is correct and focus on data fetching logic.
  // Make sure to replace `users` with `usersData` and `agents` with `agentsData` in the JSX parts of these render functions.

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Visão geral do sistema {theme.systemName}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-100">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
          {/* Adicione este botão na seção de navegação rápida do dashboard */}
          <Button
            variant="outline"
            className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-100"
            onClick={() => router.push("/admin/apikeys")}
          >
            <Key className="w-4 h-4" />
            Gerenciar API Keys
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/admin/settings")}>
            <Settings className="w-4 h-4" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total de Usuários</CardTitle>
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{metrics.totalUsers}</div>
            <div className="text-sm text-blue-600 mt-2">Usuários registrados</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Agentes Ativos</CardTitle>
            <div className="p-2 bg-green-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{metrics.activeAgents}</div>
            <div className="text-sm text-green-600 mt-2">Agentes em funcionamento</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Conexões WhatsApp</CardTitle>
            <div className="p-2 bg-purple-600 rounded-lg">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{whatsappConnections.length}</div>
            <div className="text-sm text-purple-600 mt-2">Conexões cadastradas</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Integrações</CardTitle>
            <div className="p-2 bg-orange-600 rounded-lg">
              <Plug className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{integrations.length}</div>
            <div className="text-sm text-orange-600 mt-2">Integrações configuradas</div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes das Conexões WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              WhatsApp Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de Conexões</span>
                <span className="font-bold text-gray-900">{whatsappConnections.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conexões Ativas</span>
                <span className="font-bold text-green-600">
                  {whatsappConnections.filter((conn: any) => conn.status === "connected").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Desconectadas</span>
                <span className="font-bold text-red-600">
                  {whatsappConnections.filter((conn: any) => conn.status !== "connected").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Agentes Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de Agentes</span>
                <span className="font-bold text-gray-900">{agentsData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Agentes Ativos</span>
                <span className="font-bold text-green-600">
                  {agentsData.filter((agent: any) => agent.status === "active").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inativos</span>
                <span className="font-bold text-gray-600">
                  {agentsData.filter((agent: any) => agent.status !== "active").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de Usuários</span>
                <span className="font-bold text-gray-900">{usersData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Usuários Ativos</span>
                <span className="font-bold text-green-600">
                  {usersData.filter((user: any) => user.status === "active").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Administradores</span>
                <span className="font-bold text-blue-600">
                  {usersData.filter((user: any) => user.role === "admin").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Integrações */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Plug className="w-5 h-5" />
              Status das Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((integration: any) => (
                <div key={integration.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{integration.name}</span>
                    <div
                      className={`w-2 h-2 rounded-full ${integration.is_active ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${integration.is_active ? "text-green-600" : "text-red-600"}`}>
                        {integration.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Tipo</span>
                      <span className="text-gray-700">{integration.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há dados */}
      {usersData.length === 0 && agentsData.length === 0 && whatsappConnections.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Activity className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sistema Iniciado</h3>
            <p className="text-gray-600">
              O sistema está funcionando. Os dados aparecerão aqui conforme usuários se registrarem e criarem agentes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderUsers = () => (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-600">Controle total sobre usuários do sistema</p>
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => {
            setSelectedUserForEdit(null)
            setUserModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultLimit">Limite Padrão de Conexões WhatsApp</Label>
              <Input
                id="defaultLimit"
                type="number"
                value={systemLimits.defaultLimit}
                onChange={(e) => setSystemLimits({ defaultLimit: Number.parseInt(e.target.value) || 2 })}
                min="1"
                max="10"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={async () => {
                  // Salvar configuração via API segura
                  const response = await fetch('/api/system/settings', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                    setting_key: "default_whatsapp_connections_limit",
                    setting_value: systemLimits.defaultLimit,
                    }),
                  })
                  
                  if (response.ok) {
                  setSaveMessage("Configurações salvas!")
                  } else {
                    setSaveMessage("Erro ao salvar configurações")
                  }
                  setTimeout(() => setSaveMessage(""), 3000)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersData.map(
              (
                u: any, // Changed users to usersData
              ) => (
                <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{u.full_name || "Sem nome"}</div>
                      <div className="text-sm text-gray-600">{u.email}</div>
                      <div className="text-xs text-gray-500">
                        Último login: {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Nunca"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={u.status === "active" ? "default" : "secondary"}
                      className={
                        u.status === "active"
                          ? "bg-green-100 text-green-700"
                          : u.status === "inactive"
                            ? "bg-gray-100 text-gray-700"
                            : u.status === "suspended"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {u.status === "active"
                        ? "Ativo"
                        : u.status === "inactive"
                          ? "Inativo"
                          : u.status === "suspended"
                            ? "Suspenso"
                            : "Hibernado"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUserForEdit(u)
                          setUserModalOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setUserToDelete(u)
                          setDeleteUserModal(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAgents = () => (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agentes IA do Sistema</h1>
          <p className="text-gray-600">Todos os agentes criados pelos usuários</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Agentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentsData.map(
              (
                agent: any, // Changed agents to agentsData
              ) => (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-gray-600">Tipo: {agent.type}</div>
                      <div className="text-xs text-gray-500">Proprietário: {agent.user_profiles?.email || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={agent.status === "active" ? "default" : "secondary"}
                      className={
                        agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }
                    >
                      {agent.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        {agent.status === "active" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderWhatsAppConnections = () => (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conexões WhatsApp</h1>
          <p className="text-gray-600">Todas as conexões WhatsApp dos usuários</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Conexões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {whatsappConnections.map((connection: any) => (
              <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">{connection.connection_name}</div>
                    <div className="text-sm text-gray-600">
                      Usuário: {connection.user_profiles?.full_name} ({connection.user_profiles?.email})
                    </div>
                    <div className="text-xs text-gray-500">Instância: {connection.instance_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={connection.status === "connected" ? "default" : "secondary"}
                    className={
                      connection.status === "connected" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }
                  >
                    {connection.status === "connected" ? "Conectado" : "Desconectado"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedWhatsAppConnection(connection)
                        setQrModalOpen(true)
                      }}
                      title="Ver QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedWhatsAppConnection(connection)
                        setSettingsModalOpen(true)
                      }}
                      title="Configurações"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {(connection.status === "connected" || connection.status === "connecting") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-600"
                        onClick={() => handleDisconnectWhatsAppConnection(connection)}
                        title="Desconectar"
                      >
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAdminProfileSettings = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Perfil do Administrador</h3>
        <p className="text-gray-600">Gerencie suas informações pessoais e senha</p>
      </div>

      {adminProfileMessage && (
        <Alert variant={adminProfileMessage.includes("sucesso") ? "default" : "destructive"} className="mb-6">
          <AlertDescription>{adminProfileMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminFullName">Nome Completo</Label>
              <Input
                id="adminFullName"
                value={adminProfileForm.full_name}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, full_name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminProfileForm.email}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminCurrentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="adminCurrentPassword"
                  type={showAdminPasswords.current ? "text" : "password"}
                  value={adminProfileForm.currentPassword}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, currentPassword: e.target.value })}
                  placeholder="Senha atual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowAdminPasswords({ ...showAdminPasswords, current: !showAdminPasswords.current })}
                >
                  {showAdminPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="adminNewPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="adminNewPassword"
                  type={showAdminPasswords.new ? "text" : "password"}
                  value={adminProfileForm.newPassword}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, newPassword: e.target.value })}
                  placeholder="Nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowAdminPasswords({ ...showAdminPasswords, new: !showAdminPasswords.new })}
                >
                  {showAdminPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="adminConfirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="adminConfirmPassword"
                  type={showAdminPasswords.confirm ? "text" : "password"}
                  value={adminProfileForm.confirmPassword}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, confirmPassword: e.target.value })}
                  placeholder="Confirme a nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowAdminPasswords({ ...showAdminPasswords, confirm: !showAdminPasswords.confirm })}
                >
                  {showAdminPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleUpdateAdminProfile}
          disabled={savingAdminProfile}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          {savingAdminProfile ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  )

  const renderBrandingSettings = () => {
    const handleThemeUpdate = async (updates: Partial<ThemeConfig>) => {
      setSaving(true)
      setSaveMessage("")
      try {
        await updateTheme(updates)
        setSaveMessage("Configurações salvas com sucesso!")
      } catch (error) {
        setSaveMessage("Erro ao salvar configurações")
      } finally {
        setSaving(false)
        setTimeout(() => setSaveMessage(""), 3000)
      }
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding e Identidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input
                id="systemName"
                value={theme.systemName}
                onChange={(e) => handleThemeUpdate({ systemName: e.target.value })}
                placeholder="Nome da sua plataforma"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={theme.description || ""}
                onChange={(e) => handleThemeUpdate({ description: e.target.value })}
                placeholder="Descrição da sua plataforma"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="logoIcon">Ícone/Emoji do Logo</Label>
              <Input
                id="logoIcon"
                value={theme.logoIcon}
                onChange={(e) => handleThemeUpdate({ logoIcon: e.target.value })}
                placeholder="🤖"
                maxLength={2}
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="logoUpload">Upload de Logo</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2" disabled={saving}>
                  <Upload className="w-4 h-4" />
                  Escolher Logo
                </Button>
                <span className="text-sm text-gray-500">PNG, JPG até 2MB</span>
              </div>
            </div>
            <div>
              <Label htmlFor="faviconUpload">Upload de Favicon</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2" disabled={saving}>
                  <ImageIcon className="w-4 h-4" />
                  Escolher Favicon
                </Button>
                <span className="text-sm text-gray-500">ICO, PNG 32x32px</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Esquema de Cores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primaryColor">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => handleThemeUpdate({ primaryColor: e.target.value })}
                  className="w-16 h-10"
                  disabled={saving}
                />
                <Input
                  value={theme.primaryColor}
                  onChange={(e) => handleThemeUpdate({ primaryColor: e.target.value })}
                  placeholder="#2563eb"
                  className="flex-1"
                  disabled={saving}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondaryColor">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={theme.secondaryColor}
                  onChange={(e) => handleThemeUpdate({ secondaryColor: e.target.value })}
                  className="w-16 h-10"
                  disabled={saving}
                />
                <Input
                  value={theme.secondaryColor}
                  onChange={(e) => handleThemeUpdate({ secondaryColor: e.target.value })}
                  placeholder="#10b981"
                  className="flex-1"
                  disabled={saving}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="accentColor">Cor de Destaque</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => handleThemeUpdate({ accentColor: e.target.value })}
                  className="w-16 h-10"
                  disabled={saving}
                />
                <Input
                  value={theme.accentColor}
                  onChange={(e) => handleThemeUpdate({ accentColor: e.target.value })}
                  placeholder="#8b5cf6"
                  className="flex-1"
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Temas Predefinidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(themePresets).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => handleThemeUpdate(preset)}
                  disabled={saving}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: preset.primaryColor }}
                  >
                    <span className="text-sm">{preset.logoIcon}</span>
                  </div>
                  <span className="text-sm font-medium capitalize">{key}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <span className="text-sm">{theme.logoIcon}</span>
                </div>
                <span className="font-semibold">{theme.systemName}</span>
              </div>
              <div className="space-y-2">
                <div className="h-3 rounded" style={{ backgroundColor: theme.primaryColor, opacity: 0.8 }}></div>
                <div
                  className="h-3 rounded w-3/4"
                  style={{ backgroundColor: theme.secondaryColor, opacity: 0.6 }}
                ></div>
                <div className="h-3 rounded w-1/2" style={{ backgroundColor: theme.accentColor, opacity: 0.4 }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderIntegrationsSettings = () => {
    const getIntegrationConfig = (type: string) => {
      const integration = integrations.find((int: any) => int.type === type)
      return integration?.config || {}
    }
    const openIntegrationModal = (type: string, name: string) => {
      setSelectedIntegration({ type, name })
      const config = getIntegrationConfig(type)
      if (type === "evolution_api") {
        setIntegrationForm({
          ...integrationForm,
          evolutionApiUrl: config.apiUrl || "",
          evolutionApiKey: config.apiKey || "",
        })
      } else if (type === "n8n") {
        setIntegrationForm({ ...integrationForm, n8nFlowUrl: config.flowUrl || "", n8nApiKey: config.apiKey || "" })
      }
      setIntegrationModalOpen(true)
    }
    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Integrações Disponíveis</h3>
          <p className="text-gray-600">Configure as integrações para expandir as funcionalidades da plataforma</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <Image
                  src="/images/evolution-api-logo.png"
                  alt="Evolution API"
                  width={40}
                  height={40}
                  className="rounded"
                />
              </div>
              <h4 className="font-semibold mb-2">Evolution API</h4>
              <p className="text-sm text-gray-600 mb-4">Integração com WhatsApp Business</p>
              <Button
                onClick={() => openIntegrationModal("evolution_api", "Evolution API")}
                className={`w-full ${getIntegrationConfig("evolution_api").apiUrl ? "bg-green-600 text-white hover:bg-green-700" : ""}`}
                variant={getIntegrationConfig("evolution_api").apiUrl ? "default" : "outline"}
              >
                {getIntegrationConfig("evolution_api").apiUrl ? "Configurado" : "Configurar"}
              </Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <Image src="/images/n8n-logo.png" alt="n8n" width={40} height={40} className="rounded" />
              </div>
              <h4 className="font-semibold mb-2">n8n</h4>
              <p className="text-sm text-gray-600 mb-4">Automação de fluxos de trabalho</p>
              <Button
                onClick={() => openIntegrationModal("n8n", "n8n")}
                className={`w-full ${getIntegrationConfig("n8n").flowUrl ? "bg-green-600 text-white hover:bg-green-700" : ""}`}
                variant={getIntegrationConfig("n8n").flowUrl ? "default" : "outline"}
              >
                {getIntegrationConfig("n8n").flowUrl ? "Configurado" : "Configurar"}
              </Button>
            </CardContent>
          </Card>
          <Card className="opacity-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="font-semibold mb-2">Em Breve</h4>
              <p className="text-sm text-gray-600 mb-4">Nova integração chegando</p>
              <Button className="w-full" variant="outline" disabled>
                Em Breve
              </Button>
            </CardContent>
          </Card>
          <Card className="opacity-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="font-semibold mb-2">Em Breve</h4>
              <p className="text-sm text-gray-600 mb-4">Nova integração chegando</p>
              <Button className="w-full" variant="outline" disabled>
                Em Breve
              </Button>
            </CardContent>
          </Card>
        </div>
        <Dialog open={integrationModalOpen} onOpenChange={setIntegrationModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Configurar {selectedIntegration?.name}</DialogTitle>
              <DialogDescription>
                Configure as credenciais para integração com {selectedIntegration?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedIntegration?.type === "evolution_api" && (
                <>
                  <div>
                    <Label htmlFor="evolutionApiUrl">URL da API Evolution *</Label>
                    <Input
                      id="evolutionApiUrl"
                      value={integrationForm.evolutionApiUrl}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, evolutionApiUrl: e.target.value })}
                      placeholder="https://api.evolution.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="evolutionApiKey">API Key Global *</Label>
                    <Input
                      id="evolutionApiKey"
                      type="password"
                      value={integrationForm.evolutionApiKey}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, evolutionApiKey: e.target.value })}
                      placeholder="Sua API Key"
                      required
                    />
                  </div>
                </>
              )}
              {selectedIntegration?.type === "n8n" && (
                <>
                  <div>
                    <Label htmlFor="n8nFlowUrl">URL do Fluxo *</Label>
                    <Input
                      id="n8nFlowUrl"
                      value={integrationForm.n8nFlowUrl}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, n8nFlowUrl: e.target.value })}
                      placeholder="https://n8n.exemplo.com/webhook/..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="n8nApiKey">API Key do Fluxo (Opcional)</Label>
                    <Input
                      id="n8nApiKey"
                      type="password"
                      value={integrationForm.n8nApiKey}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, n8nApiKey: e.target.value })}
                      placeholder="API Key (se necessário)"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIntegrationModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleIntegrationSave(selectedIntegration?.type)}
                disabled={saving}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const renderSettings = () => {
    return (
      <div>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações do Sistema</h1>
            <p className="text-gray-600">Personalize a plataforma e configure integrações</p>
          </div>
          <div className="flex items-center gap-4">
            {saveMessage && (
              <div
                className={`px-4 py-2 rounded-lg text-sm ${saveMessage.includes("sucesso") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {saveMessage}
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-50">
                  {settingsSubTab === "profile" ? (
                    <>
                      <User className="w-4 h-4" />
                      Perfil
                    </>
                  ) : settingsSubTab === "branding" ? (
                    <>
                      <Palette className="w-4 h-4" />
                      Branding
                    </>
                  ) : (
                    <>
                      <Plug className="w-4 h-4" />
                      Integrações
                    </>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                <DropdownMenuItem
                  onClick={() => updateURL("settings", "profile")}
                  className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateURL("settings", "branding")}
                  className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Branding
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateURL("settings", "integrations")}
                  className="text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                >
                  <Plug className="w-4 h-4 mr-2" />
                  Integrações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {settingsSubTab === "profile" && renderAdminProfileSettings()}
        {settingsSubTab === "branding" && renderBrandingSettings()}
        {settingsSubTab === "integrations" && renderIntegrationsSettings()}
      </div>
    )
  }

  return (
    <div className="p-6">
      {activeTab === "dashboard"
        ? renderDashboard()
        : activeTab === "users"
          ? renderUsers()
          : activeTab === "agents"
            ? renderAgents()
            : activeTab === "whatsapp"
              ? renderWhatsAppConnections()
              : renderSettings()}
    </div>
  )
}
