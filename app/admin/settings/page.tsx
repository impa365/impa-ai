"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff, Plus } from "lucide-react"
import { useTheme, themePresets, type ThemeConfig } from "@/components/theme-provider"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/auth"
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
import { DynamicTitle } from "@/components/dynamic-title"

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const { theme, updateTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [integrations, setIntegrations] = useState<any[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false)
  const [integrationForm, setIntegrationForm] = useState({
    evolutionApiUrl: "",
    evolutionApiKey: "",
    n8nFlowUrl: "",
    n8nApiKey: "",
  })

  // Estados para upload de arquivos
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  // Estados para branding - CORRIGIDO para usar apenas campos existentes
  const [brandingForm, setBrandingForm] = useState<ThemeConfig>({
    systemName: "",
    description: "",
    logoIcon: "",
    primaryColor: "",
    secondaryColor: "",
    accentColor: "",
    brandingEnabled: true,
  })
  const [brandingChanged, setBrandingChanged] = useState(false)
  const [brandingLoaded, setBrandingLoaded] = useState(false)

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
  const [systemSettings, setSystemSettings] = useState<any>({
    default_whatsapp_connections_limit: 1,
    default_agents_limit: 2,
    allow_public_registration: false,
    landing_page_enabled: true,
    footer_text: "© 2024 Impa AI - Desenvolvido pela Comunidade IMPA",
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [isLandingPageDisabled, setIsLandingPageDisabled] = useState(false)

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

    // Carregar dados iniciais
    loadInitialData()
  }, [router])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadSystemSettings(), fetchIntegrations(), loadBrandingFromServer(), checkLandingPageAvailability()])
    } catch (error) {
      // Log apenas erro genérico, sem dados sensíveis
      console.error("Erro ao carregar dados iniciais")
    } finally {
      setLoading(false)
    }
  }

  // FUNÇÃO SEGURA - SEM LOGS DE DADOS SENSÍVEIS
  const loadSystemSettings = async () => {
    if (settingsLoaded) return

    setLoadingSettings(true)
    try {
      const response = await fetch("/api/system/settings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.settings) {
        // Garantir que os valores sejam do tipo correto
        const settings = {
          default_whatsapp_connections_limit: Number(data.settings.default_whatsapp_connections_limit) || 1,
          default_agents_limit: Number(data.settings.default_agents_limit) || 2,
          allow_public_registration: Boolean(data.settings.allow_public_registration),
          ...data.settings,
        }

        setSystemSettings(settings)
        setSettingsLoaded(true)
        // ✅ LOG SEGURO - apenas confirmação sem dados
        console.log("Configurações do sistema carregadas com sucesso")
      }
    } catch (error) {
      console.error("Erro ao buscar configurações do sistema")
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações do sistema.",
        variant: "destructive",
      })
    } finally {
      setLoadingSettings(false)
    }
  }

  // FUNÇÃO SEGURA - SEM LOGS DE DADOS SENSÍVEIS
  const saveSystemSettings = async () => {
    setSavingSettings(true)
    try {
      const response = await fetch("/api/system/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(systemSettings),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Configurações salvas!",
          description: "As configurações do sistema foram atualizadas com sucesso.",
        })
        // Recarregar configurações após salvar para garantir sincronização
        setSettingsLoaded(false)
        await loadSystemSettings()
      } else {
        throw new Error(data.error || "Erro desconhecido")
      }
    } catch (error: any) {
      console.error("Erro ao salvar configurações do sistema")
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações.",
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

      // Fazer chamada para API de atualização de perfil
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: profileForm.full_name,
          email: profileForm.email,
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword,
          confirmPassword: profileForm.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar perfil")
      }

      setProfileMessage("Perfil atualizado com sucesso!")

      // Atualizar dados do usuário no estado se necessário
      if (data.user) {
        setUser({ ...user, ...data.user })
        setProfileForm({
          ...profileForm,
          full_name: data.user.full_name,
          email: data.user.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
      // Limpar campos de senha após sucesso
      setProfileForm({
        ...profileForm,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      }

      // Mostrar toast de sucesso
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      })

    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error.message)
      setProfileMessage(error.message || "Erro ao atualizar perfil")
    } finally {
      setSavingProfile(false)
      setTimeout(() => setProfileMessage(""), 5000)
    }
  }

  // FUNÇÃO SEGURA - SEM LOGS DE DADOS SENSÍVEIS
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

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          name: type === "evolution_api" ? "Evolution API" : "n8n",
          config,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Recarregar lista de integrações
        await fetchIntegrations()
        setIntegrationModalOpen(false)

        // Limpar formulário
        setIntegrationForm({
          evolutionApiUrl: "",
          evolutionApiKey: "",
          n8nFlowUrl: "",
          n8nApiKey: "",
        })

        toast({
          title: "Integração salva!",
          description: data.message || "Integração salva com sucesso!",
        })
      } else {
        throw new Error(data.error || "Erro desconhecido")
      }
    } catch (error: any) {
      console.error("Erro ao salvar integração")
      toast({
        title: "Erro ao salvar integração",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // FUNÇÃO SEGURA - SEM LOGS DE DADOS SENSÍVEIS
  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        const integrationsData = Array.isArray(data.integrations) ? data.integrations : []
        setIntegrations(integrationsData)
        // ✅ LOG SEGURO - apenas quantidade, sem dados sensíveis
        console.log(`${integrationsData.length} integrações carregadas`)
      } else {
        throw new Error(data.error || "Erro desconhecido")
      }
    } catch (err: any) {
      console.error("Erro ao buscar integrações")
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

    try {
      await validateImageFile(file, "logo")

      // TODO: Implementar upload real para Supabase Storage
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Logo enviado!",
        description: "Logo enviado com sucesso!",
      })
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      })
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

    try {
      await validateImageFile(file, "favicon")

      // TODO: Implementar upload real para Supabase Storage
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Favicon enviado!",
        description: "Favicon enviado com sucesso!",
      })
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploadingFavicon(false)
      if (faviconInputRef.current) {
        faviconInputRef.current.value = ""
      }
    }
  }

  const renderSystemSettings = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Configurações do Sistema</h3>
        <p className="text-gray-600 dark:text-gray-400">Configure parâmetros globais da plataforma</p>
      </div>

      {saveMessage && (
        <Alert variant={saveMessage.includes("sucesso") ? "default" : "destructive"} className="mb-6">
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

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
                value={systemSettings.default_whatsapp_connections_limit}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value) || 1
                  setSystemSettings((prev) => ({
                    ...prev,
                    default_whatsapp_connections_limit: value,
                  }))
                }}
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
                value={systemSettings.default_agents_limit}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value) || 2
                  setSystemSettings((prev) => ({
                    ...prev,
                    default_agents_limit: value,
                  }))
                }}
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
            <CardTitle className="text-gray-900 dark:text-gray-100">Interface e Experiência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isLandingPageDisabled && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="landingPageEnabled" className="text-gray-900 dark:text-gray-100">
                    Landing Page Ativa
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Quando ativada, visitantes veem a landing page. Quando desativada, são direcionados direto para o login.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="landingPageEnabled"
                    checked={Boolean(systemSettings.landing_page_enabled)}
                    onCheckedChange={async (checked) => {
                      try {
                        // Atualizar via API dedicada para landing page
                        const response = await fetch("/api/system/landing-page-status", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ enabled: checked }),
                        })

                        const data = await response.json()

                        if (data.success) {
                          setSystemSettings((prev) => ({
                            ...prev,
                            landing_page_enabled: checked,
                          }))
                          toast({
                            title: checked ? "Landing page ativada!" : "Landing page desativada!",
                            description: checked 
                              ? "Visitantes agora verão a landing page primeiro." 
                              : "Visitantes serão direcionados direto para o login.",
                          })
                        } else {
                          throw new Error(data.error || "Erro ao atualizar configuração")
                        }
                      } catch (error: any) {
                        console.error("Erro ao atualizar landing page:", error)
                        toast({
                          title: "Erro ao atualizar configuração",
                          description: error.message || "Não foi possível alterar o status da landing page.",
                          variant: "destructive",
                        })
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {systemSettings.landing_page_enabled ? "Ativada" : "Desativada"}
                  </span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="footerText" className="text-gray-900 dark:text-gray-100">
                Texto do Rodapé
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                Texto exibido no rodapé das páginas de login e outras páginas públicas
              </p>
              <Textarea
                id="footerText"
                value={systemSettings.footer_text || ""}
                onChange={(e) => setSystemSettings(prev => ({
                  ...prev,
                  footer_text: e.target.value
                }))}
                placeholder="© 2024 Sua Empresa - Desenvolvido por..."
                className="w-full"
                rows={3}
              />
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
                  checked={Boolean(systemSettings.allow_public_registration)}
                  onCheckedChange={(checked) => {
                    setSystemSettings((prev) => ({
                      ...prev,
                      allow_public_registration: checked,
                    }))
                  }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {systemSettings.allow_public_registration ? "Habilitado" : "Desabilitado"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={saveSystemSettings}
            disabled={savingSettings || loadingSettings}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            {savingSettings ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  )

  // FUNÇÃO SEGURA - SEM LOGS DE DADOS SENSÍVEIS
  // Verificar se a landing page está disponível (não desabilitada via env)
  const checkLandingPageAvailability = async () => {
    try {
      const response = await fetch('/api/system/landing-page-status')
      const data = await response.json()
      
      if (data.success && data.disabled) {
        setIsLandingPageDisabled(true)
      } else {
        setIsLandingPageDisabled(false)
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade da landing page:', error)
      setIsLandingPageDisabled(false)
    }
  }

  const loadBrandingFromServer = async () => {
    if (brandingLoaded) return

    try {
      const response = await fetch("/api/admin/branding")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.theme) {
          setBrandingForm(data.theme)
          setBrandingLoaded(true)
          // ✅ LOG SEGURO - apenas confirmação
          console.log("Configurações de branding carregadas")
        } else {
          // Usar tema atual como fallback
          setBrandingForm(theme)
          setBrandingLoaded(true)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar branding")
      setBrandingForm(theme)
      setBrandingLoaded(true)
    }
  }

  const renderBrandingSettings = () => {
    const handleBrandingChange = (updates: Partial<ThemeConfig>) => {
      setBrandingForm((prev) => ({ ...prev, ...updates }))
      setBrandingChanged(true)
    }

    const handleSaveBranding = async () => {
      setSaving(true)

      try {
        const response = await fetch("/api/admin/branding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(brandingForm),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          await updateTheme(brandingForm)
          setBrandingChanged(false)
          toast({
            title: "Branding salvo!",
            description: "Configurações de branding salvas com sucesso!",
          })
        } else {
          throw new Error(data.error || "Failed to save branding")
        }
      } catch (error: any) {
        console.error("Erro ao salvar branding")
        toast({
          title: "Erro ao salvar branding",
          description: "Não foi possível salvar as configurações de branding.",
          variant: "destructive",
        })
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
      if (!Array.isArray(integrations)) {
        return {}
      }
      const integration = integrations.find((int: any) => int.type === type)
      return integration?.config || {}
    }

    const openIntegrationModal = (type: string, name: string) => {
      setSelectedIntegration({ type, name })
      const config = getIntegrationConfig(type)

      // Limpar formulário primeiro
      setIntegrationForm({
        evolutionApiUrl: "",
        evolutionApiKey: "",
        n8nFlowUrl: "",
        n8nApiKey: "",
      })

      // Depois preencher com dados existentes (SEM LOGS)
      if (type === "evolution_api") {
        setIntegrationForm((prev) => ({
          ...prev,
          evolutionApiUrl: config.apiUrl || "",
          evolutionApiKey: config.apiKey || "",
        }))
      } else if (type === "n8n") {
        setIntegrationForm((prev) => ({
          ...prev,
          n8nFlowUrl: config.flowUrl || "",
          n8nApiKey: config.apiKey || "",
        }))
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
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    )
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
            {renderSystemSettings()}
          </TabsContent>

          <TabsContent value="integrations" className="mt-4">
            {renderIntegrationsSettings()}
          </TabsContent>

          <TabsContent value="branding" className="mt-4">
            {renderBrandingSettings()}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
