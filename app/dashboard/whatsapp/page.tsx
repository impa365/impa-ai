"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Smartphone, Plus, Trash2, Edit, QrCode, PowerOff, RefreshCw } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import WhatsAppConnectionModal from "@/components/whatsapp-connection-modal"
import { deleteEvolutionInstance } from "@/lib/whatsapp-api"
import WhatsAppQRModal from "@/components/whatsapp-qr-modal"
import WhatsAppSettingsModal from "@/components/whatsapp-settings-modal"
import { syncInstanceStatus, disconnectInstance } from "@/lib/whatsapp-settings-api"

export default function WhatsAppPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  // Estados para WhatsApp
  const [whatsappConnections, setWhatsappConnections] = useState([])
  const [connectionLimit, setConnectionLimit] = useState(2)
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [loadingConnections, setLoadingConnections] = useState(false)

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
    setLoading(false)
  }, [router])

  // Função para buscar conexões WhatsApp do banco
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

  // Função para sincronizar status de uma conexão específica
  const syncConnection = useCallback(
    async (connectionId: string) => {
      if (syncing) return

      setSyncing(true)
      try {
        await syncInstanceStatus(connectionId)
        await fetchWhatsAppConnections()
      } catch (error) {
        console.error("Erro ao sincronizar:", error)
      } finally {
        setSyncing(false)
      }
    },
    [syncing],
  )

  // Carregar conexões quando usuário estiver disponível
  useEffect(() => {
    if (user) {
      fetchWhatsAppConnections()
    }
  }, [user])

  // Sincronizar quando a página for carregada (uma vez)
  useEffect(() => {
    if (user && whatsappConnections.length > 0) {
      // Sincronização silenciosa (sem indicador visual)
      const syncSilently = async () => {
        try {
          for (const connection of whatsappConnections) {
            await syncInstanceStatus(connection.id)
          }
          // Recarregar conexões após sincronização
          await fetchWhatsAppConnections()
        } catch (error) {
          console.error("Erro na sincronização silenciosa:", error)
        }
      }

      syncSilently()
    }
  }, [user, whatsappConnections.length])

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

  const handleDisconnectConnection = async (connection: any) => {
    try {
      const result = await disconnectInstance(connection.instance_name)

      if (result.success) {
        // Sincronizar status após desconectar
        await syncConnection(connection.id)
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error)
    }
  }

  const handleConnectionSuccess = () => {
    fetchWhatsAppConnections()
    setShowConnectionModal(false)
  }

  const handleManualSync = async () => {
    if (syncing || !whatsappConnections.length) return

    setSyncing(true)
    try {
      for (const connection of whatsappConnections) {
        await syncInstanceStatus(connection.id)
      }
      await fetchWhatsAppConnections()
    } catch (error) {
      console.error("Erro na sincronização manual:", error)
    } finally {
      setSyncing(false)
    }
  }

  // Quando o modal QR é aberto, sincronizar a conexão selecionada
  useEffect(() => {
    if (qrModalOpen && selectedConnection) {
      syncConnection(selectedConnection.id)
    }
  }, [qrModalOpen, selectedConnection, syncConnection])

  // Quando o modal de configurações é aberto, sincronizar a conexão selecionada
  useEffect(() => {
    if (settingsModalOpen && selectedConnection) {
      syncConnection(selectedConnection.id)
    }
  }, [settingsModalOpen, selectedConnection, syncConnection])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conexões WhatsApp</h1>
          <p className="text-gray-600">Gerencie suas conexões do WhatsApp Business</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualSync}
            disabled={syncing}
            className="gap-2"
            title="Sincronizar status das conexões"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
          <Button
            onClick={() => setShowConnectionModal(true)}
            className="gap-2"
            disabled={whatsappConnections.length >= connectionLimit}
          >
            <Plus className="w-4 h-4" />
            Nova Conexão
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="text-sm text-gray-500">
          {whatsappConnections.length} de {connectionLimit} conexões utilizadas
          {syncing && <span className="ml-2 text-blue-600">• Sincronizando status...</span>}
        </div>
      </div>

      {whatsappConnections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="w-16 h-16 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhuma conexão WhatsApp</h4>
            <p className="text-gray-600 text-center mb-6">Conecte seu WhatsApp para começar a usar os agentes de IA</p>
            <Button
              onClick={() => setShowConnectionModal(true)}
              className="gap-2"
              disabled={whatsappConnections.length >= connectionLimit}
            >
              <Plus className="w-4 h-4" />
              Primeira Conexão
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                        {connection.last_sync && (
                          <span className="ml-2">
                            • Última sync: {new Date(connection.last_sync).toLocaleTimeString()}
                          </span>
                        )}
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
      )}

      {/* Modais */}
      <WhatsAppConnectionModal
        open={showConnectionModal}
        onOpenChange={setShowConnectionModal}
        userId={user?.id}
        onSuccess={handleConnectionSuccess}
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
            // Atualizar status no banco e sincronizar
            supabase
              .from("whatsapp_connections")
              .update({ status })
              .eq("id", selectedConnection.id)
              .then(() => {
                fetchWhatsAppConnections()
              })
          }
        }}
      />

      <WhatsAppSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        connection={selectedConnection}
        onSettingsSaved={() => {
          console.log("Configurações salvas!")
        }}
      />
    </div>
  )
}
