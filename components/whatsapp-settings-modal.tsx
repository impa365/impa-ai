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
import { Settings, Save, Loader2, RefreshCw } from "lucide-react"
import { getInstanceSettings, saveInstanceSettings } from "@/lib/whatsapp-settings-api"

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

export default function WhatsAppSettingsModal({
  open,
  onOpenChange,
  connection,
  onSettingsSaved,
}: WhatsAppSettingsModalProps) {
  const [settings, setSettings] = useState<SettingsConfig>({
    groupsIgnore: false,
    readMessages: false,
    alwaysOnline: false,
    readStatus: false,
    rejectCall: false,
    msgCall: "",
    syncFullHistory: false,
  })
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (open && connection) {
      loadCurrentSettings()
    }
  }, [open, connection])

  const loadCurrentSettings = async () => {
    if (!connection?.instance_name) return

    setLoadingSettings(true)
    setError("")

    try {
      const result = await getInstanceSettings(connection.instance_name)

      if (result.success && result.settings) {
        // Mapear as configurações da API para o estado local
        setSettings({
          groupsIgnore: result.settings.groupsIgnore || false,
          readMessages: result.settings.readMessages || false,
          alwaysOnline: result.settings.alwaysOnline || false,
          readStatus: result.settings.readStatus || false,
          rejectCall: result.settings.rejectCall || false,
          msgCall: result.settings.msgCall || "Não posso atender no momento, envie uma mensagem.",
          syncFullHistory: result.settings.syncFullHistory || false,
        })
      } else {
        // Se não conseguir buscar, usar valores padrão
        setSettings({
          groupsIgnore: false,
          readMessages: true,
          alwaysOnline: false,
          readStatus: true,
          rejectCall: false,
          msgCall: "Não posso atender no momento, envie uma mensagem.",
          syncFullHistory: false,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      setError("Erro ao carregar configurações atuais")
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!connection?.instance_name) return

    setLoading(true)
    setError("")
    setSuccess("")

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

      const result = await saveInstanceSettings(connection.instance_name, settingsPayload)

      if (result.success) {
        setSuccess("Configurações salvas com sucesso!")
        onSettingsSaved?.()

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

  const updateSetting = (key: keyof SettingsConfig, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Privacidade - {connection?.connection_name}
          </DialogTitle>
          <DialogDescription>Configure o comportamento da sua conexão WhatsApp</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {loadingSettings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando configurações atuais...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Configurações sincronizadas com a API</p>
              <Button variant="outline" size="sm" onClick={loadCurrentSettings} disabled={loadingSettings}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar
              </Button>
            </div>

            {/* Configurações de Mensagens */}
            <div>
              <h4 className="font-medium mb-4">Configurações de Mensagens</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ignorar Grupos</Label>
                    <p className="text-sm text-gray-600">Não receber mensagens de grupos</p>
                  </div>
                  <Switch
                    checked={settings.groupsIgnore}
                    onCheckedChange={(checked) => updateSetting("groupsIgnore", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marcar como Lidas</Label>
                    <p className="text-sm text-gray-600">Marcar mensagens como lidas automaticamente</p>
                  </div>
                  <Switch
                    checked={settings.readMessages}
                    onCheckedChange={(checked) => updateSetting("readMessages", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sincronizar Histórico</Label>
                    <p className="text-sm text-gray-600">Sincronizar histórico completo de mensagens</p>
                  </div>
                  <Switch
                    checked={settings.syncFullHistory}
                    onCheckedChange={(checked) => updateSetting("syncFullHistory", checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Configurações de Status */}
            <div>
              <h4 className="font-medium mb-4">Configurações de Status</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sempre Online</Label>
                    <p className="text-sm text-gray-600">Manter status online constantemente</p>
                  </div>
                  <Switch
                    checked={settings.alwaysOnline}
                    onCheckedChange={(checked) => updateSetting("alwaysOnline", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ver Status</Label>
                    <p className="text-sm text-gray-600">Permitir visualizar status dos contatos</p>
                  </div>
                  <Switch
                    checked={settings.readStatus}
                    onCheckedChange={(checked) => updateSetting("readStatus", checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Configurações de Chamadas */}
            <div>
              <h4 className="font-medium mb-4">Configurações de Chamadas</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rejeitar Chamadas</Label>
                    <p className="text-sm text-gray-600">Rejeitar chamadas automaticamente</p>
                  </div>
                  <Switch
                    checked={settings.rejectCall}
                    onCheckedChange={(checked) => updateSetting("rejectCall", checked)}
                  />
                </div>

                {settings.rejectCall && (
                  <div className="space-y-2">
                    <Label htmlFor="msgCall">Mensagem ao Rejeitar Chamadas</Label>
                    <Input
                      id="msgCall"
                      value={settings.msgCall}
                      onChange={(e) => updateSetting("msgCall", e.target.value)}
                      placeholder="Ex: Não posso atender no momento, envie uma mensagem."
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
          <Button onClick={handleSaveSettings} disabled={loading || loadingSettings}>
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
