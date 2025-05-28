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
  TrendingUp,
  MessageSquare,
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
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/components/theme-provider"
import { themePresets, type ThemeConfig } from "@/lib/theme"
import Image from "next/image"
import UserModal from "@/components/user-modal"
import WhatsAppQRModal from "@/components/whatsapp-qr-modal"
import WhatsAppSettingsModal from "@/components/whatsapp-settings-modal"
import { disconnectInstance } from "@/lib/whatsapp-settings-api"

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "dashboard"
  const settingsSubTab = searchParams.get("subtab") || "profile"

  const [users, setUsers] = useState([])
  const [agents, setAgents] = useState([])
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeAgents: 0,
    totalRevenue: 0,
    dailyMessages: 0,
  })

  const { theme, updateTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  // Estados para integrações
  const [integrations, setIntegrations] = useState([])
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false)
  const [integrationForm, setIntegrationForm] = useState({
    evolutionApiUrl: "",
    evolutionApiKey: "",
    n8nFlowUrl: "",
    n8nApiKey: "",
  })

  // Estados para usuários
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null)
  const [deleteUserModal, setDeleteUserModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [whatsappConnections, setWhatsappConnections] = useState([])
  const [systemLimits, setSystemLimits] = useState({
    defaultLimit: 2,
  })

  // Estados para perfil do admin
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

  // Estados para QR Code e configurações WhatsApp
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [selectedWhatsAppConnection, setSelectedWhatsAppConnection] = useState<any>(null)

  const fetchWhatsAppConnections = async () => {
    const { data } = await supabase
      .from("whatsapp_connections")
      .select(`
        *,
        user_profiles!whatsapp_connections_user_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false })

    if (data) setWhatsappConnections(data)
  }

  const fetchSystemSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_whatsapp_connections_limit")
      .single()

    if (data) {
      setSystemLimits({ defaultLimit: data.setting_value })
    }
  }

  const updateURL = (tab: string, subtab?: string) => {
    const params = new URLSearchParams()
    params.set("tab", tab)
    if (subtab) params.set("subtab", subtab)
    router.push(`/admin?${params.toString()}`)
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
    setLoading(false)
  }, [router])

  const handleLogout = async () => {
    // await signOut() // removido pois não existe mais
    router.push("/")
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false })
    if (data) setUsers(data)
  }

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("ai_agents")
      .select(`
        *,
        user_profiles!ai_agents_organization_id_fkey(email)
      `)
      .order("created_at", { ascending: false })

    if (data) setAgents(data)
  }

  const fetchMetrics = async () => {
    const { count: userCount } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })
    const { count: agentCount } = await supabase
      .from("ai_agents")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
    const { data: revenueData } = await supabase.from("daily_metrics").select("revenue_generated")
    const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.revenue_generated || 0), 0) || 0
    const { data: messagesData } = await supabase
      .from("daily_metrics")
      .select("total_messages")
      .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    const dailyMessages = messagesData?.reduce((sum, item) => sum + (item.total_messages || 0), 0) || 0

    setMetrics({
      totalUsers: userCount || 0,
      activeAgents: agentCount || 0,
      totalRevenue: totalRevenue,
      dailyMessages: dailyMessages,
    })
  }

  const fetchIntegrations = async () => {
    const { data, error } = await supabase.from("integrations").select("*").order("created_at", { ascending: false })
    if (data) setIntegrations(data)
  }

  useEffect(() => {
    if (user) {
      fetchUsers()
      fetchAgents()
      fetchMetrics()
      fetchIntegrations()
      fetchWhatsAppConnections()
      fetchSystemSettings()
      setAdminProfileForm({
        full_name: user.full_name || "",
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }, [user])

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setSaving(true)
    try {
      await supabase.from("whatsapp_connections").delete().eq("user_id", userToDelete.id)
      await supabase.from("user_settings").delete().eq("user_id", userToDelete.id)
      const { error } = await supabase.from("user_profiles").delete().eq("id", userToDelete.id)

      if (error) throw error

      await fetchUsers()
      setDeleteUserModal(false)
      setUserToDelete(null)
      setSaveMessage("Usuário deletado com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      setSaveMessage("Erro ao deletar usuário")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAdminProfile = async () => {
    setSavingAdminProfile(true)
    setAdminProfileMessage("")

    try {
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

      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: adminProfileForm.full_name.trim(),
          email: adminProfileForm.email.trim(),
        })
        .eq("id", user.id)

      if (error) throw error

      const updatedUser = {
        ...user,
        full_name: adminProfileForm.full_name.trim(),
        email: adminProfileForm.email.trim(),
      }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setAdminProfileMessage("Perfil atualizado com sucesso!")
      setAdminProfileForm({
        ...adminProfileForm,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      setAdminProfileMessage("Erro ao atualizar perfil")
    } finally {
      setSavingAdminProfile(false)
      setTimeout(() => setAdminProfileMessage(""), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const renderDashboard = () => (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Visão geral do sistema {theme.systemName}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Relatório Geral
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Settings className="w-4 h-4" />
            Configurações Sistema
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Agentes Ativos</CardTitle>
            <Bot className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeAgents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(metrics.totalRevenue / 1000).toFixed(1)}k</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mensagens/Dia</CardTitle>
            <MessageSquare className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.dailyMessages / 1000).toFixed(1)}k</div>
          </CardContent>
        </Card>
      </div>
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
          className="gap-2 bg-blue-600 hover:bg-blue-700"
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
                  await supabase.from("system_settings").upsert({
                    setting_key: "default_whatsapp_connections_limit",
                    setting_value: systemLimits.defaultLimit,
                  })
                  setSaveMessage("Configurações salvas!")
                  setTimeout(() => setSaveMessage(""), 3000)
                }}
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
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{user.full_name || "Sem nome"}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">
                      Último login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Nunca"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className={
                      user.status === "active"
                        ? "bg-green-100 text-green-700"
                        : user.status === "inactive"
                          ? "bg-gray-100 text-gray-700"
                          : user.status === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {user.status === "active"
                      ? "Ativo"
                      : user.status === "inactive"
                        ? "Inativo"
                        : user.status === "suspended"
                          ? "Suspenso"
                          : "Hibernado"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {user.role === "admin" ? "Admin" : "Usuário"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUserForEdit(user)
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
                        setUserToDelete(user)
                        setDeleteUserModal(true)
                      }}
                    >
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
            {agents.map((agent) => (
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
                    className={agent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const handleDisconnectWhatsAppConnection = async (connection: any) => {
    try {
      const result = await disconnectInstance(connection.instance_name)

      if (result.success) {
        // Atualizar status no banco
        await supabase.from("whatsapp_connections").update({ status: "disconnected" }).eq("id", connection.id)

        await fetchWhatsAppConnections()
        setSaveMessage("Conexão desconectada com sucesso!")
        setTimeout(() => setSaveMessage(""), 3000)
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error)
      setSaveMessage("Erro ao desconectar conexão")
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

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
            {whatsappConnections.map((connection) => (
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
                    {connection.status === "connected" && (
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

  const handleIntegrationSave = async (type: string) => {
    setSaving(true)
    try {
      let config = {}
      if (type === "evolution_api") {
        config = {
          apiUrl: integrationForm.evolutionApiUrl,
          apiKey: integrationForm.evolutionApiKey,
        }
      } else if (type === "n8n") {
        config = {
          flowUrl: integrationForm.n8nFlowUrl,
          apiKey: integrationForm.n8nApiKey || null,
        }
      }

      const existing = integrations.find((int) => int.type === type)

      if (existing) {
        const { error } = await supabase
          .from("integrations")
          .update({
            config,
            is_active: true,
          })
          .eq("id", existing.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("integrations").insert([
          {
            name: type === "evolution_api" ? "Evolution API" : "n8n",
            type,
            config,
            is_active: true,
          },
        ])

        if (error) throw error
      }

      await fetchIntegrations()
      setIntegrationModalOpen(false)
      setSaveMessage("Integração salva com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao salvar integração:", error)
      setSaveMessage("Erro ao salvar integração")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setSaving(false)
    }
  }

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
        <Button onClick={handleUpdateAdminProfile} disabled={savingAdminProfile} className="gap-2">
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
        setTimeout(() => setSaveMessage(""), 3000)
      } catch (error) {
        setSaveMessage("Erro ao salvar configurações")
        setTimeout(() => setSaveMessage(""), 3000)
      } finally {
        setSaving(false)
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
      const integration = integrations.find((int) => int.type === type)
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
        setIntegrationForm({
          ...integrationForm,
          n8nFlowUrl: config.flowUrl || "",
          n8nApiKey: config.apiKey || "",
        })
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
                className="w-full"
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
                className="w-full"
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
                className="gap-2"
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
                className={`px-4 py-2 rounded-lg text-sm ${
                  saveMessage.includes("sucesso") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {saveMessage}
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
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
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => updateURL("settings", "profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateURL("settings", "branding")}>
                  <Palette className="w-4 h-4 mr-2" />
                  Branding
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateURL("settings", "integrations")}>
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
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "users" && renderUsers()}
      {activeTab === "agents" && renderAgents()}
      {activeTab === "whatsapp" && renderWhatsAppConnections()}
      {activeTab === "admin" && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Administração Avançada</h1>
          <p className="text-gray-600">Configurações avançadas do sistema</p>
        </div>
      )}
      {activeTab === "settings" && renderSettings()}

      {/* Manter todos os modais */}
      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        user={selectedUserForEdit}
        onSuccess={fetchUsers}
      />

      <Dialog open={deleteUserModal} onOpenChange={setDeleteUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário "{userToDelete?.full_name}" ({userToDelete?.email})? Esta ação
              não pode ser desfeita e todas as conexões WhatsApp do usuário serão removidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={saving}>
              {saving ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WhatsAppQRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        connection={selectedWhatsAppConnection}
        onStatusChange={(status) => {
          if (selectedWhatsAppConnection) {
            supabase
              .from("whatsapp_connections")
              .update({ status })
              .eq("id", selectedWhatsAppConnection.id)
              .then(() => fetchWhatsAppConnections())
          }
        }}
      />

      <WhatsAppSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        connection={selectedWhatsAppConnection}
        onSettingsSaved={() => {
          setSaveMessage("Configurações salvas com sucesso!")
          setTimeout(() => setSaveMessage(""), 3000)
        }}
      />
    </div>
  )
}
