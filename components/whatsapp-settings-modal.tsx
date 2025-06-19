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
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Settings, Save, Loader2, RefreshCw, CheckCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react"

interface WhatsAppSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: any
  onSettingsSaved?: () => void
}

interface SettingsConfig {
  groupsIgnore: boolean
  readMessages: boolean
  alwaysOnline: boolean
  readStatus: boolean
  rejectCall: boolean
  msgCall: string
  syncFullHistory: boolean
}

const defaultSettings: SettingsConfig = {
  groupsIgnore: false,
  readMessages: false,
  alwaysOnline: false,
  readStatus: false,
  rejectCall: false,
  msgCall: "",
  syncFullHistory: false,
}

export default function WhatsAppSettingsModal({
  open,
  onOpenChange,
  connection,
  onSettingsSaved,
}: WhatsAppSettingsModalProps) {
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dataSource, setDataSource] = useState<"evolution_api" | "default" | null>(null)
  const [warning, setWarning] = useState("")

  useEffect(() => {
    if (open && connection?.instance_name) {
      loadCurrentSettings()
    }
  }, [open, connection?.instance_name])

  useEffect(() => {
    if (!open) {
      setError("")
      setSuccess("")
      setWarning("")
      setSettings(defaultSettings)
      setDataSource(null)
    }
  }, [open])

  const loadCurrentSettings = async () => {
    if (!connection?.instance_name) return

    setLoadingSettings(true)
    setError("")
    setSuccess("")
    setWarning("")

    try {
      const response = await fetch(`/api/whatsapp/settings/${connection.instance_name}`)
      const result = await response.json()

      if (response.ok && result.success) {
        const apiSettings = result.settings
        const newSettings: SettingsConfig = {
          groupsIgnore: apiSettings.groupsIgnore ?? defaultSettings.groupsIgnore,
          readMessages: apiSettings.readMessages ?? defaultSettings.readMessages,
          alwaysOnline: apiSettings.alwaysOnline ?? defaultSettings.alwaysOnline,
          readStatus: apiSettings.readStatus ?? defaultSettings.readStatus,
          rejectCall: apiSettings.rejectCall ?? defaultSettings.rejectCall,
          msgCall: apiSettings.msgCall || defaultSettings.msgCall,
          syncFullHistory: apiSettings.syncFullHistory ?? defaultSettings.syncFullHistory,
        }
        setSettings(newSettings)
        setDataSource(result.source)

        // Mostrar aviso se necessário
        if (result.warning) {
          setWarning(result.warning)
        }
      } else {
        setSettings(defaultSettings)
        setError(result.error || "Erro ao carregar configurações")
        setDataSource("default")
      }
    } catch (error) {
      setSettings(defaultSettings)
      setError("Erro de conexão. Verifique sua internet.")
      setDataSource("default")
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
    setWarning("")

    try {
      const settingsPayload = {
        groupsIgnore: settings.groupsIgnore,
        readMessages: settings.readMessages,
        alwaysOnline: settings.alwaysOnline,
        readStatus: settings.readStatus,
        rejectCall: settings.rejectCall,
        msgCall: settings.rejectCall ? settings.msgCall : "",
        syncFullHistory: settings.syncFullHistory,
      }

      const response = await fetch(`/api/whatsapp/settings/${connection.instance_name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsPayload),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess("Configurações salvas com sucesso!")
        onSettingsSaved?.()

        // Recarregar configurações após salvar
        setTimeout(() => {
          loadCurrentSettings()
        }, 1000)

        setTimeout(() => {
          setSuccess("")
          onOpenChange(false)
        }, 2500)
      } else {
        setError(result.error || "Erro ao salvar configurações")
        if (result.details) {
          console.error("Detalhes do erro:", result.details)
        }
      }
    } catch (error) {
      setError("Erro de conexão ao salvar configurações")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: keyof SettingsConfig, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleRefresh = () => {
    loadCurrentSettings()
  }

  const getStatusIcon = () => {
    if (dataSource === "evolution_api") {
      return <Wifi className="w-4 h-4 text-green-600" />
    }
    return <WifiOff className="w-4 h-4 text-yellow-600" />
  }

  const getStatusText = () => {
    if (dataSource === "evolution_api") {
      return "Evolution API Conectada"
    }
    return "Usando Configurações Padrão"
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {warning && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">{warning}</AlertDescription>
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
                {getStatusIcon()}
                <p className="text-sm text-muted-foreground">{getStatusText()}</p>
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

            <div>
              <h4 className="font-medium mb-4 text-foreground">Configurações de Mensagens</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">Ignorar Grupos</Label>
                    <p className="text-sm text-muted-foreground">Não receber mensagens de grupos</p>
                  </div>
                  <Switch
                    checked={settings.groupsIgnore}
                    onCheckedChange={(checked) => updateSetting("groupsIgnore", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">Marcar como Lidas</Label>
                    <p className="text-sm text-muted-foreground">Marcar mensagens como lidas automaticamente</p>
                  </div>
                  <Switch
                    checked={settings.readMessages}
                    onCheckedChange={(checked) => updateSetting("readMessages", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">Sincronizar Histórico</Label>
                    <p className="text-sm text-muted-foreground">Sincronizar histórico completo de mensagens</p>
                  </div>
                  <Switch
                    checked={settings.syncFullHistory}
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
                    checked={settings.alwaysOnline}
                    onCheckedChange={(checked) => updateSetting("alwaysOnline", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">Ver Status</Label>
                    <p className="text-sm text-muted-foreground">Permitir visualizar status dos contatos</p>
                  </div>
                  <Switch
                    checked={settings.readStatus}
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
                    checked={settings.rejectCall}
                    onCheckedChange={(checked) => updateSetting("rejectCall", checked)}
                  />
                </div>

                {settings.rejectCall && (
                  <div className="space-y-2">
                    <Label htmlFor="msgCall" className="text-foreground">
                      Mensagem ao Rejeitar Chamadas
                    </Label>
                    <Input
                      id="msgCall"
                      value={settings.msgCall}
                      onChange={(e) => updateSetting("msgCall", e.target.value)}
                      placeholder="Ex: Não posso atender no momento, envie uma mensagem."
                      className="text-foreground"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={loading || loadingSettings}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
