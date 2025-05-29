"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, QrCode, Settings, RefreshCcw, Info } from "lucide-react"
import { WhatsAppQRModal } from "@/components/whatsapp-qr-modal"
import { WhatsAppSettingsModal } from "@/components/whatsapp-settings-modal"
import { WhatsAppInfoModal } from "@/components/whatsapp-info-modal"
import { InstanceCreationModal } from "@/components/instance-creation-modal"
import { fetchUserWhatsAppInstances, disconnectWhatsAppInstance } from "@/lib/whatsapp-api"

interface WhatsAppInstance {
  id: string
  name: string
  status: "disconnected" | "connecting" | "connected"
  user_id: string
  api_key: string
  profile_pic_url?: string
}

export default function WhatsAppPage() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const instancesData = await fetchUserWhatsAppInstances()
      setInstances(instancesData)
    } catch (error) {
      console.error("Error fetching instances:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDisconnect(instance: WhatsAppInstance) {
    setActionLoading(instance.id)
    try {
      await disconnectWhatsAppInstance(instance.name, instance.api_key)
      // Update the instance status in the local state
      setInstances((prevInstances) =>
        prevInstances.map((i) => (i.id === instance.id ? { ...i, status: "disconnected" } : i)),
      )
    } catch (error) {
      console.error("Error disconnecting instance:", error)
    } finally {
      setActionLoading(null)
    }
  }

  function handleQRCode(instance: WhatsAppInstance) {
    setSelectedInstance(instance)
    setIsQRModalOpen(true)
  }

  function handleSettings(instance: WhatsAppInstance) {
    setSelectedInstance(instance)
    setIsSettingsModalOpen(true)
  }

  function handleInfo(instance: WhatsAppInstance) {
    setSelectedInstance(instance)
    setIsInfoModalOpen(true)
  }

  function handleCreateInstance() {
    setIsCreationModalOpen(true)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "connected":
        return <Badge variant="success">Conectado</Badge>
      case "connecting":
        return <Badge variant="warning">Conectando</Badge>
      case "disconnected":
        return <Badge variant="destructive">Desconectado</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Minhas Conexões WhatsApp</h1>
        <Button onClick={handleCreateInstance}>Nova Conexão</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conexões ({instances.length})</CardTitle>
          <CardDescription>Gerencie suas conexões WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Você não possui conexões WhatsApp. Clique em "Nova Conexão" para criar uma.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instances.map((instance) => (
                <Card key={instance.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg truncate" title={instance.name}>
                          {instance.name}
                        </CardTitle>
                        <CardDescription>ID: {instance.id.substring(0, 8)}...</CardDescription>
                      </div>
                      <div className="ml-2">{getStatusBadge(instance.status)}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center mr-3">
                        {instance.profile_pic_url ? (
                          <img
                            src={instance.profile_pic_url || "/placeholder.svg"}
                            alt="Perfil"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Smartphone className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">API Key</div>
                        <div className="text-xs text-muted-foreground">{instance.api_key.substring(0, 12)}...</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Disconnect button - show only when status is connected or connecting */}
                      {(instance.status === "connected" || instance.status === "connecting") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisconnect(instance)}
                          disabled={actionLoading === instance.id}
                          className="w-full"
                        >
                          {actionLoading === instance.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Desconectar
                            </>
                          )}
                        </Button>
                      )}

                      {/* QR Code button for disconnected/connecting or Info button for connected */}
                      {instance.status === "connected" ? (
                        <Button variant="outline" size="sm" onClick={() => handleInfo(instance)} className="w-full">
                          <Info className="mr-2 h-4 w-4" />
                          Informações
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleQRCode(instance)} className="w-full">
                          <QrCode className="mr-2 h-4 w-4" />
                          QR Code
                        </Button>
                      )}

                      {/* Settings button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSettings(instance)}
                        className={`w-full ${instance.status === "connected" || instance.status === "connecting" ? "col-span-1" : "col-span-2"}`}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {selectedInstance && (
        <WhatsAppQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          instanceName={selectedInstance.name}
          apiKey={selectedInstance.api_key}
          status={selectedInstance.status}
        />
      )}

      {/* Settings Modal */}
      {selectedInstance && (
        <WhatsAppSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          instanceName={selectedInstance.name}
          apiKey={selectedInstance.api_key}
        />
      )}

      {/* Info Modal */}
      {selectedInstance && (
        <WhatsAppInfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          instanceName={selectedInstance.name}
          apiKey={selectedInstance.api_key}
        />
      )}

      {/* Instance Creation Modal */}
      <InstanceCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => {
          setIsCreationModalOpen(false)
          fetchData() // Refresh data after creating a new instance
        }}
      />
    </div>
  )
}
