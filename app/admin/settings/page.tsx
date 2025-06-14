"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Eye, EyeOff, Plus, Copy, Trash2, Badge, ShieldCheck, AlertTriangle } from "lucide-react"
import { useTheme, type ThemeConfig } from "@/components/theme-provider"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser, changePassword } from "@/lib/auth"
import { db } from "@/lib/supabase"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getSystemSettings, updateSystemSettings } from "@/lib/system-settings"
import { DynamicTitle } from "@/components/dynamic-title"
import { getSupabase } from "@/lib/supabase"

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
  const [settingsSubTab, setSettingsSubTab] = useState("api-keys") // ⭐ Começar direto na aba API Keys
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
  const [apiKeysError, setApiKeysError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

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

      const client = await getSupabase()
      const { data, error } = await client.from("users").update(updateData).eq("id", user.id).select().single()

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

  // Melhorar a função loadApiKeys para capturar mais detalhes do erro
  const loadApiKeys = async (userId: string) => {
    const requestId = Math.random().toString(36).substring(7)
    console.log(`🎯 [${requestId}] === INICIANDO LOAD API KEYS (CLIENT) ===`)
    console.log(`🎯 [${requestId}] User ID: "${userId}"`)
    console.log(`🎯 [${requestId}] Timestamp: ${new Date().toISOString()}`)

    if (!userId) {
      console.error(`🎯 [${requestId}] ❌ ERRO: userId está vazio ou undefined`)
      setApiKeysError("User ID não fornecido")
      return
    }

    setLoadingApiKeys(true)
    setApiKeysError(null)
    setNeedsSetup(false)

    try {
      const url = `/api/user/api-keys?user_id=${encodeURIComponent(userId)}`
      console.log(`🎯 [${requestId}] URL da requisição: ${url}`)

      console.log(`🎯 [${requestId}] Fazendo fetch...`)
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      })

      console.log(`🎯 [${requestId}] === RESPOSTA RECEBIDA ===`)
      console.log(`🎯 [${requestId}] Status: ${response.status} ${response.statusText}`)
      console.log(`🎯 [${requestId}] Headers:`, Object.fromEntries(response.headers.entries()))
      console.log(`🎯 [${requestId}] OK: ${response.ok}`)

      // ⭐ CAPTURAR O TEXTO DA RESPOSTA PRIMEIRO
      let responseText = ""
      try {
        responseText = await response.text()
        console.log(`🎯 [${requestId}] Texto completo da resposta:`, responseText)
      } catch (textError) {
        console.error(`🎯 [${requestId}] ❌ Erro ao ler texto da resposta:`, textError)
        responseText = `Erro ao ler resposta: ${textError}`
      }

      if (!response.ok) {
        console.error(`🎯 [${requestId}] ❌ RESPOSTA NÃO OK - STATUS ${response.status}`)

        let errorData: any = {}

        // Tentar fazer parse como JSON
        try {
          if (responseText.trim()) {
            errorData = JSON.parse(responseText)
            console.log(`🎯 [${requestId}] Dados de erro parseados:`, errorData)
          } else {
            console.log(`🎯 [${requestId}] Resposta vazia`)
            errorData = { error: "Resposta vazia do servidor" }
          }
        } catch (parseError) {
          console.log(`🎯 [${requestId}] Não foi possível fazer parse do JSON:`, parseError)
          errorData = {
            error: responseText || `HTTP ${response.status}: ${response.statusText}`,
            rawResponse: responseText,
          }
        }

        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`
        console.error(`🎯 [${requestId}] Mensagem de erro final:`, errorMessage)

        // ⭐ MOSTRAR ERRO DETALHADO NA UI
        setApiKeysError(`Status ${response.status}: ${errorMessage}`)

        throw new Error(`Status ${response.status}: ${errorMessage}`)
      }

      // Verificar content-type
      const contentType = response.headers.get("content-type")
      console.log(`🎯 [${requestId}] Content-Type: ${contentType}`)

      if (!contentType?.includes("application/json")) {
        console.error(`🎯 [${requestId}] ❌ Resposta não é JSON:`, responseText)
        setApiKeysError(`Resposta inválida. Content-Type: ${contentType}`)
        throw new Error(`Resposta inválida do servidor. Content-Type: ${contentType}. Conteúdo: ${responseText}`)
      }

      console.log(`🎯 [${requestId}] Fazendo parse do JSON...`)
      let data
      try {
        data = JSON.parse(responseText)
        console.log(`🎯 [${requestId}] === DADOS RECEBIDOS ===`)
        console.log(`🎯 [${requestId}] Dados completos:`, data)
      } catch (jsonError) {
        console.error(`🎯 [${requestId}] ❌ Erro no parse JSON:`, jsonError)
        setApiKeysError(`Erro ao processar resposta JSON: ${jsonError}`)
        throw new Error(`Erro ao processar resposta JSON: ${jsonError}`)
      }

      if (data.needsSetup) {
        console.warn(`🎯 [${requestId}] ⚠️ Setup necessário:`, data.error)
        setNeedsSetup(true)
        setApiKeysError(data.error)
        setApiKeys([])
        return
      }

      if (data.apiKeys) {
        console.log(`🎯 [${requestId}] ✅ ${data.apiKeys.length} API keys carregadas`)
        if (data.apiKeys.length > 0) {
          console.log(`🎯 [${requestId}] Primeira API key:`, data.apiKeys[0])
        }
        setApiKeys(data.apiKeys)
      } else {
        console.warn(`🎯 [${requestId}] ⚠️ Nenhuma API key retornada`)
        setApiKeys([])
      }

      if (data.debug) {
        console.log(`🎯 [${requestId}] Debug info:`, data.debug)
      }
    } catch (error) {
      console.error(`🎯 [${requestId}] === ERRO CRÍTICO ===`)
      console.error(`🎯 [${requestId}] Tipo do erro:`, typeof error)
      console.error(`🎯 [${requestId}] Erro completo:`, error)

      let errorMessage = "Erro desconhecido"
      if (error instanceof Error) {
        errorMessage = error.message
        console.error(`🎯 [${requestId}] Error.message:`, errorMessage)
        console.error(`🎯 [${requestId}] Error.stack:`, error.stack)
      } else if (typeof error === "string") {
        errorMessage = error
        console.error(`🎯 [${requestId}] String error:`, errorMessage)
      }

      setApiKeysError(errorMessage)
      toast({
        title: "❌ Erro ao carregar API Keys",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoadingApiKeys(false)
      console.log(`🎯 [${requestId}] === FINALIZANDO LOAD API KEYS ===`)
    }
  }

  // ⭐ ADICIONAR FUNÇÃO DE TESTE DIRETO
  const testApiConnection = async () => {
    if (!user?.id) return

    console.log("🧪 === TESTE DIRETO DA API ===")
    console.log("🧪 User ID:", user.id)

    try {
      const response = await fetch(`/api/user/api-keys?user_id=${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("🧪 Response Status:", response.status)
      console.log("🧪 Response Headers:", Object.fromEntries(response.headers.entries()))

      const text = await response.text()
      console.log("🧪 Response Text:", text)

      if (response.ok) {
        const data = JSON.parse(text)
        console.log("🧪 Response Data:", data)
        toast({
          title: "✅ Teste bem-sucedido!",
          description: `API retornou ${data.apiKeys?.length || 0} API keys`,
        })
      } else {
        console.error("🧪 Erro na resposta:", text)
        toast({
          title: "❌ Teste falhou",
          description: `Status ${response.status}: ${text}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("🧪 Erro no teste:", error)
      toast({
        title: "❌ Teste falhou",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
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
      const { data: limitData, error: limitError } = await (await db.systemSettings())
        .select("setting_value")
        .eq("setting_key", "default_whatsapp_connections_limit")
        .single()

      const { data: agentsLimitData, error: agentsError } = await (await db.systemSettings())
        .select("setting_value")
        .eq("setting_key", "default_agents_limit")
        .single()

      const { data: registrationData, error: regError } = await (await db.systemSettings())
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
        const { error } = await (await db.systemSettings()).upsert(setting, { onConflict: "setting_key" })

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

      const { error } = await (await db.users()).update(updateData).eq("id", user.id)

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
        const { data, error } = await (await db.integrations())
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
        const { data, error } = await (await db.integrations())
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
      const { data, error } = await (await db.integrations()).select("*").order("created_at", { ascending: false })

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

  // Atualizar o renderApiKeysSettings para incluir o botão de teste
  const renderApiKeysSettings = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">🔑 API Keys</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas chaves de API para integração com sistemas externos
        </p>
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ⚠️ <strong>Schema:</strong> impaai | <strong>Logs detalhados:</strong> Abra o console (F12) para ver logs
            completos
          </p>
        </div>
      </div>

      {/* ⭐ SEÇÃO DE DEBUG */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
            🧪 Debug & Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>User ID:</strong> {user?.id || "N/A"}
            </div>
            <div>
              <strong>Status:</strong> {loadingApiKeys ? "Carregando..." : apiKeysError ? "Erro" : "OK"}
            </div>
            <div>
              <strong>API Keys:</strong> {apiKeys.length}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={testApiConnection} variant="outline" size="sm" className="gap-2" disabled={!user?.id}>
              🧪 Testar API Diretamente
            </Button>
            <Button
              onClick={() => user?.id && loadApiKeys(user.id)}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loadingApiKeys || !user?.id}
            >
              🔄 Recarregar
            </Button>
          </div>
          {apiKeysError && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-200">
              <strong>Erro:</strong> {apiKeysError}
            </div>
          )}
        </CardContent>
      </Card>

      {needsSetup && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>{apiKeysError}</p>
              <p className="text-sm">
                Execute o script SQL para criar a estrutura necessária das API Keys no schema <strong>impaai</strong>.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {apiKeysError && !needsSetup && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Erro:</strong> {apiKeysError}
              </p>
              <p className="text-sm">Verifique o console (F12) para logs detalhados do erro.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Suas API Keys</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{apiKeys.length} de 10 API keys criadas</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNewKeyForm(!showNewKeyForm)}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={loadingApiKeys || needsSetup}
          >
            <Plus className="h-4 w-4" />
            Nova API Key
          </Button>
        </div>
      </div>

      {showNewKeyForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Criar Nova API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newKeyName" className="text-gray-900 dark:text-gray-100">
                Nome da API Key
              </Label>
              <Input
                id="newKeyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Ex: Integração WhatsApp"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => createApiKey(false)}
                disabled={creatingApiKey}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                {creatingApiKey ? "Criando..." : "Criar API Key Padrão"}
              </Button>
              <Button onClick={() => createApiKey(true)} disabled={creatingApiKey} variant="outline" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                {creatingApiKey ? "Criando..." : "Criar API Key Admin"}
              </Button>
              <Button
                onClick={() => {
                  setShowNewKeyForm(false)
                  setNewKeyName("")
                }}
                variant="ghost"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingApiKeys ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">🔄 Carregando API keys...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Verifique o console para logs detalhados</p>
        </div>
      ) : apiKeys.length === 0 && !needsSetup ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">📭 Nenhuma API key encontrada</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Crie sua primeira API key para começar a integrar
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{apiKey.name}</h4>
                      {apiKey.is_admin_key && (
                        <Badge variant="destructive" className="text-xs">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {!apiKey.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inativa
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{apiKey.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>Criada: {new Date(apiKey.created_at).toLocaleDateString("pt-BR")}</span>
                      {apiKey.last_used_at && (
                        <span>Último uso: {new Date(apiKey.last_used_at).toLocaleDateString("pt-BR")}</span>
                      )}
                      <span>Escopo: {apiKey.access_scope}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                        {apiKey.api_key.substring(0, 20)}...
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(apiKey.api_key)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderAdminProfileSettings = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">👤 Perfil do Administrador</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Atualize suas informações de perfil e senha para manter a segurança da sua conta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Informações do Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminProfileMessage && (
            <Alert variant={adminProfileMessage.includes("sucesso") ? "default" : "destructive"}>
              <AlertDescription>{adminProfileMessage}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="full_name" className="text-gray-900 dark:text-gray-100">
              Nome Completo
            </Label>
            <Input
              id="full_name"
              value={adminProfileForm.full_name}
              onChange={(e) => setAdminProfileForm({ ...adminProfileForm, full_name: e.target.value })}
              placeholder="Seu nome completo"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={adminProfileForm.email}
              onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
              placeholder="Seu email"
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
            <Label htmlFor="currentPassword" className="text-gray-900 dark:text-gray-100">
              Senha Atual
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showAdminPasswords.current ? "text" : "password"}
                value={adminProfileForm.currentPassword}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, currentPassword: e.target.value })}
                placeholder="Sua senha atual"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAdminPasswords({ ...showAdminPasswords, current: !showAdminPasswords.current })}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                {showAdminPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Mostrar senha</span>
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-gray-900 dark:text-gray-100">
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showAdminPasswords.new ? "text" : "password"}
                value={adminProfileForm.newPassword}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, newPassword: e.target.value })}
                placeholder="Sua nova senha"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAdminPasswords({ ...showAdminPasswords, new: !showAdminPasswords.new })}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                {showAdminPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Mostrar senha</span>
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-gray-100">
              Confirmar Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showAdminPasswords.confirm ? "text" : "password"}
                value={adminProfileForm.confirmPassword}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, confirmPassword: e.target.value })}
                placeholder="Confirme sua nova senha"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAdminPasswords({ ...showAdminPasswords, confirm: !showAdminPasswords.confirm })}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                {showAdminPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Mostrar senha</span>
              </Button>
            </div>
          </div>
        </CardContent>
        <div className="p-4">
          <Button onClick={handleUpdateAdminProfile} disabled={savingAdminProfile}>
            {savingAdminProfile ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </Card>
    </div>
  )

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">⚙️ Configurações do Sistema</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie as configurações globais do sistema, como limites de usuários e permissões.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Limites Padrão</CardTitle>
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
                setSystemSettings({ ...systemSettings, defaultWhatsAppLimit: Number.parseInt(e.target.value) })
              }
              placeholder="Limite padrão de conexões WhatsApp"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
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
                setSystemSettings({ ...systemSettings, defaultAgentsLimit: Number.parseInt(e.target.value) })
              }
              placeholder="Limite padrão de agentes IA"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="allowPublicRegistration" className="text-gray-900 dark:text-gray-100">
              Permitir Cadastro Público
            </Label>
            <Switch
              id="allowPublicRegistration"
              checked={systemSettings.allowPublicRegistration}
              onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, allowPublicRegistration: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Button onClick={saveSystemSettings2} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">🎨 Branding</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Personalize a aparência da sua plataforma para combinar com a sua marca.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Informações da Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="systemName" className="text-gray-900 dark:text-gray-100">
              Nome do Sistema
            </Label>
            <Input
              id="systemName"
              value={brandingForm.systemName}
              onChange={(e) => setBrandingForm({ ...brandingForm, systemName: e.target.value })}
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
              value={brandingForm.description}
              onChange={(e) => setBrandingForm({ ...brandingForm, description: e.target.value })}
              placeholder="Descrição da sua plataforma"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Logotipos e Ícones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logo" className="text-gray-900 dark:text-gray-100">
              Logo
            </Label>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                {uploadingLogo ? "Enviando..." : "Enviar Logo"}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
              <Input type="file" id="logo" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
              {brandingForm.logoUrl && (
                <Image
                  src={brandingForm.logoUrl || "/placeholder.svg"}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="rounded-md"
                />
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="favicon" className="text-gray-900 dark:text-gray-100">
              Favicon
            </Label>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}>
                {uploadingFavicon ? "Enviando..." : "Enviar Favicon"}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
              <Input type="file" id="favicon" className="hidden" ref={faviconInputRef} onChange={handleFaviconUpload} />
              {brandingForm.faviconUrl && (
                <Image
                  src={brandingForm.faviconUrl || "/placeholder.svg"}
                  alt="Favicon"
                  width={32}
                  height={32}
                  className="rounded-sm"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Cores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primaryColor" className="text-gray-900 dark:text-gray-100">
              Cor Primária
            </Label>
            <Input
              type="color"
              id="primaryColor"
              value={brandingForm.primaryColor}
              onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
              className="h-10 w-full"
            />
          </div>
          <div>
            <Label htmlFor="secondaryColor" className="text-gray-900 dark:text-gray-100">
              Cor Secundária
            </Label>
            <Input
              type="color"
              id="secondaryColor"
              value={brandingForm.secondaryColor}
              onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
              className="h-10 w-full"
            />
          </div>
          <div>
            <Label htmlFor="accentColor" className="text-gray-900 dark:text-gray-100">
              Cor de Destaque
            </Label>
            <Input
              type="color"
              id="accentColor"
              value={brandingForm.accentColor}
              onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
              className="h-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Button
          onClick={() => {
            updateTheme(brandingForm)
            setBrandingChanged(true)
          }}
          disabled={!brandingChanged}
        >
          Salvar Branding
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <DynamicTitle title="Configurações do Sistema" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configurações do Sistema</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie configurações globais, branding e integrações da plataforma
        </p>
      </div>

      {saveMessage && (
        <Alert variant={saveMessage.includes("sucesso") ? "default" : "destructive"} className="mb-6">
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={settingsSubTab} onValueChange={setSettingsSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">{renderAdminProfileSettings()}</TabsContent>
        <TabsContent value="system">{renderSystemSettings()}</TabsContent>
        <TabsContent value="branding">{renderBrandingSettings()}</TabsContent>
        <TabsContent value="api-keys">{renderApiKeysSettings()}</TabsContent>
        <TabsContent value="integrations">
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Configurações de integrações em desenvolvimento</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
