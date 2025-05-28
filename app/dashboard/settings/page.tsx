"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Home,
  Bot,
  Cog,
  LogOut,
  ChevronDown,
  Smartphone,
  Plus,
  User,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  QrCode,
  PowerOff,
} from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/components/theme-provider"
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal"
import { deleteEvolutionInstance } from "@/lib/whatsapp-api"
import WhatsAppQRModal from "@/components/whatsapp-qr-modal"
import WhatsAppSettingsModal from "@/components/whatsapp-settings-modal"
import { checkInstanceStatus, disconnectInstance } from "@/lib/whatsapp-settings-api"

export default function UserSettings() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")
  const router = useRouter()
  const { theme } = useTheme()

  // Estados para WhatsApp
  const [whatsappConnections, setWhatsappConnections] = useState([])
  const [connectionLimit, setConnectionLimit] = useState(2)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [loadingConnections, setLoadingConnections] = useState(false)

  // Estados para perfil
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState("")

  // Estados para confirmação de exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] = useState<any>(null)

  // Estados para QR Code e configurações
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/")
      return
    }
    if (currentUser.role === "admin") {
      router.push("/admin")
      return
    }
    setUser(currentUser)
    setProfileForm({
      full_name: currentUser.full_name || "",
      email: currentUser.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setLoading(false)
  }, [router])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const sidebarItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Bot, label: "Agentes IA", href: "#" },
    { icon: Cog, label: "Configurações", href: "/dashboard/settings", active: true },
  ]

  // Função para buscar conexões WhatsApp
  const fetchWhatsAppConnections = async () => {
    if (!user) return

    setLoadingConnections(true)
    try {
      const { data: connections } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setWhatsappConnections(connections || [])

      // Buscar limite de conexões do usuário
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("whatsapp_connections_limit")
        .eq("user_id", user.id)
        .single()

      if (userSettings) {
        setConnectionLimit(userSettings.whatsapp_connections_limit)
      } else {
        // Buscar limite padrão do sistema
        const { data: systemSettings } = await supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "default_whatsapp_connections_limit")
          .single()

        const defaultLimit = systemSettings?.setting_value || 2
        setConnectionLimit(defaultLimit)

        // Criar configuração para o usuário
        await supabase.from("user_settings").insert([
          {
            user_id: user.id,
            whatsapp_connections_limit: defaultLimit,
          },
        ])
      }
    } catch (error) {
      console.error("Erro ao buscar conexões:", error)
    } finally {
      setLoadingConnections(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchWhatsAppConnections()
    }
  }, [user])

  const handleDeleteConnection = async (connection: any) => {
    setConnectionToDelete(connection)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) return

    try {
      // Deletar da Evolution API
      await deleteEvolutionInstance(connectionToDelete.instance_name)

      // Deletar do banco
      const { error } = await supabase.from("whatsapp_connections").delete().eq("id", connectionToDelete.id)

      if (error) throw error

      await fetchWhatsAppConnections()
      setDeleteConfirmOpen(false)
      setConnectionToDelete(null)
    } catch (error) {
      console.error("Erro ao deletar conexão:", error)
    }
  }

  // Função para verificação periódica de status
  useEffect(() => {
    if (!user || whatsappConnections.length === 0) return

    const checkAllStatuses = async () => {
      for (const connection of whatsappConnections) {
        if (connection.status === "connecting") {
          try {
            const result = await checkInstanceStatus(connection.instance_name)
            if (result.success && result.status !== connection.status) {
              // Atualizar status no banco
              await supabase
                .from("whatsapp_connections")
                .update({
                  status: result.status,
                  phone_number: result.number || connection.phone_number,
                })
                .eq("id", connection.id)

              // Recarregar conexões
              await fetchWhatsAppConnections()
            }
          } catch (error) {
            console.error("Erro ao verificar status:", error)
          }
        }
      }
    }

    const interval = setInterval(checkAllStatuses, 5000)
    return () => clearInterval(interval)
  }, [user, whatsappConnections])

  const handleDisconnectConnection = async (connection: any) => {
    try {
      const result = await disconnectInstance(connection.instance_name)

      if (result.success) {
        // Atualizar status no banco
        await supabase.from("whatsapp_connections").update({ status: "disconnected" }).eq("id", connection.id)

        await fetchWhatsAppConnections()
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error)
    }
  }

  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    setProfileMessage("")

    try {
      // Validações
      if (!profileForm.full_name.trim()) {
        setProfileMessage("Nome é obrigatório")
        return
      }

      if (!profileForm.email.trim()) {
        setProfileMessage("Email é obrigatório")
        return
      }

      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileMessage("Senhas não coincidem")
        return
      }

      if (profileForm.newPassword && !profileForm.currentPassword) {
        setProfileMessage("Senha atual é obrigatória para alterar a senha")
        return
      }

      // Atualizar perfil
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: profileForm.full_name.trim(),
          email: profileForm.email.trim(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Atualizar usuário local
      const updatedUser = {
        ...user,
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setProfileMessage("Perfil atualizado com sucesso!")
      setProfileForm({
        ...profileForm,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      setProfileMessage("Erro ao atualizar perfil")
    } finally {
      setSavingProfile(false)
      setTimeout(() => setProfileMessage(""), 3000)
    }
  }

  const renderWhatsAppSettings = () => (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Conexões WhatsApp</h3>
          <p className="text-gray-600">Gerencie suas conexões WhatsApp para os agentes de IA</p>
        </div>
        <div className="text-sm text-gray-500">
          {whatsappConnections.length} de {connectionLimit} conexões utilizadas
        </div>
      </div>

      {whatsappConnections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="w-16 h-16 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhuma conexão WhatsApp</h4>
            <p className="text-gray-600 text-center mb-6">
              Crie sua primeira conexão para começar a usar os agentes de IA no WhatsApp
            </p>
            <Button
              onClick={() => setShowConnectionModal(true)}
              className="gap-2"
              disabled={whatsappConnections.length >= connectionLimit}
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Conexão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Suas Conexões</h4>
            <Button
              onClick={() => setShowConnectionModal(true)}
              className="gap-2"
              disabled={whatsappConnections.length >= connectionLimit}
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Nova Conexão
            </Button>
          </div>

          <div className="grid gap-4">
            {whatsappConnections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">{connection.connection_name}</div>
                        <div className="text-sm text-gray-600">{connection.phone_number || "Não conectado"}</div>
                        <div className="text-xs text-gray-500">
                          Criado em {new Date(connection.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={connection.status === "connected" ? "default" : "secondary"}
                        className={
                          connection.status === "connected"
                            ? "bg-green-100 text-green-700"
                            : connection.status === "connecting"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }
                      >
                        {connection.status === "connected"
                          ? "Conectado"
                          : connection.status === "connecting"
                            ? "Conectando"
                            : "Desconectado"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConnection(connection)
                            setQrModalOpen(true)
                          }}
                          title="Conectar/Ver QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConnection(connection)
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
                            onClick={() => handleDisconnectConnection(connection)}
                            title="Desconectar"
                          >
                            <PowerOff className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteConnection(connection)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderProfileSettings = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Informações do Perfil</h3>
        <p className="text-gray-600">Atualize suas informações pessoais e senha</p>
      </div>

      {profileMessage && (
        <Alert variant={profileMessage.includes("sucesso") ? "default" : "destructive"} className="mb-6">
          <AlertDescription>{profileMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
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
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={profileForm.currentPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                  placeholder="Senha atual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                  placeholder="Nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                  placeholder="Confirme a nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleUpdateProfile} disabled={savingProfile} className="gap-2">
          {savingProfile ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: theme?.primaryColor || "#2563eb" }}
            >
              {theme?.logoIcon === "🤖" ? (
                <Bot className="w-5 h-5" />
              ) : (
                <span className="text-lg">{theme?.logoIcon || "🤖"}</span>
              )}
            </div>
            <span className="font-semibold text-lg">{theme?.systemName}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Olá, {user?.full_name}</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.active ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button variant="ghost" className="w-full justify-start gap-2 text-gray-600" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
          <div className="text-xs text-gray-500 mt-2">
            <div>{theme?.systemName} Platform</div>
            <div>v1.0.0</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h1>
              <p className="text-gray-600">Gerencie suas configurações e conexões</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {activeTab === "profile" ? (
                    <>
                      <User className="w-4 h-4" />
                      Perfil
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      WhatsApp
                    </>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("whatsapp")}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {activeTab === "profile" && renderProfileSettings()}
          {activeTab === "whatsapp" && renderWhatsAppSettings()}
        </div>
      </div>

      {/* Modais */}
      <WhatsAppConnectionModal
        open={showConnectionModal}
        onOpenChange={setShowConnectionModal}
        userId={user?.id}
        onSuccess={fetchWhatsAppConnections}
      />

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conexão "{connectionToDelete?.connection_name}"? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteConnection}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modais */}
      <WhatsAppQRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        connection={selectedConnection}
        onStatusChange={(status) => {
          if (selectedConnection) {
            // Atualizar status no banco
            supabase
              .from("whatsapp_connections")
              .update({ status })
              .eq("id", selectedConnection.id)
              .then(() => fetchWhatsAppConnections())
          }
        }}
      />

      <WhatsAppSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        connection={selectedConnection}
        onSettingsSaved={() => {
          // Opcional: mostrar toast de sucesso
          console.log("Configurações salvas!")
        }}
      />
    </div>
  )
}
