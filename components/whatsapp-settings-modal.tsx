"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings, Save, Loader2, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"

interface WhatsAppSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
  onSettingsSaved?: () => void
}

// Configurações Evolution API
interface EvolutionSettingsConfig {
  groupsIgnore: boolean
  readMessages: boolean
  alwaysOnline: boolean
  readStatus: boolean
  rejectCall: boolean
  msgCall: string
  syncFullHistory: boolean
}

// Configurações Uazapi
interface UazapiPrivacyConfig {
  groupadd: string
  last: string
  status: string
  profile: string
  readreceipts: string
  online: string
  calladd: string
}

type SettingsConfig = EvolutionSettingsConfig | UazapiPrivacyConfig

const defaultEvolutionSettings: EvolutionSettingsConfig = {
  groupsIgnore: false,
  readMessages: true,
  alwaysOnline: false,
  readStatus: true,
  rejectCall: false,
  msgCall: "Não posso atender no momento, envie uma mensagem.",
  syncFullHistory: false,
}

const defaultUazapiSettings: UazapiPrivacyConfig = {
  groupadd: "contacts",
  last: "contacts",
  status: "contacts",
  profile: "contacts",
  readreceipts: "all",
  online: "all",
  calladd: "all",
}

export default function WhatsAppSettingsModal({
  open,
  onOpenChange,
  connection,
  onSettingsSaved,
}: WhatsAppSettingsModalProps) {
  // Usar useMemo para recalcular apiType quando connection mudar
  const apiType = useMemo(() => {
    return connection?.api_type || "evolution"
  }, [connection])
  
  const [settings, setSettings] = useState<SettingsConfig>(defaultEvolutionSettings)
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dataSource, setDataSource] = useState<"evolution_api" | "uazapi" | "local_database" | null>(null)

  // Atualizar settings default quando apiType mudar
  useEffect(() => {
    if (apiType === "uazapi") {
      setSettings(defaultUazapiSettings)
    } else {
      setSettings(defaultEvolutionSettings)
    }
  }, [apiType])

  useEffect(() => {
    if (open && connection?.instance_name) {
      loadCurrentSettings()
    }
  }, [open, connection?.instance_name])

  useEffect(() => {
    if (!open) {
      setError("")
      setSuccess("")
      setDataSource(null)
    }
  }, [open])

  const loadCurrentSettings = async () => {
    if (!connection?.instance_name) return

    // UAZAPI: Verificar se está conectada antes de tentar carregar configurações
    if (apiType === "uazapi" && connection?.status !== "connected") {
      setError("⚠️ A instância precisa estar CONECTADA para editar configurações de privacidade. Conecte a instância primeiro clicando no botão 'QR Code'.")
      setSettings(defaultUazapiSettings)
      setLoadingSettings(false)
      return
    }

    setLoadingSettings(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/whatsapp/settings/${connection.instance_name}`)
      const result = await response.json()

      if (response.ok && result.success) {
        const apiSettings = result.settings
        
        if (apiType === "uazapi") {
          // Configurações Uazapi (privacidade)
          const newSettings: UazapiPrivacyConfig = {
            groupadd: apiSettings.groupadd || defaultUazapiSettings.groupadd,
            last: apiSettings.last || defaultUazapiSettings.last,
            status: apiSettings.status || defaultUazapiSettings.status,
            profile: apiSettings.profile || defaultUazapiSettings.profile,
            readreceipts: apiSettings.readreceipts || defaultUazapiSettings.readreceipts,
            online: apiSettings.online || defaultUazapiSettings.online,
            calladd: apiSettings.calladd || defaultUazapiSettings.calladd,
          }
          setSettings(newSettings)
        } else {
          // Configurações Evolution API
          const newSettings: EvolutionSettingsConfig = {
            groupsIgnore: apiSettings.groupsIgnore ?? defaultEvolutionSettings.groupsIgnore,
            readMessages: apiSettings.readMessages ?? defaultEvolutionSettings.readMessages,
            alwaysOnline: apiSettings.alwaysOnline ?? defaultEvolutionSettings.alwaysOnline,
            readStatus: apiSettings.readStatus ?? defaultEvolutionSettings.readStatus,
            rejectCall: apiSettings.rejectCall ?? defaultEvolutionSettings.rejectCall,
            msgCall: apiSettings.msgCall || defaultEvolutionSettings.msgCall,
            syncFullHistory: apiSettings.syncFullHistory ?? defaultEvolutionSettings.syncFullHistory,
        }
        setSettings(newSettings)
        }
        
        setDataSource(result.source)

        // Mostrar aviso baseado na fonte dos dados
        if (result.source === "local_database") {
          setError(`Configurações carregadas do cache local. A ${apiType === "uazapi" ? "Uazapi" : "Evolution API"} pode estar indisponível.`)
        } else if (result.source === "default") {
          setError(`${apiType === "uazapi" ? "Uazapi" : "Evolution API"} indisponível. Usando configurações padrão.`)
        } else if (result.warning) {
          setError(result.warning)
        }
      } else {
        setSettings(apiType === "uazapi" ? defaultUazapiSettings : defaultEvolutionSettings)
        setError(result.error || "Erro ao carregar configurações. Usando valores padrão.")
      }
    } catch (error) {
      setSettings(apiType === "uazapi" ? defaultUazapiSettings : defaultEvolutionSettings)
      setError("Erro de conexão. Verifique se a API está funcionando.")
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!connection?.instance_name) {
      setError("Nome da instância não encontrado")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/whatsapp/settings/${connection.instance_name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`Configurações salvas com sucesso${apiType === "uazapi" ? " na Uazapi" : " na Evolution API"}!`)
        onSettingsSaved?.()

        // Recarregar configurações após salvar
        setTimeout(() => {
          loadCurrentSettings()
        }, 1000)

        setTimeout(() => {
          setSuccess("")
          onOpenChange(false)
        }, 2000)
      } else {
        setError(result.error || "Erro ao salvar configurações")
      }
    } catch (error) {
      setError("Erro ao salvar configurações")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleRefresh = () => {
    loadCurrentSettings()
  }

  // Helper para obter label amigável dos valores de privacidade Uazapi
  const getPrivacyLabel = (value: string): string => {
    const labels: Record<string, string> = {
      "all": "Todos",
      "contacts": "Meus contatos",
      "contact_blacklist": "Meus contatos exceto...",
      "none": "Ninguém",
      "match_last_seen": "Mesmo que visto por último",
      "known": "Números conhecidos",
    }
    return labels[value] || value
  }

  // ==================== RENDER UAZAPI SETTINGS ====================
  const renderUazapiSettings = () => {
    const uazapiSettings = settings as UazapiPrivacyConfig
    
    return (
      <>
        <div>
          <h4 className="font-medium mb-4 text-foreground">Configurações de Privacidade</h4>
          <div className="space-y-4">
            {/* Quem pode adicionar em grupos */}
            <div className="space-y-2">
              <Label className="text-foreground">Quem pode me adicionar em grupos</Label>
              <Select
                value={uazapiSettings.groupadd}
                onValueChange={(value) => updateSetting("groupadd", value)}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contacts">Meus contatos</SelectItem>
                  <SelectItem value="contact_blacklist">Meus contatos exceto...</SelectItem>
                  <SelectItem value="none">Ninguém</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visto por último */}
            <div className="space-y-2">
              <Label className="text-foreground">Quem pode ver meu visto por último</Label>
              <Select
                value={uazapiSettings.last}
                onValueChange={(value) => updateSetting("last", value)}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contacts">Meus contatos</SelectItem>
                  <SelectItem value="contact_blacklist">Meus contatos exceto...</SelectItem>
                  <SelectItem value="none">Ninguém</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status/Recado */}
            <div className="space-y-2">
              <Label className="text-foreground">Quem pode ver meu recado</Label>
              <Select
                value={uazapiSettings.status}
                onValueChange={(value) => updateSetting("status", value)}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contacts">Meus contatos</SelectItem>
                  <SelectItem value="contact_blacklist">Meus contatos exceto...</SelectItem>
                  <SelectItem value="none">Ninguém</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Foto de perfil */}
            <div className="space-y-2">
              <Label className="text-foreground">Quem pode ver minha foto</Label>
              <Select
                value={uazapiSettings.profile}
                onValueChange={(value) => updateSetting("profile", value)}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contacts">Meus contatos</SelectItem>
                  <SelectItem value="contact_blacklist">Meus contatos exceto...</SelectItem>
                  <SelectItem value="none">Ninguém</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-4 text-foreground">Outras Configurações</h4>
          <div className="space-y-4">
            {/* Confirmação de leitura */}
            <div className="space-y-2">
              <Label className="text-foreground">Confirmação de leitura</Label>
              <Select
                value={uazapiSettings.readreceipts}
                onValueChange={(value) => updateSetting("readreceipts", value)}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ativada</SelectItem>
                  <SelectItem value="none">Desativada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status online */}
            <div className="space-y-2">
              <Label className="text-foreground">Quem pode ver quando estou online</Label>
              <Select
                value={uazapiSettings.online}
                onValueChange={(value) => updateSetting("online", value)}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="match_last_seen">Mesmo que visto por último</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chamadas */}
            <div className="space-y-2">
              <Label className="text-foreground">Quem pode me ligar</Label>
              <Select
                value={uazapiSettings.calladd}
                onValueChange={(value) => updateSetting("calladd", value)}
              >
                <SelectTrigger className="text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="known">Apenas números conhecidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ==================== RENDER EVOLUTION SETTINGS ====================
  const renderEvolutionSettings = () => {
    const evolutionSettings = settings as EvolutionSettingsConfig
    
    return (
      <>
        <div>
          <h4 className="font-medium mb-4 text-foreground">Configurações de Mensagens</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Ignorar Grupos</Label>
                <p className="text-sm text-muted-foreground">Não receber mensagens de grupos</p>
              </div>
              <Switch
                checked={evolutionSettings.groupsIgnore}
                onCheckedChange={(checked) => updateSetting("groupsIgnore", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Marcar como Lidas</Label>
                <p className="text-sm text-muted-foreground">Marcar mensagens como lidas automaticamente</p>
              </div>
              <Switch
                checked={evolutionSettings.readMessages}
                onCheckedChange={(checked) => updateSetting("readMessages", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Sincronizar Histórico</Label>
                <p className="text-sm text-muted-foreground">Sincronizar histórico completo de mensagens</p>
              </div>
              <Switch
                checked={evolutionSettings.syncFullHistory}
                onCheckedChange={(checked) => updateSetting("syncFullHistory", checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-4 text-foreground">Configurações de Status</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Sempre Online</Label>
                <p className="text-sm text-muted-foreground">Manter status online constantemente</p>
              </div>
              <Switch
                checked={evolutionSettings.alwaysOnline}
                onCheckedChange={(checked) => updateSetting("alwaysOnline", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Ver Status</Label>
                <p className="text-sm text-muted-foreground">Permitir visualizar status dos contatos</p>
              </div>
              <Switch
                checked={evolutionSettings.readStatus}
                onCheckedChange={(checked) => updateSetting("readStatus", checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-4 text-foreground">Configurações de Chamadas</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Rejeitar Chamadas</Label>
                <p className="text-sm text-muted-foreground">Rejeitar chamadas automaticamente</p>
              </div>
              <Switch
                checked={evolutionSettings.rejectCall}
                onCheckedChange={(checked) => updateSetting("rejectCall", checked)}
              />
            </div>

            {evolutionSettings.rejectCall && (
              <div className="space-y-2">
                <Label htmlFor="msgCall" className="text-foreground">
                  Mensagem ao Rejeitar Chamadas
                </Label>
                <Input
                  id="msgCall"
                  value={evolutionSettings.msgCall}
                  onChange={(e) => updateSetting("msgCall", e.target.value)}
                  placeholder="Ex: Não posso atender no momento, envie uma mensagem."
                  className="text-foreground"
                />
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-popover-foreground">
            <Settings className="w-5 h-5" />
            Configurações de Privacidade - {connection?.connection_name}
          </DialogTitle>
          <DialogDescription className="text-popover-foreground/80">
            Configure o comportamento da sua conexão WhatsApp
            <br />
            <span className="text-xs text-muted-foreground">Instância: {connection?.instance_name}</span>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        {loadingSettings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Carregando configurações...</span>
          </div>
        ) : (
          <div className="space-y-6 bg-background text-foreground py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Fonte: {dataSource === "evolution_api" ? "Evolution API" : dataSource === "uazapi" ? "Uazapi" : "Cache Local"}
                </p>
                {(dataSource === "evolution_api" || dataSource === "uazapi") && <CheckCircle className="w-4 h-4 text-green-600" />}
                {dataSource === "local_database" && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loadingSettings}
                className="text-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingSettings ? "animate-spin" : ""}`} />
                Recarregar
              </Button>
            </div>

            {apiType === "uazapi" ? (
              // ==================== CONFIGURAÇÕES UAZAPI ====================
              <>{renderUazapiSettings()}</>
            ) : (
              // ==================== CONFIGURAÇÕES EVOLUTION API ====================
              <>{renderEvolutionSettings()}</>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={loading || loadingSettings || (apiType === "uazapi" && connection?.status !== "connected")}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando{apiType === "uazapi" ? " na Uazapi" : " na Evolution API"}...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {apiType === "uazapi" && connection?.status !== "connected" 
                  ? "Conecte a instância primeiro" 
                  : `Salvar${apiType === "uazapi" ? " na Uazapi" : " na Evolution API"}`
                }
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
