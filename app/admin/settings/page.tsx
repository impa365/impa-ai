"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, ImageIcon, Eye, EyeOff, Plus, Copy, Trash2, Badge, ShieldCheck } from "lucide-react"
import { useTheme, themePresets, type ThemeConfig } from "@/components/theme-provider"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser, changePassword } from "@/lib/auth"
import { db, supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getSystemSettings, updateSystemSettings } from "@/lib/system-settings"
import { DynamicTitle } from "@/components/dynamic-title"

interface ApiKey {
  id: string
  api_key: string
  name: string
  description: string
  created_at: string
  last_used_at: string | null
  is_active: boolean
  is_admin_key: boolean
  access_scope: string
}

export default function AdminSettingsPage() {
  const [settingsSubTab, setSettingsSubTab] = useState("profile")
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const { theme, updateTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [integrations, setIntegrations] = useState([])
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false)
  const [integrationForm, setIntegrationForm] = useState({
    evolutionApiUrl: "",
    evolutionApiKey: "",
    n8nFlowUrl: "",
    n8nApiKey: "",
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

  // Estados para configurações do sistema
  const [systemSettings, setSystemSettings] = useState({
    defaultWhatsAppLimit: 2,
    defaultAgentsLimit: 5,
    allowPublicRegistration: false,
  })

  // Estados para upload de arquivos
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  // Estados para branding
  const [brandingForm, setBrandingForm] = useState<ThemeConfig>({
    systemName: "",
    description: "",
    logoIcon: "",
    primaryColor: "",
    secondaryColor: "",
    accentColor: "",
    logoUrl: "",
    faviconUrl: "",
    sidebarStyle: "",
    brandingEnabled: true,
  })
  const [brandingChanged, setBrandingChanged] = useState(false)

  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

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

  // Estados para Configurações do Sistema
  const [systemSettings2, setSystemSettings2] = useState<any>({})
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // Estados para API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loadingApiKeys, setLoadingApiKeys] = useState(false)
  const [creatingApiKey, setCreatingApiKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/")
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
    loadSystemSettings()
    loadApiKeys(currentUser.id)
    setLoading(false)
  }, [router])

  const loadSystemSettings = async () => {
    setLoadingSettings(true)
    try {
      const settings = await getSystemSettings()
      setSystemSettings2(settings)
    } catch (error) {
      console.error("Erro ao carregar configurações do sistema:", error)
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações do sistema.",
        variant: "destructive",
      })
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleUpdateSystemSettings = async () => {
    setSavingSettings(true)
    try {
      await updateSystemSettings(systemSettings2)
      toast({
        title: "Configurações salvas!",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações do sistema:", error)
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações do sistema.",
        variant: "destructive",
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    setProfileMessage("")

    try {
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

      if (profileForm.newPassword && profileForm.newPassword.length < 6) {
        setProfileMessage("Nova senha deve ter pelo menos 6 caracteres")
        return
      }

      // Preparar dados para atualização
      const updateData: any = {
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
        updated_at: new Date().toISOString(),
      }

      // Se há nova senha, incluir na atualização
      if (profileForm.newPassword) {
        const passwordUpdateResult = await changePassword(profileForm.currentPassword, profileForm.newPassword)
        if (!passwordUpdateResult.success) {
          setProfileMessage(passwordUpdateResult.error)
          return
        }
      }

      const { data, error } = await supabase.from("users").update(updateData).eq("id", user.id).select().single()

      if (error) throw error

      const updatedUser = {
        ...user,
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setProfileMessage(
        profileForm.newPassword ? "Perfil e senha atualizados com sucesso!" : "Perfil atualizado com sucesso!",
      )

      // Limpar campos de senha após sucesso
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

  // Funções de API Key
  const loadApiKeys = async (userId: string) => {
    if (!userId) return
    setLoadingApiKeys(true)
    try {
      const response = await fetch(`/api/user/api-keys?user_id=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setApiKeys(data.apiKeys || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Erro ao carregar API keys:", error)
      toast({
        title: "Erro ao carregar API Keys",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoadingApiKeys(false)
    }
  }

  const createApiKey = async (isAdminKey = false) => {
    if (!user?.id) return
    setCreatingApiKey(true)
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName || (isAdminKey ? "API Key de Administrador" : "API Key Padrão"),
          description: isAdminKey
            ? "API Key com acesso global a todos os bots do sistema"
            : "API Key para integração com sistemas externos (acesso próprio)",
          user_id: user.id,
          is_admin_key: isAdminKey,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: `API Key ${isAdminKey ? "de Administrador" : "Padrão"} criada!`,
          description: `Sua nova API key ${isAdminKey ? "com acesso global" : ""} foi gerada.`,
        })
        setNewKeyName("")
        setShowNewKeyForm(false)
        loadApiKeys(user.id)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Erro ao criar API Key",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setCreatingApiKey(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!user?.id) return
    try {
      await fetch(`/api/user/api-keys?id=${id}&user_id=${user.id}`, { method: "DELETE" })
      toast({ title: "API Key removida", description: "A API key foi removida com sucesso." })
      loadApiKeys(user.id)
    } catch (error) {
      toast({ title: "Erro ao remover API Key", variant: "destructive" })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado!", description: "API Key copiada para a área de transferência." })
  }

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    fetchIntegrations()
    fetchSystemSettings2()

    // Inicializar formulário de branding com o tema atual
    setBrandingForm(theme)

    if (currentUser) {
      setAdminProfileForm({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }, [theme])

  const fetchSystemSettings2 = async () => {
    try {
      // Buscar configurações específicas usando a nova estrutura
      const { data: limitData, error: limitError } = await db
        .systemSettings()
        .select("setting_value")
        .eq("setting_key", "default_whatsapp_connections_limit")
        .single()

      const { data: agentsLimitData, error: agentsError } = await db
        .systemSettings()
        .select("setting_value")
        .eq("setting_key", "default_agents_limit")
        .single()

      const { data: registrationData, error: regError } = await db
        .systemSettings()
        .select("setting_value")
        .eq("setting_key", "allow_public_registration")
        .single()

      // Se alguma configuração não existir, usar valores padrão
      if (limitError && limitError.code === "PGRST116") {
        console.log("Configuração 'default_whatsapp_connections_limit' não encontrada")
      }
      if (agentsError && agentsError.code === "PGRST116") {
        console.log("Configuração 'default_agents_limit' não encontrada")
      }
      if (regError && regError.code === "PGRST116") {
        console.log("Configuração 'allow_public_registration' não encontrada")
      }

      setSystemSettings({
        defaultWhatsAppLimit: limitData?.setting_value || 2,
        defaultAgentsLimit: agentsLimitData?.setting_value || 5,
        allowPublicRegistration: registrationData?.setting_value === true,
      })
    } catch (error) {
      console.error("Erro ao buscar configurações do sistema:", error)
      setSaveMessage("Erro ao carregar configurações. Verifique se as tabelas foram criadas.")
    }
  }

  const saveSystemSettings2 = async () => {
    setSaving(true)
    try {
      // Salvar configurações usando upsert na nova estrutura
      const settingsToUpsert = [
        {
          setting_key: "default_whatsapp_connections_limit",
          setting_value: systemSettings.defaultWhatsAppLimit,
          category: "limits",
          description: "Limite padrão de conexões WhatsApp para novos usuários",
          is_public: false,
          requires_restart: false,
        },
        {
          setting_key: "default_agents_limit",
          setting_value: systemSettings.defaultAgentsLimit,
          category: "limits",
          description: "Limite padrão de agentes IA para novos usuários",
          is_public: false,
          requires_restart: false,
        },
        {
          setting_key: "allow_public_registration",
          setting_value: systemSettings.allowPublicRegistration,
          category: "auth",
          description: "Permitir cadastro público de usuários",
          is_public: true,
          requires_restart: false,
        },
      ]

      for (const setting of settingsToUpsert) {
        const { error } = await db.systemSettings().upsert(setting, { onConflict: "setting_key" })

        if (error) {
          console.error(`Erro ao salvar ${setting.setting_key}:`, error)
          throw error
        }
      }

      setSaveMessage("Configurações do sistema salvas com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      setSaveMessage("Erro ao salvar configurações do sistema")
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

      if (adminProfileForm.newPassword && adminProfileForm.newPassword.length < 6) {
        setAdminProfileMessage("Nova senha deve ter pelo menos 6 caracteres")
        return
      }

      // Preparar dados para atualização
      const updateData: any = {
        full_name: adminProfileForm.full_name.trim(),
        email: adminProfileForm.email.trim(),
        updated_at: new Date().toISOString(),
      }

      // Se há nova senha, incluir na atualização
      if (adminProfileForm.newPassword) {
        updateData.password = adminProfileForm.newPassword
      }

      const { error } = await db.users().update(updateData).eq("id", user.id)

      if (error) throw error

      const updatedUser = {
        ...user,
        full_name: adminProfileForm.full_name.trim(),
        email: adminProfileForm.email.trim(),
      }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))

      setAdminProfileMessage(
        adminProfileForm.newPassword ? "Perfil e senha atualizados com sucesso!" : "Perfil atualizado com sucesso!",
      )

      // Limpar campos de senha após sucesso
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

  const handleIntegrationSave = async (type: string) => {
    setSaving(true)
    try {
      // Validar campos obrigatórios
      if (type === "evolution_api") {
        if (!integrationForm.evolutionApiUrl.trim()) {
          throw new Error("URL da API Evolution é obrigatória")
        }
        if (!integrationForm.evolutionApiKey.trim()) {
          throw new Error("API Key da Evolution é obrigatória")
        }
      } else if (type === "n8n") {
        if (!integrationForm.n8nFlowUrl.trim()) {
          throw new Error("URL do Fluxo n8n é obrigatória")
        }
      }

      // Preparar dados de configuração
      let config = {}
      if (type === "evolution_api") {
        config = {
          apiUrl: integrationForm.evolutionApiUrl.trim(),
          apiKey: integrationForm.evolutionApiKey.trim(),
        }
      } else if (type === "n8n") {
        config = {
          flowUrl: integrationForm.n8nFlowUrl.trim(),
          apiKey: integrationForm.n8nApiKey?.trim() || null,
        }
      }

      // Verificar se já existe uma integração deste tipo
      const existing = integrations.find((int: any) => int.type === type)

      if (existing) {
        // Atualizar integração existente
        const { data, error } = await db
          .integrations()
          .update({
            config,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()

        if (error) {
          console.error("Erro ao atualizar integração:", error)
          throw error
        }

        console.log("Integração atualizada:", data)
      } else {
        // Criar nova integração
        const { data, error } = await db
          .integrations()
          .insert([
            {
              name: type === "evolution_api" ? "Evolution API" : "n8n",
              type,
              config,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()

        if (error) {
          console.error("Erro ao criar integração:", error)
          throw error
        }

        console.log("Nova integração criada:", data)
      }

      // Recarregar lista de integrações
      await fetchIntegrations()
      setIntegrationModalOpen(false)
      setSaveMessage("Integração salva com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error: any) {
      console.error("Erro detalhado ao salvar integração:", error)
      setSaveMessage(`Erro ao salvar integração: ${error.message}`)
      setTimeout(() => setSaveMessage(""), 5000)
    } finally {
      setSaving(false)
    }
  }

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await db.integrations().select("*").order("created_at", { ascending: false })

      if (error) {
        // Se a tabela não existir, mostrar mensagem específica
        if (error.code === "PGRST116" || error.message.includes("does not exist")) {
          console.log("Tabela 'integrations' não encontrada no schema impaai")
          setSaveMessage("Tabela 'integrations' não encontrada. Execute o script SQL para criar a estrutura.")
          setIntegrations([])
          return
        }
        console.error("Erro ao buscar integrações:", error)
        throw error
      }

      console.log("Integrações carregadas:", data)
      if (data) setIntegrations(data)
    } catch (err) {
      console.error("Erro ao buscar integrações:", err)
      setSaveMessage("Erro ao conectar com o banco de dados. Verifique se as tabelas foram criadas.")
      setIntegrations([])
    }
  }

  const validateImageFile = (file: File, type: "logo" | "favicon") => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg"]
    if (type === "favicon") {
      validTypes.push("image/x-icon", "image/vnd.microsoft.icon")
    }

    if (!validTypes.includes(file.type)) {
      throw new Error(`Formato inválido. Use ${type === "favicon" ? "ICO, PNG" : "PNG, JPG"}`)
    }

    const maxSize = type === "favicon" ? 1 * 1024 * 1024 : 2 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande. Máximo ${type === "favicon" ? "1MB" : "2MB"}`)
    }

    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        if (type === "favicon") {
          if (img.width !== 32 || img.height !== 32) {
            reject(new Error("Favicon deve ter exatamente 32x32 pixels"))
            return
          }
        } else {
          if (img.width < 100 || img.height < 100) {
            reject(new Error("Logo deve ter pelo menos 100x100 pixels"))
            return
          }
          if (img.width > 500 || img.height > 500) {
            reject(new Error("Logo deve ter no máximo 500x500 pixels"))
            return
          }
        }
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => reject(new Error("Erro ao carregar imagem"))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setSaveMessage("")

    try {
      await validateImageFile(file, "logo")

      // TODO: Implementar upload real para Supabase Storage
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSaveMessage("Logo enviado com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error: any) {
      setSaveMessage(error.message)
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ""
      }
    }
  }

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingFavicon(true)
    setSaveMessage("")

    try {
      await validateImageFile(file, "favicon")

      // TODO: Implementar upload real para Supabase Storage
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSaveMessage("Favicon enviado com sucesso!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error: any) {
      setSaveMessage(error.message)
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setUploadingFavicon(false)
      if (faviconInputRef.current) {
        faviconInputRef.current.value = ""
      }
    }
  }

  const renderAdminProfileSettings = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Perfil do Administrador</h3>
        <p className="text-gray-600 dark:text-gray-400">Gerencie suas informações pessoais e senha</p>
      </div>

      {adminProfileMessage && (
        <Alert variant={adminProfileMessage.includes("sucesso") ? "default" : "destructive"} className="mb-6">
          <AlertDescription>{adminProfileMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminFullName" className="text-gray-900 dark:text-gray-100">
                Nome Completo
              </Label>
              <Input
                id="adminFullName"
                value={adminProfileForm.full_name}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, full_name: e.target.value })}
                placeholder="Seu nome completo"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="adminEmail" className="text-gray-900 dark:text-gray-100">
                Email
              </Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminProfileForm.email}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                placeholder="seu@email.com"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminCurrentPassword" className="text-gray-900 dark:text-gray-100">
                Senha Atual (opcional para admin)
              </Label>
              <div className="relative">
                <Input
                  id="adminCurrentPassword"
                  type={showAdminPasswords.current ? "text" : "password"}
                  value={adminProfileForm.currentPassword}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, currentPassword: e.target.value })}
                  placeholder="Senha atual (não obrigatória para admin)"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Como administrador, você pode alterar sua senha sem informar a atual
              </p>
            </div>
            <div>
              <Label htmlFor="adminNewPassword" className="text-gray-900 dark:text-gray-100">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="adminNewPassword"
                  type={showAdminPasswords.new ? "text" : "password"}
                  value={adminProfileForm.newPassword}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, newPassword: e.target.value })}
                  placeholder="Nova senha"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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
              <Label htmlFor="adminConfirmPassword" className="text-gray-900 dark:text-gray-100">
                Confirmar Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="adminConfirmPassword"
                  type={showAdminPasswords.confirm ? "text" : "password"}
                  value={adminProfileForm.confirmPassword}
                  onChange={(e) => setAdminProfileForm({ ...adminProfileForm, confirmPassword: e.target.value })}
                  placeholder="Confirme a nova senha"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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

  const renderSystemSettings = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Configurações do Sistema</h3>
        <p className="text-gray-600 dark:text-gray-400">Configure parâmetros globais da plataforma</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Limites e Restrições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultWhatsAppLimit" className="text-gray-900 dark:text-gray-100">
                Limite Padrão de Conexões WhatsApp
              </Label>
              <Input
                id="defaultWhatsAppLimit"
                type="number"
                value={systemSettings.defaultWhatsAppLimit}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    defaultWhatsAppLimit: Number.parseInt(e.target.value) || 2,
                  })
                }
                min="1"
                max="50"
                className="w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Número máximo de conexões WhatsApp que novos usuários podem criar
              </p>
            </div>
            <div>
              <Label htmlFor="defaultAgentsLimit" className="text-gray-900 dark:text-gray-100">
                Limite Padrão de Agentes IA
              </Label>
              <Input
                id="defaultAgentsLimit"
                type="number"
                value={systemSettings.defaultAgentsLimit}
                onChange={(e) =>
                  setSystemSettings({
                    ...systemSettings,
                    defaultAgentsLimit: Number.parseInt(e.target.value) || 5,
                  })
                }
                min="1"
                max="100"
                className="w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Número máximo de agentes IA que novos usuários podem criar
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Cadastro de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowRegistration" className="text-gray-900 dark:text-gray-100">
                  Permitir Cadastro Público
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Permite que novos usuários se cadastrem na tela de login
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowRegistration"
                  checked={systemSettings.allowPublicRegistration}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      allowPublicRegistration: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {systemSettings.allowPublicRegistration ? "Habilitado" : "Desabilitado"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={saveSystemSettings2}
            disabled={saving}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderBrandingSettings = () => {
    const handleBrandingChange = (updates: Partial<ThemeConfig>) => {
      setBrandingForm((prev) => ({ ...prev, ...updates }))
      setBrandingChanged(true)
    }

    const handleSaveBranding = async () => {
      setSaving(true)
      setSaveMessage("")

      try {
        await updateTheme(brandingForm)
        setBrandingChanged(false)
        setSaveMessage("Configurações de branding salvas com sucesso!")
        setTimeout(() => setSaveMessage(""), 3000)
      } catch (error) {
        setSaveMessage("Erro ao salvar configurações de branding")
        setTimeout(() => setSaveMessage(""), 3000)
      } finally {
        setSaving(false)
      }
    }

    const handleResetBranding = () => {
      setBrandingForm(theme)
      setBrandingChanged(false)
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Branding e Identidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="systemName" className="text-gray-900 dark:text-gray-100">
                  Nome do Sistema
                </Label>
                <Input
                  id="systemName"
                  value={brandingForm.systemName}
                  onChange={(e) => handleBrandingChange({ systemName: e.target.value })}
                  placeholder="Nome da sua plataforma"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={brandingForm.description || ""}
                  onChange={(e) => handleBrandingChange({ description: e.target.value })}
                  placeholder="Descrição da sua plataforma"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="logoIcon" className="text-gray-900 dark:text-gray-100">
                  Ícone/Emoji do Logo
                </Label>
                <Input
                  id="logoIcon"
                  value={brandingForm.logoIcon}
                  onChange={(e) => handleBrandingChange({ logoIcon: e.target.value })}
                  placeholder="🤖"
                  maxLength={2}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="logoUpload" className="text-gray-900 dark:text-gray-100">
                  Upload de Logo
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={saving || uploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? "Enviando..." : "Escolher Logo"}
                    </Button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Formatos: PNG, JPG</p>
                    <p>• Tamanho: 100x100 até 500x500 pixels</p>
                    <p>• Máximo: 2MB</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="faviconUpload" className="text-gray-900 dark:text-gray-100">
                  Upload de Favicon
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={saving || uploadingFavicon}
                      onClick={() => faviconInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4" />
                      {uploadingFavicon ? "Enviando..." : "Escolher Favicon"}
                    </Button>
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/x-icon,image/vnd.microsoft.icon,image/png"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Formatos: ICO, PNG</p>
                    <p>• Tamanho: exatamente 32x32 pixels</p>
                    <p>• Máximo: 1MB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Esquema de Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primaryColor" className="text-gray-900 dark:text-gray-100">
                  Cor Primária
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={brandingForm.primaryColor}
                    onChange={(e) => handleBrandingChange({ primaryColor: e.target.value })}
                    className="w-16 h-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <Input
                    value={brandingForm.primaryColor}
                    onChange={(e) => handleBrandingChange({ primaryColor: e.target.value })}
                    placeholder="#2563eb"
                    className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor" className="text-gray-900 dark:text-gray-100">
                  Cor Secundária
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={brandingForm.secondaryColor}
                    onChange={(e) => handleBrandingChange({ secondaryColor: e.target.value })}
                    className="w-16 h-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <Input
                    value={brandingForm.secondaryColor}
                    onChange={(e) => handleBrandingChange({ secondaryColor: e.target.value })}
                    placeholder="#10b981"
                    className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accentColor" className="text-gray-900 dark:text-gray-100">
                  Cor de Destaque
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={brandingForm.accentColor}
                    onChange={(e) => handleBrandingChange({ accentColor: e.target.value })}
                    className="w-16 h-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  <Input
                    value={brandingForm.accentColor}
                    onChange={(e) => handleBrandingChange({ accentColor: e.target.value })}
                    placeholder="#8b5cf6"
                    className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Temas Predefinidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(themePresets).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => handleBrandingChange(preset)}
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
              <CardTitle className="text-gray-900 dark:text-gray-100">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: brandingForm.primaryColor }}
                  >
                    <span className="text-sm">{brandingForm.logoIcon}</span>
                  </div>
                  <span className="font-semibold">{brandingForm.systemName}</span>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-3 rounded"
                    style={{ backgroundColor: brandingForm.primaryColor, opacity: 0.8 }}
                  ></div>
                  <div
                    className="h-3 rounded w-3/4"
                    style={{ backgroundColor: brandingForm.secondaryColor, opacity: 0.6 }}
                  ></div>
                  <div
                    className="h-3 rounded w-1/2"
                    style={{ backgroundColor: brandingForm.accentColor, opacity: 0.4 }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex items-center gap-2">
            {brandingChanged && (
              <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/50 px-3 py-1 rounded-md">
                Você tem alterações não salvas
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleResetBranding}
              disabled={!brandingChanged || saving}
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveBranding}
              disabled={!brandingChanged || saving}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
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
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Integrações Disponíveis</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Configure as integrações para expandir as funcionalidades da plataforma
          </p>

          {saveMessage.includes("Tabela") && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>
                {saveMessage}
                <br />
                <strong>Execute este script SQL no seu Supabase:</strong>
                <code className="block mt-2 p-2 bg-gray-100 rounded text-xs">
                  CREATE TABLE IF NOT EXISTS impaai.integrations ( id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name
                  VARCHAR(255) NOT NULL, type VARCHAR(100) NOT NULL, config JSONB DEFAULT '{}', is_active BOOLEAN
                  DEFAULT true, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE
                  DEFAULT NOW() );
                </code>
              </AlertDescription>
            </Alert>
          )}
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
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Evolution API</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Integração com WhatsApp Business</p>
              <Button
                onClick={() => openIntegrationModal("evolution_api", "Evolution API")}
                className={
                  getIntegrationConfig("evolution_api").apiUrl
                    ? "w-full bg-green-600 text-white hover:bg-green-700"
                    : "w-full"
                }
                variant={getIntegrationConfig("evolution_api").apiUrl ? undefined : "outline"}
                disabled={saveMessage.includes("Tabela")}
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
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">n8n</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Automação de fluxos de trabalho</p>
              <Button
                onClick={() => openIntegrationModal("n8n", "n8n")}
                className={
                  getIntegrationConfig("n8n").flowUrl ? "w-full bg-green-600 text-white hover:bg-green-700" : "w-full"
                }
                variant={getIntegrationConfig("n8n").flowUrl ? undefined : "outline"}
                disabled={saveMessage.includes("Tabela")}
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
        </div>

        <Dialog open={integrationModalOpen} onOpenChange={setIntegrationModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">
                Configurar {selectedIntegration?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Configure as credenciais para integração com {selectedIntegration?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedIntegration?.type === "evolution_api" && (
                <>
                  <div>
                    <Label htmlFor="evolutionApiUrl" className="text-gray-900 dark:text-gray-100">
                      URL da API Evolution *
                    </Label>
                    <Input
                      id="evolutionApiUrl"
                      value={integrationForm.evolutionApiUrl}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, evolutionApiUrl: e.target.value })}
                      placeholder="https://api.evolution.com"
                      required
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="evolutionApiKey" className="text-gray-900 dark:text-gray-100">
                      API Key Global *
                    </Label>
                    <Input
                      id="evolutionApiKey"
                      type="password"
                      value={integrationForm.evolutionApiKey}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, evolutionApiKey: e.target.value })}
                      placeholder="Sua API Key"
                      required
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </>
              )}

              {selectedIntegration?.type === "n8n" && (
                <>
                  <div>
                    <Label htmlFor="n8nFlowUrl" className="text-gray-900 dark:text-gray-100">
                      URL do Fluxo *
                    </Label>
                    <Input
                      id="n8nFlowUrl"
                      value={integrationForm.n8nFlowUrl}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, n8nFlowUrl: e.target.value })}
                      placeholder="https://n8n.exemplo.com/webhook/..."
                      required
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="n8nApiKey" className="text-gray-900 dark:text-gray-100">
                      API Key do Fluxo (Opcional)
                    </Label>
                    <Input
                      id="n8nApiKey"
                      type="password"
                      value={integrationForm.n8nApiKey}
                      onChange={(e) => setIntegrationForm({ ...integrationForm, n8nApiKey: e.target.value })}
                      placeholder="API Key (se necessário)"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIntegrationModalOpen(false)}
                className="text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleIntegrationSave(selectedIntegration?.type)}
                disabled={saving}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <>
      <DynamicTitle suffix="Configurações" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Configurações - {theme.systemName}</h1>
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="apiKeys">API Keys</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Perfil do Administrador</h3>
              <p className="text-gray-600 dark:text-gray-400">Gerencie suas informações pessoais e senha</p>
            </div>

            {profileMessage && (
              <Alert variant={profileMessage.includes("sucesso") ? "default" : "destructive"} className="mb-6">
                <AlertDescription>{profileMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adminFullName" className="text-gray-900 dark:text-gray-100">
                      Nome Completo
                    </Label>
                    <Input
                      id="adminFullName"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      placeholder="Seu nome completo"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail" className="text-gray-900 dark:text-gray-100">
                      Email
                    </Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Alterar Senha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adminCurrentPassword" className="text-gray-900 dark:text-gray-100">
                      Senha Atual (opcional para admin)
                    </Label>
                    <div className="relative">
                      <Input
                        id="adminCurrentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        placeholder="Senha atual (não obrigatória para admin)"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Como administrador, você pode alterar sua senha sem informar a atual
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="adminNewPassword" className="text-gray-900 dark:text-gray-100">
                      Nova Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="adminNewPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        placeholder="Nova senha"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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
                    <Label htmlFor="adminConfirmPassword" className="text-gray-900 dark:text-gray-100">
                      Confirmar Nova Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="adminConfirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                        placeholder="Confirme a nova senha"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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
              <Button
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                {savingProfile ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="system" className="mt-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Configurações do Sistema</h3>
              <p className="text-gray-600 dark:text-gray-400">Configure parâmetros globais da plataforma</p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Limites e Restrições</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="defaultWhatsAppLimit" className="text-gray-900 dark:text-gray-100">
                      Limite Padrão de Conexões WhatsApp
                    </Label>
                    <Input
                      id="defaultWhatsAppLimit"
                      type="number"
                      value={systemSettings2.default_whatsapp_connections_limit || 2}
                      onChange={(e) =>
                        setSystemSettings2({
                          ...systemSettings2,
                          default_whatsapp_connections_limit: Number.parseInt(e.target.value) || 2,
                        })
                      }
                      min="1"
                      max="50"
                      className="w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Número máximo de conexões WhatsApp que novos usuários podem criar
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="defaultAgentsLimit" className="text-gray-900 dark:text-gray-100">
                      Limite Padrão de Agentes IA
                    </Label>
                    <Input
                      id="defaultAgentsLimit"
                      type="number"
                      value={systemSettings2.default_agents_limit || 5}
                      onChange={(e) =>
                        setSystemSettings2({
                          ...systemSettings2,
                          default_agents_limit: Number.parseInt(e.target.value) || 5,
                        })
                      }
                      min="1"
                      max="100"
                      className="w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Número máximo de agentes IA que novos usuários podem criar
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Cadastro de Usuários</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowRegistration" className="text-gray-900 dark:text-gray-100">
                        Permitir Cadastro Público
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Permite que novos usuários se cadastrem na tela de login
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowRegistration"
                        checked={systemSettings2.allow_public_registration === true}
                        onCheckedChange={(checked) =>
                          setSystemSettings2({
                            ...systemSettings2,
                            allow_public_registration: checked,
                          })
                        }
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {systemSettings2.allow_public_registration ? "Habilitado" : "Desabilitado"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateSystemSettings}
                  disabled={savingSettings}
                  className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {savingSettings ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="apiKeys" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Gerenciamento de API Keys</CardTitle>
                    <CardDescription>Crie e gerencie chaves de API para você.</CardDescription>
                  </div>
                  {!showNewKeyForm ? (
                    <Button onClick={() => setShowNewKeyForm(true)} className="gap-2">
                      <Plus className="h-4 w-4" /> Nova API Key
                    </Button>
                  ) : (
                    <Button onClick={() => setShowNewKeyForm(false)} variant="outline">
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showNewKeyForm && (
                  <div className="mb-6 p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium">Criar Nova API Key</h4>
                    <div>
                      <Label htmlFor="keyName">Nome da API Key (Opcional)</Label>
                      <Input
                        id="keyName"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="Ex: Integração N8N Pessoal"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => createApiKey(false)}
                        className="w-full"
                        disabled={creatingApiKey}
                        variant="outline"
                      >
                        {creatingApiKey ? "Criando..." : "Criar Chave Padrão (Acesso Próprio)"}
                      </Button>
                      <Button
                        onClick={() => createApiKey(true)}
                        className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
                        disabled={creatingApiKey}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {creatingApiKey ? "Criando..." : "Criar Chave de Admin (Acesso Global)"}
                      </Button>
                    </div>
                  </div>
                )}

                {loadingApiKeys ? (
                  <p>Carregando API keys...</p>
                ) : apiKeys.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma API key encontrada.</p>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">{apiKey.name}</h4>
                              {apiKey.is_admin_key ? (
                                <Badge className="bg-red-100 text-red-700">ADMIN</Badge>
                              ) : (
                                <Badge variant="secondary">PADRÃO</Badge>
                              )}
                              <Badge variant="outline">
                                {apiKey.access_scope === "admin" ? "Acesso Global" : "Acesso Próprio"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{apiKey.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input value={apiKey.api_key} readOnly className="font-mono text-sm" />
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey.api_key)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4">
            {renderIntegrationsSettings()}

            {/* Keep the diagnostics section, perhaps in its own card or as part of the integrations settings */}
          </TabsContent>

          <TabsContent value="branding" className="mt-4">
            {renderBrandingSettings()}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
