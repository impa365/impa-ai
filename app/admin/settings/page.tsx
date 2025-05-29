"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Palette, Plug, Upload, ImageIcon, User, Eye, EyeOff, Plus, SettingsIcon } from "lucide-react"
import { useTheme, themePresets, type ThemeConfig } from "@/lib/theme"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  })

  // Estados para upload de arquivos
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    fetchIntegrations()
    fetchSystemSettings()
    if (currentUser) {
      setAdminProfileForm({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }, [])

  const fetchSystemSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_whatsapp_connections_limit")
      .single()

    if (data) {
      setSystemSettings({ defaultWhatsAppLimit: data.setting_value })
    }
  }

  const saveSystemSettings = async () => {
    setSaving(true)
    try {
      await supabase.from("system_settings").upsert({
        setting_key: "default_whatsapp_connections_limit",
        setting_value: systemSettings.defaultWhatsAppLimit,
      })
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

  const validateImageFile = (file: File, type: "logo" | "favicon") => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg"]
    if (type === "favicon") {
      validTypes.push("image/x-icon", "image/vnd.microsoft.icon")
    }

    if (!validTypes.includes(file.type)) {
      throw new Error(`Formato inválido. Use ${type === "favicon" ? "ICO, PNG" : "PNG, JPG"}`)
    }

    const maxSize = type === "favicon" ? 1 * 1024 * 1024 : 2 * 1024 * 1024 // 1MB para favicon, 2MB para logo
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

      // Aqui você implementaria o upload real para o Supabase Storage
      // Por enquanto, vamos simular o upload
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

      // Aqui você implementaria o upload real para o Supabase Storage
      // Por enquanto, vamos simular o upload
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

  const fetchIntegrations = async () => {
    const { data, error } = await supabase.from("integrations").select("*").order("created_at", { ascending: false })
    if (data) setIntegrations(data)
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

  const renderSystemSettings = () => (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Configurações do Sistema</h3>
        <p className="text-gray-600">Configure parâmetros globais da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Limites e Restrições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defaultWhatsAppLimit">Limite Padrão de Conexões WhatsApp</Label>
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
              className="w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Número máximo de conexões WhatsApp que novos usuários podem criar
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSystemSettings} disabled={saving} className="gap-2">
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>
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
              <Label htmlFor="faviconUpload">Upload de Favicon</Label>
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

  return (
    <div className="p-6">
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
                ) : settingsSubTab === "system" ? (
                  <>
                    <SettingsIcon className="w-4 h-4" />
                    Sistema
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
              <DropdownMenuItem onClick={() => setSettingsSubTab("profile")}>
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsSubTab("system")}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Sistema
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsSubTab("branding")}>
                <Palette className="w-4 h-4 mr-2" />
                Branding
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsSubTab("integrations")}>
                <Plug className="w-4 h-4 mr-2" />
                Integrações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {settingsSubTab === "profile" && renderAdminProfileSettings()}
      {settingsSubTab === "system" && renderSystemSettings()}
      {settingsSubTab === "branding" && renderBrandingSettings()}
      {settingsSubTab === "integrations" && renderIntegrationsSettings()}
    </div>
  )
}
